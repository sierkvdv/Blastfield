
import React, { useRef, useEffect } from 'react';
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { useGameStore } from '../state/useGameStore';
import Terrain from './Terrain';
import Player from './Player';
import Projectile from './Projectile';
import { handleRandomEvents } from '../utils/randomEvents';
import { createExplosion, showDamageText } from './Effects';

const GameEngine: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<PIXI.Application | null>(null);
  const engineRef = useRef<Matter.Engine | null>(null);
  const playersRef = useRef<Player[]>([]);
  const terrainRef = useRef<Terrain | null>(null);

  const { currentTurn, units, wind, randomEvents, power, angle, selectedWeaponId, nextTurn, consumeAmmo, cooldowns, setCooldown, tickCooldowns, setGameOver, gameOver } = useGameStore();

  useEffect(() => {
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x000000
    });
    appRef.current = app;
    if (canvasRef.current) {
      canvasRef.current.appendChild(app.view as any);
    }

    const engine = Matter.Engine.create();
    engine.gravity.y = 1;
    engineRef.current = engine;

    const terrain = new Terrain(app, engine);
    terrainRef.current = terrain;
    playersRef.current = units.map((unit) => new Player(app, engine, unit));

    const ticker = app.ticker.add((delta) => {
      const deltaMs = delta * (1000 / 60);
      Matter.Engine.update(engine, deltaMs);
      tickCooldowns(deltaMs);
      playersRef.current.forEach((p) => {
        if (p.body) {
          p.sprite.x = p.body.position.x - p.sprite.width / 2;
          p.sprite.y = p.body.position.y - p.sprite.height / 2;
        }
      });
      engine.world.bodies.forEach((b) => {
        if (!b.isStatic && b.mass < 5) {
          Matter.Body.applyForce(b, b.position, { x: wind * 0.0001, y: 0 });
        }
      });

      if (!gameOver && playersRef.current.length === 0) {
        setGameOver(true);
      }
    });

    const onCollision = (evt: Matter.IEventCollision<Matter.Engine>) => {
      for (const pair of evt.pairs) {
        const labels = [pair.bodyA.label || '', pair.bodyB.label || ''];
        const hasProjectile = labels.some((l) => l.startsWith('projectile:'));
        if (!hasProjectile) continue;
        const projectileBody = labels[0].startsWith('projectile:') ? pair.bodyA : pair.bodyB;
        const otherBody = projectileBody === pair.bodyA ? pair.bodyB : pair.bodyA;
        const kind = (projectileBody.label || 'projectile:rocket').split(':')[1];
        const { x, y } = projectileBody.position;

        const currentPlayer = playersRef.current[0];
        if (currentPlayer?.ricochetShots && otherBody.label === 'terrain' && kind === 'rocket') {
          const vel = projectileBody.velocity;
          Matter.Body.setVelocity(projectileBody, { x: -vel.x, y: vel.y * 0.9 });
          continue;
        }

        const dmgInfo = handleWeaponImpact(kind, x, y);

        const sprite = (projectileBody as any).sprite as PIXI.Sprite | undefined;
        if (sprite && appRef.current) appRef.current.stage.removeChild(sprite);
        Matter.World.remove(engine.world, projectileBody);

        if (dmgInfo.advanceTurn) {
          setTimeout(() => nextTurn(), 300);
        }
      }
    };
    Matter.Events.on(engine, 'collisionStart', onCollision);

    const handleKeyDown = (e: KeyboardEvent) => {
      const currentPlayer = playersRef.current[0];
      if (!currentPlayer || !engineRef.current || gameOver) return;
      const body = currentPlayer.body;
      const moveAmount = 2.5;

      switch (e.key) {
        case 'ArrowLeft':
          Matter.Body.setPosition(body, { x: body.position.x - moveAmount, y: body.position.y });
          break;
        case 'ArrowRight':
          Matter.Body.setPosition(body, { x: body.position.x + moveAmount, y: body.position.y });
          break;
        case ' ': {
          const w = selectedWeaponId || 'rocket';
          if (cooldowns[w]) return;
          if (!consumeAmmo(w)) return;
          fireProjectileFrom(body.position.x, body.position.y - currentPlayer.sprite.height / 2);
          setCooldown(w, 800);
          break;
        }
        case 'Shift':
          Matter.Body.applyForce(body, body.position, { x: 0, y: -0.03 });
          break;
        case 'w':
          Matter.Body.setVelocity(body, { x: body.velocity.x, y: -6 });
          break;
        case 's':
          Matter.Body.setPosition(body, { x: body.position.x, y: body.position.y + 5 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      Matter.Events.off(engine, 'collisionStart', onCollision as any);
      app.destroy(true);
      Matter.Engine.clear(engine);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fireProjectileFrom = (x: number, y: number) => {
    const app = appRef.current;
    const engine = engineRef.current;
    if (!app || !engine) return;

    const kind = selectedWeaponId || 'rocket';

    if (kind === 'meteor_shower') {
      for (let i = 0; i < 5; i++) {
        const sx = x + (Math.random() - 0.5) * 200;
        new Projectile(app, engine, { x: sx, y: 0 }, { x: 0, y: 5 + Math.random() * 3 }, 'meteor');
      }
      return;
    }

    if (kind === 'laser_beam') {
      const app = appRef.current!;
      const g = new PIXI.Graphics();
      g.lineStyle(2, 0xff0000, 1);
      const theta = (angle * Math.PI) / 180;
      const lx = x + Math.cos(theta) * 600;
      const ly = y - Math.sin(theta) * 600;
      g.moveTo(x, y);
      g.lineTo(lx, ly);
      app.stage.addChild(g);
      setTimeout(() => app.stage.removeChild(g), 200);
      applyLineDamage({ x1: x, y1: y, x2: lx, y2: ly }, 20);
      setTimeout(() => nextTurn(), 300);
      return;
    }

    if (kind === 'black_hole') {
      const engine = engineRef.current!;
      const well = Matter.Bodies.circle(x, y, 10, { isStatic: true });
      well.label = 'black_hole';
      Matter.World.add(engine.world, well);
      const id = setInterval(() => {
        engine.world.bodies.forEach((b) => {
          if (b === well || b.isStatic) return;
          const dx = well.position.x - b.position.x;
          const dy = well.position.y - b.position.y;
          const dist2 = Math.max(100, dx * dx + dy * dy);
          const f = 0.0005 / dist2;
          Matter.Body.applyForce(b, b.position, { x: dx * f, y: dy * f });
        });
      }, 16);
      setTimeout(() => {
        clearInterval(id);
        Matter.World.remove(engine.world, well);
        nextTurn();
      }, 2000);
      return;
    }

    if (kind === 'mirv') {
      const speed = power / 3;
      const theta = (angle * Math.PI) / 180;
      const vx = Math.cos(theta) * speed;
      const vy = -Math.sin(theta) * speed;
      const shell = new Projectile(app, engine, { x, y }, { x: vx, y: vy }, 'mirv_shell');
      setTimeout(() => {
        const pos = (shell as any).body.position;
        for (let i = 0; i < 5; i++) {
          const spread = (i - 2) * 0.4;
          new Projectile(app, engine, { x: pos.x, y: pos.y }, { x: vx + spread, y: vy + i * 0.2 }, 'mirv_child');
        }
      }, 600);
      return;
    }

    const speed = power / 2;
    const theta = (angle * Math.PI) / 180;
    const vx = Math.cos(theta) * speed;
    const vy = -Math.sin(theta) * speed;

    new Projectile(app, engine, { x, y }, { x: vx, y: vy }, kind);
  };

  const weaponDamageSpec: Record<string, { radius?: number; damage: number; line?: boolean }> = {
    rocket: { radius: 40, damage: 30 },
    plasma_ball: { radius: 25, damage: 20 },
    cluster_child: { radius: 20, damage: 15 },
    nuke: { radius: 100, damage: 100 },
    meteor: { radius: 20, damage: 15 },
    mirv_child: { radius: 25, damage: 18 }
  };

  const handleWeaponImpact = (kind: string, x: number, y: number) => {
    const app = appRef.current!;

    const spec = weaponDamageSpec[kind];
    if (spec?.radius) {
      createExplosion(app, x, y, spec.radius);
      const total = applyAreaDamage({ x, y, radius: spec.radius, damage: spec.damage });
      if (total > 0) showDamageText(app, x, y, `-${total}`);
      return { advanceTurn: true };
    }

    if (kind === 'teleport') {
      const p = playersRef.current[0];
      if (p) {
        Matter.Body.setPosition(p.body, { x, y });
      }
      return { advanceTurn: true };
    }

    createExplosion(app, x, y, 20);
    const total = applyAreaDamage({ x, y, radius: 20, damage: 10 });
    if (total > 0) showDamageText(app, x, y, `-${total}`);
    return { advanceTurn: true };
  };

  const applyAreaDamage = ({ x, y, radius, damage }: { x: number; y: number; radius: number; damage: number }) => {
    let total = 0;
    playersRef.current = playersRef.current.filter((p) => {
      const dx = p.body.position.x - x;
      const dy = p.body.position.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        const falloff = 1 - dist / radius;
        const dealt = Math.round(damage * (0.5 + 0.5 * falloff));
        const lethal = p.takeDamage(dealt);
        total += dealt;
        return !lethal;
      }
      return true;
    });
    return total;
  };

  const applyLineDamage = ({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }, damage: number) => {
    const A = y2 - y1;
    const B = x1 - x2;
    const C = x2 * y1 - x1 * y2;
    const denom = Math.sqrt(A * A + B * B) || 1;
    let total = 0;
    playersRef.current = playersRef.current.filter((p) => {
      const { x, y } = p.body.position;
      const dist = Math.abs(A * x + B * y + C) / denom;
      if (dist < 20) {
        total += damage;
        const lethal = p.takeDamage(damage);
        return !lethal;
      }
      return true;
    });
    if (total > 0 && appRef.current) showDamageText(appRef.current, x2, y2, `-${total}`);
  };

  useEffect(() => {
    if (currentTurn !== null) {
      handleRandomEvents(randomEvents);
    }
  }, [currentTurn]);

  return <div ref={canvasRef}></div>;
};

export default GameEngine;
