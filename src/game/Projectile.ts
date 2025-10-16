
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';

export default class Projectile {
  app: PIXI.Application;
  engine: Matter.Engine;
  sprite: PIXI.Sprite;
  body: Matter.Body;
  kind: string;

  constructor(app: PIXI.Application, engine: Matter.Engine, position: { x: number; y: number }, velocity: { x: number; y: number }, kind: string = 'rocket') {
    this.app = app;
    this.engine = engine;
    this.kind = kind;

    const graphics = new PIXI.Graphics();
    graphics.beginFill(0xe74c3c);
    graphics.drawCircle(0, 0, 8);
    graphics.endFill();

    const texture = app.renderer.generateTexture(graphics);
    this.sprite = new PIXI.Sprite(texture);
    this.sprite.x = position.x;
    this.sprite.y = position.y;
    this.app.stage.addChild(this.sprite);

    this.body = Matter.Bodies.circle(position.x, position.y, 8, {
      restitution: 0.3,
      friction: 0.2
    });
    this.body.label = `projectile:${this.kind}`;
    (this.body as any).sprite = this.sprite;
    Matter.World.add(this.engine.world, this.body);

    // Apply initial velocity
    Matter.Body.setVelocity(this.body, velocity);
  }
}
