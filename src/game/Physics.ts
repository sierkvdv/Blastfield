
import * as Matter from 'matter-js';

export default class Physics {
  engine: Matter.Engine;

  constructor() {
    this.engine = Matter.Engine.create();
  }

  update(delta: number) {
    Matter.Engine.update(this.engine, delta);
  }
}
