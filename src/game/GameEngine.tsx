import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { useGameStore } from '../state/useGameStore';
import Player from './Player';
import Projectile from './Projectile';
import Terrain from './Terrain';
import Crate from './Crate';
import { createExplosion } from './Effects';
import type { Weapon } from '../types';

/**
 * GameEngine ties together the rendering and physics systems. It
 * initialises PixiJS and Matter.js, spawns players and terrain, listens
 * for input and collision events, manages projectiles and crates, and
 * handles special weapon behaviours like teleportation, jetpacks and
 * beam weapons. State is driven by the Zustand store, allowing UI
 * components to control angle, power, weapon selection and firing.
 */
const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  // Refs to persist game objects across renders
  const playersRef = useRef<Player[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const cratesRef = useRef<Crate[]>([]);
  const terrainRef = useRef<Terrain | null>(null);

  // Extract game state from Zustand. Each selector subscribes to just
  // the portion of state it needs to trigger re-renders.
  const currentTurn = useGameStore((state) => state.currentTurn);
  const units = useGameStore((state) => state.units);
  const angle = useGameStore((state) => state.angle);
  const power = useGameStore((state) => state.power);
  const selectedWeapon = useGameStore((state) => state.selectedWeapon);
  const firing = useGameStore((state) => state.firing);
  const wind = useGameStore((state) => state.wind);
  const weapons = useGameStore((state) => state.weapons);
  const nextTurn = useGameStore((state) => state.nextTurn);
  const setFiring = useGameStore((state) => state.setFiring);
  const ammo = useGameStore((state) => state.ammo);
  const decreaseAmmo = useGameStore((state) => state.decreaseAmmo);
  const increaseAmmo = useGameStore((state) => state.increaseAmmo);
  const setupCompleted = useGameStore((state) => state.setupCompleted);

  /**
   * Initialise the PixiJS renderer and Matter.js world whenever the
   * unit roster changes (e.g. after team selection). This effect also
   * spawns terrain and players, attaches keyboard listeners, and
   * configures collision and ticker callbacks. All cleanup is handled
   * when the component unmounts or units change.
   */
  useEffect(() => {
    // Initialise PixiJS application
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      antialias: true
    });
    appRef.current = app;
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    }
    // Initialise Matter.js engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Create destructible terrain and store reference
    const terrain = new Terrain(app, engine);
    terrainRef.current = terrain;

    // Spawn players on opposing sides. Index 0 and 2 spawn on the left
    // facing right; index 1 and 3 spawn on the right facing left. A
    // margin keeps them away from the edges.
    const margin = 200;
    const createdPlayers: Player[] = units.map((unit, idx) => {
      const facing: 1 | -1 = idx % 2 === 0 ? 1 : -1;
      const x = idx % 2 === 0 ? margin : app.renderer.width - margin;
      const y = app.renderer.height - terrain.getHeightAt(x) - 100;
      const p = new Player(app, engine, unit, { x, y, facing });
      // Visually mirror left/right by flipping container scale
      p.root.scale.x = facing;
      return p;
    });
    playersRef.current = createdPlayers;

    // Collision handling covers projectile impacts, crate collection and
    // cluster bomb spawning. Each collision pair is examined to find
    // projectiles and crates; appropriate actions are taken for each
    // case.
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        // crate collection: crate colliding with player
        if (
          (bodyA.label === 'crate' && bodyB.label === 'player') ||
          (bodyB.label === 'crate' && bodyA.label === 'player')
        ) {
          const crateBody = bodyA.label === 'crate' ? bodyA : bodyB;
          const playerBody = bodyA.label === 'player' ? bodyA : bodyB;
          const crate: any = (crateBody as any).crateRef;
          const playerIndex = playersRef.current.findIndex((p) => p.body === playerBody);
          if (crate && playerIndex !== -1) {
            crate.collect(playerIndex, increaseAmmo, playersRef.current);
            // Remove crate from tracking array
            const idx = cratesRef.current.findIndex((c) => c.body === crateBody);
            if (idx !== -1) cratesRef.current.splice(idx, 1);
          }
          return;
        }
        // projectile impacts: when a projectile collides with any other body
        let projectileBody: Matter.Body | null = null;
        if (bodyA.label === 'projectile') {
          projectileBody = bodyA;
        } else if (bodyB.label === 'projectile') {
          projectileBody = bodyB;
        }
        if (projectileBody) {
          // Identify weapon used via plugin data
          const plugin: any = (projectileBody as any).plugin;
          const weaponId = plugin?.weaponId;
          const weapon = weapons.find((w) => w.id === weaponId) as Weapon | undefined;
          const explosionRadius = weapon?.radius ?? 40;
          const explosionColor = weapon?.explosionColor ?? 0xffff00;
          // Create explosion graphic
          createExplosion(
            app,
            projectileBody.position.x,
            projectileBody.position.y,
            explosionRadius,
            explosionColor
          );
          // Destroy terrain at the impact point
          if (terrainRef.current) {
            terrainRef.current.destroyAt(
              projectileBody.position.x,
              projectileBody.position.y,
              explosionRadius
            );
          }
          // Damage players within explosion radius
          playersRef.current.forEach((p) => {
            const dx = p.body.position.x - projectileBody!.position.x;
            const dy = p.body.position.y - projectileBody!.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= explosionRadius) {
              p.takeDamage(weapon?.damage ?? 20);
            }
          });
          // Cluster or MIRV: spawn secondary projectiles
          if (weapon?.effect === 'cluster' || weapon?.effect === 'multiple') {
            const count = weapon.effect === 'cluster' ? 4 : 5;
            for (let i = 0; i < count; i++) {
              const angleRad = Math.random() * Math.PI * 2;
              const speed = 8 + Math.random() * 4;
              const vx = Math.cos(angleRad) * speed;
              const vy = Math.sin(angleRad) * speed;
              const fragWeapon: Weapon = {
                ...weapon,
                effect: 'blast',
                radius: Math.max(20, weapon.radius * 0.5),
                damage: Math.max(10, weapon.damage * 0.5)
              };
              const frag = new Projectile(
                app,
                engine,
                { x: projectileBody.position.x, y: projectileBody.position.y },
                { x: vx, y: vy },
                fragWeapon
              );
              projectilesRef.current.push(frag);
            }
          }
          // Remove the projectile from world and tracking array
          const idx = projectilesRef.current.findIndex((pr) => pr.body === projectileBody);
          if (idx !== -1) {
            projectilesRef.current[idx].destroy();
            projectilesRef.current.splice(idx, 1);
          }
        }
      });
    });

    // Ticker updates physics, applies wind, updates sprites and crates
    const ticker = app.ticker.add((delta) => {
      // Update physics simulation
      Matter.Engine.update(engine, delta * (1000 / 60));
      // Apply wind to projectiles
      projectilesRef.current.forEach((proj) => {
        const forceMagnitude = wind * 0.0001;
        Matter.Body.applyForce(proj.body, proj.body.position, { x: forceMagnitude, y: 0 });
        proj.update();
        // Remove projectiles that leave the viewport
        if (
          proj.body.position.x < -100 ||
          proj.body.position.x > app.renderer.width + 100 ||
          proj.body.position.y > app.renderer.height + 100
        ) {
          proj.destroy();
          const i = projectilesRef.current.indexOf(proj);
          if (i !== -1) projectilesRef.current.splice(i, 1);
        }
      });
      // Update crates positions and remove crates that fall off screen
      cratesRef.current.forEach((crate, idx) => {
        crate.update();
        if (crate.body.position.y > app.renderer.height + 100) {
          crate.destroy();
          cratesRef.current.splice(idx, 1);
        }
      });
      // Synchronise player graphics with physics bodies and set weapon angle
      const state = useGameStore.getState();
      playersRef.current.forEach((player, index) => {
        if (!player || !(player as any).root || !(player as any).body) return;
        const p: any = player as any;
        p.root.position.set(p.body.position.x, p.body.position.y);
        const isActive = index === state.currentTurn;
        if (typeof p.setActive === 'function') p.setActive(isActive);
        if (isActive && typeof p.updateWeaponAngle === 'function') {
          p.updateWeaponAngle(state.angle);
        }
      });
    });

    // Subscribe to angle/currentTurn changes from the store to rotate the
    // active player's weapon immediately, independent of render timing.
    const unsubscribe = useGameStore.subscribe(
      (state) => ({ angle: state.angle, turn: state.currentTurn }),
      ({ angle: a, turn }) => {
        const p = playersRef.current[turn];
        if (p && p.isAlive) p.updateWeaponAngle(a);
      }
    );

    // Keyboard controls for quick testing (optional). This allows using
    // arrow keys and space bar without relying solely on the UI. Values
    // are clamped within setters in the store.
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (e.code === 'ArrowUp') state.setAngle(state.angle + 2);
      else if (e.code === 'ArrowDown') state.setAngle(state.angle - 2);
      else if (e.code === 'ArrowRight') state.setPower(state.power + 5);
      else if (e.code === 'ArrowLeft') state.setPower(state.power - 5);
      else if (e.code === 'Space') state.setFiring(true);
    };
    window.addEventListener('keydown', handleKeyDown);

    // Clean up on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      app.ticker.remove(ticker);
      app.destroy(true);
      if (engine) {
        Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      }
      unsubscribe();
    };
    // Re-run when units change
  }, [units]);

  /**
   * Spawn random supply crates at the start of each new turn. Crates can
   * grant additional ammo for random weapons or restore health. The
   * chance of spawning a crate can be tuned here. Crates fall under
   * gravity and are collected by colliding with a player.
   */
  useEffect(() => {
    if (!setupCompleted) return;
    const app = appRef.current;
    const engine = engineRef.current;
    if (!app || !engine) return;
    // Only spawn crates at the beginning of a turn (not the first turn of
    // the match before any shot is fired). Adjust spawn probability here.
    const spawnChance = 0.3;
    if (Math.random() < spawnChance) {
      const type: 'ammo' | 'health' = Math.random() < 0.7 ? 'ammo' : 'health';
      const x = Math.random() * app.renderer.width;
      const crate = new Crate(app, engine, x, type);
      if (type === 'ammo') {
        // Choose a random weapon to award ammo for. Ensure the chosen
        // weapon exists in the store. Award a small amount of ammo.
        const weaponIds = weapons.map((w) => w.id);
        crate.weaponId = weaponIds[Math.floor(Math.random() * weaponIds.length)];
        crate.amount = 1;
      } else {
        crate.health = 25;
      }
      cratesRef.current.push(crate);
    }
  }, [currentTurn]);

  /**
   * Effect to handle firing. When the firing flag becomes true this
   * effect launches the selected weapon or performs the weapon's
   * special action (teleport, jetpack, beam). After handling the
   * weapon behaviour the turn advances and the firing flag resets.
   */
  useEffect(() => {
    if (!firing) return;
    const app = appRef.current;
    const engine = engineRef.current;
    if (!app || !engine) return;
    const currentPlayer = playersRef.current[currentTurn];
    if (!currentPlayer || !currentPlayer.isAlive) return;
    // Resolve the selected weapon definition
    const weapon = weapons.find((w) => w.id === selectedWeapon) || weapons[0];
    // Check ammo; if no ammo cancel firing and reset flag
    // Temporarily allow firing regardless of ammo to avoid blocking
    // Helper to end turn and deduct ammo
    const finishTurn = () => {
      try { decreaseAmmo(currentTurn, weapon.id); } catch {}
      nextTurn();
      setFiring(false);
    };
    // Compute muzzle position and direction for projectiles and beams
    const radians = (angle * Math.PI) / 180;
    const barrelLength = 30;
    const facing = currentPlayer.facing;
    const muzzleX =
      currentPlayer.root.position.x +
      currentPlayer.mountPoint.x +
      Math.cos(radians) * barrelLength * facing;
    const muzzleY =
      currentPlayer.root.position.y +
      currentPlayer.mountPoint.y -
      Math.sin(radians) * barrelLength;
    // Weapon specific behaviours
    if (weapon.effect === 'teleport') {
      // Teleport the unit to a random horizontal location above the ground
      const worldWidth = app.renderer.width;
      const margin = 80;
      const newX = Math.random() * (worldWidth - margin * 2) + margin;
      let newY = 100;
      if (terrainRef.current) {
        const groundHeight = terrainRef.current.getHeightAt(newX);
        newY = app.renderer.height - groundHeight - currentPlayer.height / 2 - 1;
      }
      Matter.Body.setPosition(currentPlayer.body, { x: newX, y: newY });
      currentPlayer.root.position.set(newX, newY);
      finishTurn();
      return;
    }
    if (weapon.effect === 'fly') {
      // Jetpack: apply an upward and slight forward impulse
      const impulseMagnitude = 0.05;
      Matter.Body.applyForce(currentPlayer.body, currentPlayer.body.position, {
        x: 0.03 * facing,
        y: -impulseMagnitude
      });
      finishTurn();
      return;
    }
    if (weapon.effect === 'beam') {
      // Beam weapon: perform an instantaneous line attack
      const beamLength = app.renderer.width;
      const endX = muzzleX + Math.cos(radians) * beamLength * facing;
      const endY = muzzleY - Math.sin(radians) * beamLength;
      playersRef.current.forEach((p, idx) => {
        if (!p.isAlive || idx === currentTurn) return;
        // Distance from player centre to beam line
        const px = p.body.position.x;
        const py = p.body.position.y;
        const num = Math.abs((endY - muzzleY) * px - (endX - muzzleX) * py + endX * muzzleY - endY * muzzleX);
        const den = Math.sqrt((endY - muzzleY) ** 2 + (endX - muzzleX) ** 2);
        const dist = den > 0 ? num / den : Infinity;
        if (dist <= 20) {
          p.takeDamage(weapon.damage);
        }
      });
      // Draw temporary beam graphic
      const beamGraphic = new PIXI.Graphics();
      beamGraphic.lineStyle(3, weapon.color, 1);
      beamGraphic.moveTo(muzzleX, muzzleY);
      beamGraphic.lineTo(endX, endY);
      beamGraphic.endFill();
      app.stage.addChild(beamGraphic);
      let beamElapsed = 0;
      const beamTicker = app.ticker.add((delta) => {
        beamElapsed += delta;
        if (beamElapsed > 10) {
          app.ticker.remove(beamTicker);
          if (beamGraphic.parent) beamGraphic.parent.removeChild(beamGraphic);
        }
      });
      finishTurn();
      return;
    }
    // Default case: spawn a projectile with velocity based on power
    const minSpeed = 12;
    const maxBoost = 45;
    const speed = minSpeed + (power / 100) * maxBoost;
    const vx = Math.cos(radians) * speed * facing;
    const vy = -Math.sin(radians) * speed;
    const projectile = new Projectile(app, engine, { x: muzzleX, y: muzzleY }, { x: vx, y: vy }, weapon);
    projectilesRef.current.push(projectile);
    finishTurn();
  }, [firing]);

  /**
   * Whenever the global angle changes rotate the active player's weapon
   * immediately. Without this effect the weapon would only update
   * during the ticker loop, causing a delay when sliding the UI
   * controls.
   */
  useEffect(() => {
    const p = playersRef.current[currentTurn];
    if (p && p.isAlive && typeof p.updateWeaponAngle === 'function') {
      p.updateWeaponAngle(angle);
    }
  }, [angle, currentTurn]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default GameEngine;