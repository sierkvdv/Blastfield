import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import type { Unit } from '../types';

/**
 * Player is responsible for drawing a unit on screen and synchronising a
 * corresponding Matter.js body. Each instance holds its own container
 * containing the body graphics and a weapon graphics that rotates with
 * the firing angle. The class also tracks basic health and exposes
 * methods to update the weapon orientation and take damage.
 */
export default class Player {
  /** Reference to the PixiJS application used for rendering. */
  app: PIXI.Application;
  /** Reference to the Matter.js engine used for physics. */
  engine: Matter.Engine;
  /** Definition of the unit used to derive stats, colour and shape. */
  unit: Unit;
  /** Root container grouping together the body and weapon. */
  root: PIXI.Container;
  /** Graphics used to draw the body. */
  bodyGraphics: PIXI.Graphics;
  /** Graphics used to draw the weapon barrel. */
  weaponGraphics: PIXI.Graphics;
  /** Physics body representing the unit in the Matter.js world. */
  body: Matter.Body;
  /** Mount point on the body from which the weapon protrudes. */
  mountPoint: { x: number; y: number };
  /** Current health of the player derived from the unit stats. */
  health: number;
  /** Dimensions used to compute placement of the graphics. */
  width: number;
  height: number;

  constructor(app: PIXI.Application, engine: Matter.Engine, unit: Unit) {
    this.app = app;
    this.engine = engine;
    this.unit = unit;
    this.health = unit.stats.health;
    this.root = new PIXI.Container();

    // Determine body dimensions based on shape. The default size is 50x30.
    let width = 50;
    let height = 30;
    switch (unit.shape) {
      case 'circle':
        width = height = 40;
        break;
      case 'roundedRect':
        width = 50;
        height = 40;
        break;
      case 'ellipse':
        width = 60;
        height = 30;
        break;
      case 'triangle':
        width = 50;
        height = 40;
        break;
      case 'rectangle':
      default:
        width = 50;
        height = 30;
        break;
    }
    this.width = width;
    this.height = height;

    // Draw the body based on the unit shape and colour.
    this.bodyGraphics = new PIXI.Graphics();
    this.bodyGraphics.beginFill(unit.color);
    switch (unit.shape) {
      case 'circle':
        this.bodyGraphics.drawCircle(0, 0, width / 2);
        break;
      case 'roundedRect':
        this.bodyGraphics.drawRoundedRect(-width / 2, -height / 2, width, height, 8);
        break;
      case 'ellipse':
        this.bodyGraphics.drawEllipse(0, 0, width / 2, height / 2);
        break;
      case 'triangle':
        this.bodyGraphics.moveTo(-width / 2, height / 2);
        this.bodyGraphics.lineTo(0, -height / 2);
        this.bodyGraphics.lineTo(width / 2, height / 2);
        this.bodyGraphics.closePath();
        break;
      case 'rectangle':
      default:
        this.bodyGraphics.drawRect(-width / 2, -height / 2, width, height);
        break;
    }
    this.bodyGraphics.endFill();

    // Add body graphics to the container.
    this.root.addChild(this.bodyGraphics);

    // Create the weapon graphics. A simple rectangle pointing to the right
    // with its pivot at the left side so it rotates around its base.
    const weaponLength = 30;
    const weaponThickness = 6;
    this.weaponGraphics = new PIXI.Graphics();
    this.weaponGraphics.beginFill(0xffffff);
    this.weaponGraphics.drawRect(0, -weaponThickness / 2, weaponLength, weaponThickness);
    this.weaponGraphics.endFill();
    // Set pivot to the origin (base of the barrel) so rotation occurs around base.
    this.weaponGraphics.pivot.set(0, 0);

    // Compute mount point: attach weapon at the top centre of the body.
    this.mountPoint = { x: 0, y: -height / 2 };
    this.weaponGraphics.position.set(this.mountPoint.x, this.mountPoint.y);
    this.root.addChild(this.weaponGraphics);

    // Set initial position randomly along the x-axis and above the terrain.
    this.root.position.set(Math.random() * (app.renderer.width - width) + width / 2, 200);
    this.app.stage.addChild(this.root);

    // Create the physics body. Use a rectangle for all shapes for simplicity.
    this.body = Matter.Bodies.rectangle(this.root.position.x, this.root.position.y, width, height, {
      restitution: 0.4,
      friction: 0.8,
      density: 0.5,
      label: 'player'
    });
    Matter.World.add(this.engine.world, this.body);
  }

  /**
   * Update the weapon rotation based on a firing angle. The angle is
   * provided in degrees and converted to radians. Positive angles aim
   * upwards (counter‑clockwise). This does not affect the physics body.
   */
  updateWeaponAngle(angle: number) {
    // Angle 0..180 with 90 straight up. Convert to facing-aware rotation.
    const radians = (angle * Math.PI) / 180;
    const rot = this.root.scale.x >= 0 ? -radians : radians - Math.PI;
    this.weaponGraphics.rotation = rot;
  }

  /**
   * Apply damage to the player. When health drops below zero the root
   * container is removed from the stage and the physics body is removed
   * from the world. This simple implementation does not handle player
   * elimination beyond removing them from the scene.
   */
  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      // Remove sprite from stage
      if (this.root.parent) {
        this.root.parent.removeChild(this.root);
      }
      // Remove body from physics engine
      Matter.World.remove(this.engine.world, this.body);
    }
  }
}