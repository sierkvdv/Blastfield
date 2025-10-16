import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';

/**
 * Types of crates that can spawn in the world. Ammo crates award extra
 * ammunition for a specific weapon, while health crates restore a portion
 * of the player's health. Additional crate types can be added here in
 * future iterations (e.g. armour, special powerups).
 */
export type CrateType = 'ammo' | 'health';

/**
 * Crate represents a falling supply drop. It consists of a small PixiJS
 * graphic for rendering and a corresponding Matter.js body so that
 * gravity and collisions are simulated. When a player collides with a
 * crate the associated reward is applied and the crate removes itself
 * from the stage and physics world.
 */
export default class Crate {
  /** Reference to the PixiJS application for rendering. */
  app: PIXI.Application;
  /** Reference to the Matter.js engine for physics. */
  engine: Matter.Engine;
  /** What type of crate this is (ammo or health). */
  type: CrateType;
  /** Optional weapon identifier for ammo crates. */
  weaponId?: string;
  /** Amount of ammo to award when collected (for ammo crates). */
  amount?: number;
  /** Amount of health to restore when collected (for health crates). */
  health?: number;
  /** PixiJS graphic used to draw the crate. */
  sprite: PIXI.Graphics;
  /** Physics body for collision and gravity simulation. */
  body: Matter.Body;

  constructor(
    app: PIXI.Application,
    engine: Matter.Engine,
    x: number,
    type: CrateType
  ) {
    this.app = app;
    this.engine = engine;
    this.type = type;
    // Create a simple square graphic. Colours are chosen based on crate type.
    const size = 20;
    this.sprite = new PIXI.Graphics();
    const colour = type === 'ammo' ? 0xffff00 : 0x00ff00;
    this.sprite.beginFill(colour);
    this.sprite.drawRect(-size / 2, -size / 2, size, size);
    this.sprite.endFill();
    this.app.stage.addChild(this.sprite);
    // Create physics body. Crates fall under gravity and can collide with
    // the terrain and players. Use a slightly reduced friction so they
    // slide to a stop on slopes. Label the body so collision handlers
    // can identify crates. Attach a reference to this class on the body
    // for easy lookup during collisions.
    this.body = Matter.Bodies.rectangle(x, -size, size, size, {
      restitution: 0.2,
      friction: 0.5,
      frictionAir: 0.02,
      label: 'crate'
    });
    (this.body as any).crateRef = this;
    Matter.World.add(engine.world, this.body);
  }

  /**
   * Synchronise the PixiJS sprite with the Matter.js body. Called each
   * frame by the GameEngine ticker to keep the graphics in sync.
   */
  update() {
    this.sprite.position.set(this.body.position.x, this.body.position.y);
  }

  /**
   * Remove the crate from both the physics world and the PixiJS stage.
   * This should be called after a crate has been collected or leaves
   * the screen.
   */
  destroy() {
    if (this.sprite.parent) {
      this.sprite.parent.removeChild(this.sprite);
    }
    Matter.World.remove(this.engine.world, this.body);
  }

  /**
   * Apply the crate's effect to the given player. For ammo crates this
   * increases the ammo count of the specified weapon by the given
   * amount. For health crates this restores a portion of the player's
   * health up to their maximum. After applying the effect the crate
   * removes itself from the scene.
   *
   * @param playerIndex Index of the player collecting the crate.
   * @param increaseAmmo Function from the store used to adjust ammo counts.
   * @param players Array of Player instances to allow health restoration.
   */
  collect(
    playerIndex: number,
    increaseAmmo: (playerIndex: number, weaponId: string, amount: number) => void,
    players: { health: number; unit: { stats: { health: number } }; updateHealthBar: () => void }[]
  ) {
    if (this.type === 'ammo' && this.weaponId) {
      // Increase ammo for the specified weapon.
      increaseAmmo(playerIndex, this.weaponId, this.amount ?? 1);
    } else if (this.type === 'health') {
      // Restore health but do not exceed the unit's maximum health.
      const player = players[playerIndex];
      const maxHealth = player.unit.stats.health;
      player.health = Math.min(player.health + (this.health ?? 20), maxHealth);
      player.updateHealthBar();
    }
    this.destroy();
  }
}