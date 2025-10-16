import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { Weapon } from '../types';

/**
 * Projectile represents a fired bullet or shell. It contains both a
 * Matter.js circle body for physics simulation and a PixiJS sprite for
 * rendering. The projectile stores the weapon definition it was fired
 * with so that the GameEngine can later determine damage and explosion
 * visuals when collisions occur.
 */
export default class Projectile {
  app: PIXI.Application;
  engine: Matter.Engine;
  weapon: Weapon;
  sprite: PIXI.Graphics;
  body: Matter.Body;

  constructor(
    app: PIXI.Application,
    engine: Matter.Engine,
    position: { x: number; y: number },
    velocity: { x: number; y: number },
    weapon: Weapon
  ) {
    this.app = app;
    this.engine = engine;
    this.weapon = weapon;

    // Draw a simple circle for the projectile. The colour is derived
    // from the weapon definition. Radius is fixed at 6 pixels.
    const radius = 6;
    this.sprite = new PIXI.Graphics();
    this.sprite.beginFill(weapon.color);
    this.sprite.drawCircle(0, 0, radius);
    this.sprite.endFill();
    this.sprite.position.set(position.x, position.y);
    this.app.stage.addChild(this.sprite);

    // Create a circular physics body. We label it so the collision
    // handler can identify projectiles. The plugin property is used
    // to store the weapon id for later lookup.
    this.body = Matter.Bodies.circle(position.x, position.y, radius, {
      restitution: 0.2,
      friction: 0.05,
      frictionAir: 0.002,
      density: 0.01,
      label: 'projectile'
    });
    (this.body as any).plugin = { weaponId: weapon.id };
    Matter.World.add(engine.world, this.body);

    // Assign initial velocity
    Matter.Body.setVelocity(this.body, velocity);
  }

  /**
   * Synchronise the sprite’s position with the physics body each tick.
   */
  update() {
    this.sprite.position.set(this.body.position.x, this.body.position.y);
  }

  /**
   * Destroy this projectile, removing its sprite and body from the world.
   */
  destroy() {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    Matter.World.remove(this.engine.world, this.body);
  }
}