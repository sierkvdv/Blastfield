import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { useGameStore } from '../state/useGameStore';
import Player from './Player';
import Projectile from './Projectile';
import Terrain from './Terrain';
import { createExplosion } from './Effects';
import type { Weapon } from '../types';

/**
 * GameEngine is the heart of the game. It initialises the PixiJS renderer
 * and Matter.js physics engine, creates the terrain and units based on
 * the current game state, and runs a ticker loop to synchronise physics
 * with rendering. It listens to store updates for angle, power, weapon
 * selection and firing, and will spawn projectiles when requested.
 */
const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  // Keep track of Player and Projectile instances between renders
  const playersRef = useRef<Player[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);

  // Extract values and actions from the game store. Using the
  // selector functions here ensures the component updates when
  // these specific pieces of state change.
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

  // Set up Pixi and Matter.js when the component mounts or when
  // the `units` array changes (e.g. after initialisation or team
  // selection). Clean up resources when unmounting.
  useEffect(() => {
    // Create renderer
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000,
      // Enable antialias for smoother graphics
      antialias: true
    });
    appRef.current = app;
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view as HTMLCanvasElement);
    }
    // Create physics engine
    const engine = Matter.Engine.create();
    engineRef.current = engine;

    // Create a simple terrain. The Terrain class also adds a static
    // ground body to the Matter world so players and projectiles can
    // collide with it.
    // eslint-disable-next-line no-new
    new Terrain(app, engine);

    // Spawn players based on selected units. Store Player instances
    // so we can update them each frame.
    // Spawn players with deterministic sides: index 0 on the left facing right, index 1 on the right facing left, etc.
    const margin = 120;
    const createdPlayers: Player[] = units.map((unit, idx) => {
      const facing: 1 | -1 = idx % 2 === 0 ? 1 : -1;
      const x = idx % 2 === 0 ? margin : app.renderer.width - margin;
      const y = 200;
      return new Player(app, engine, unit, { x, y, facing });
    });
    playersRef.current = createdPlayers;

    // Listen for collisions so we know when a projectile hits
    Matter.Events.on(engine, 'collisionStart', (event) => {
      event.pairs.forEach((pair) => {
        const { bodyA, bodyB } = pair;
        let projectileBody: Matter.Body | null = null;
        let otherBody: Matter.Body | null = null;
        if (bodyA.label === 'projectile') {
          projectileBody = bodyA;
          otherBody = bodyB;
        } else if (bodyB.label === 'projectile') {
          projectileBody = bodyB;
          otherBody = bodyA;
        }
        if (projectileBody) {
          // Determine which weapon was used from the plugin data
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
          // Deal damage to players within the explosion radius
          playersRef.current.forEach((p) => {
            const dx = p.body.position.x - projectileBody!.position.x;
            const dy = p.body.position.y - projectileBody!.position.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= explosionRadius) {
              p.takeDamage(weapon?.damage ?? 20);
            }
          });
          // Remove the projectile from the physics world and stage
          const idx = projectilesRef.current.findIndex((pr) => pr.body === projectileBody);
          if (idx !== -1) {
            projectilesRef.current[idx].destroy();
            projectilesRef.current.splice(idx, 1);
          }
        }
      });
    });

    // Add ticker to update physics and synchronise sprites
    const ticker = app.ticker.add((delta) => {
      // Update physics world. Scale delta to ms based on 60fps.
      Matter.Engine.update(engine, delta * (1000 / 60));
      // Apply wind force to projectiles and update sprite positions
      projectilesRef.current.forEach((proj) => {
        const forceMagnitude = wind * 0.0001;
        Matter.Body.applyForce(proj.body, proj.body.position, { x: forceMagnitude, y: 0 });
        proj.update();
        // Remove projectiles that have left the viewport
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
      // Synchronise player sprites with physics bodies and update weapon angle
      playersRef.current.forEach((player, index) => {
        player.root.position.set(player.body.position.x, player.body.position.y);
        // Active player's weapon follows current angle; also highlight active weapon
        const isActive = index === currentTurn && player.isAlive;
        player.setActive(isActive);
        // Do NOT set angle here; the ticker would overwrite live updates from the angle effect.
      });
    });

    // Handle keyboard controls for angle/power/firing. Storing the
    // listeners separately allows us to remove them on cleanup.
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (e.code === 'ArrowUp') {
        state.setAngle(state.angle + 2);
      } else if (e.code === 'ArrowDown') {
        state.setAngle(state.angle - 2);
      } else if (e.code === 'ArrowRight') {
        state.setPower(state.power + 5);
      } else if (e.code === 'ArrowLeft') {
        state.setPower(state.power - 5);
      } else if (e.code === 'Space') {
        state.setFiring(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function runs when component unmounts
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      app.ticker.remove(ticker);
      app.destroy(true);
      if (engine) {
        Matter.World.clear(engine.world, false);
      Matter.Engine.clear(engine);
      }
    };
    // Note: depend on `units` so that when the selection changes a new
    // physics world and set of players is created.
  }, [units]);

  // Spawn a projectile whenever the firing flag becomes true. This effect
  // resets the flag and rotates to the next player's turn. Because
  // projectiles are created outside of React’s render cycle we access
  // refs for the Pixi and Matter instances directly.
  useEffect(() => {
    if (!firing) return;
    const app = appRef.current;
    const engine = engineRef.current;
    if (!app || !engine) return;
    const currentPlayer = playersRef.current[currentTurn];
    if (!currentPlayer || !currentPlayer.isAlive) return;
    // Find the selected weapon definition. Fallback to the first weapon.
    const weapon = weapons.find((w) => w.id === selectedWeapon) || weapons[0];
    // Convert angle to radians. 0° points right, 90° points up.
    const radians = (angle * Math.PI) / 180;
    // Determine projectile speed based on power. Stronger scaling to reach across the map.
    const minSpeed = 10; // pixels/frame baseline
    const maxBoost = 40; // additional pixels/frame at 100 power (significant reach)
    const speed = minSpeed + (power / 100) * maxBoost;
    const facing = currentPlayer.facing;
    const vx = Math.cos(radians) * speed * facing;
    const vy = -Math.sin(radians) * speed;
    // Calculate muzzle position based off the player's mount point and barrel length (30px)
    const barrelLength = 30;
    const muzzleX =
      currentPlayer.root.position.x +
      currentPlayer.mountPoint.x +
      Math.cos(radians) * barrelLength * facing;
    // Positive angles should aim upward (negative y). Subtract the sin component to move the muzzle above the body.
    const muzzleY =
      currentPlayer.root.position.y +
      currentPlayer.mountPoint.y -
      Math.sin(radians) * barrelLength;
    // Create projectile and push onto our array
    const projectile = new Projectile(app, engine, { x: muzzleX, y: muzzleY }, { x: vx, y: vy }, weapon);
    projectilesRef.current.push(projectile);
    // Advance to next turn and reset firing flag
    nextTurn();
    setFiring(false);
  }, [firing]);

  // When the angle changes ensure the current player's weapon rotates. This
  // ensures that if the user drags the angle slider the graphic updates
  // immediately even if they haven’t fired.
  useEffect(() => {
    const player = playersRef.current[currentTurn];
    if (player && player.isAlive) {
      player.updateWeaponAngle(angle);
    }
  }, [angle, currentTurn]);

  return <div ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
};

export default GameEngine;