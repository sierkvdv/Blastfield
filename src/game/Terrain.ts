
import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';

export default class Terrain {
  app: PIXI.Application;
  engine: Matter.Engine;
  graphics: PIXI.Graphics;
  body!: Matter.Body;

  constructor(app: PIXI.Application, engine: Matter.Engine) {
    this.app = app;
    this.engine = engine;
    this.graphics = new PIXI.Graphics();
    this.generateTerrain();
    this.app.stage.addChild(this.graphics);
  }

  generateTerrain() {
    // Simple flat terrain with a hill for demonstration
    const width = this.app.renderer.width;
    const height = this.app.renderer.height;
    const hillHeight = height / 3;

    this.graphics.beginFill(0x8B4513);
    this.graphics.moveTo(0, height);
    this.graphics.lineTo(width / 3, hillHeight * 2);
    this.graphics.lineTo(width * 2 / 3, hillHeight * 2);
    this.graphics.lineTo(width, height);
    this.graphics.endFill();

    // Create Matter body to interact with projectiles and players
    this.body = Matter.Bodies.rectangle(width / 2, height - 10, width, 20, {
      isStatic: true,
      angle: 0
    });
    this.body.label = 'terrain';
    Matter.World.add(this.engine.world, this.body);
  }
}
