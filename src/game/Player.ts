
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';
import { Unit } from '../data/units';

export default class Player {
  app: PIXI.Application;
  engine: Matter.Engine;
  unit: Unit;
  sprite: PIXI.Sprite;
  body: Matter.Body;
  shieldActive: boolean = false;
  ricochetShots: boolean = false;
  health: number;

  constructor(app: PIXI.Application, engine: Matter.Engine, unit: Unit) {
    this.app = app;
    this.engine = engine;
    this.unit = unit;

    // Create a simple colored square as placeholder
    const graphics = new PIXI.Graphics();
    graphics.beginFill(0x3498db);
    graphics.drawRect(0, 0, 40, 40);
    graphics.endFill();

    // Convert graphics to texture
    const texture = app.renderer.generateTexture(graphics);
    this.sprite = new PIXI.Sprite(texture);

    // Set initial position
    this.sprite.x = Math.random() * (app.renderer.width - 40);
    this.sprite.y = 100; // spawn near top
    this.app.stage.addChild(this.sprite);

    // Create Matter body
    this.body = Matter.Bodies.rectangle(this.sprite.x + 20, this.sprite.y + 20, 40, 40, {
      restitution: 0.4,
      friction: 0.8,
      density: 0.5
    });
    this.body.label = 'player';
    Matter.World.add(this.engine.world, this.body);

    // Stats
    this.health = (unit as any)?.stats?.health ?? 100;

    // Special flags based on unit
    if (unit.special === 'Energy Shield') {
      this.shieldActive = true; // prototype
    }
    if (unit.special === 'Ricochet Shot') {
      this.ricochetShots = true;
    }
  }

  takeDamage(amount: number) {
    const final = this.shieldActive ? Math.max(0, amount * 0.6) : amount; // 40% reduction when shield
    this.health -= final;
    // brief flash
    this.sprite.tint = 0xff5555;
    setTimeout(() => (this.sprite.tint = 0xffffff), 120);
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  destroy() {
    try {
      this.app.stage.removeChild(this.sprite);
    } catch {}
    Matter.World.remove(this.engine.world, this.body);
  }
}
