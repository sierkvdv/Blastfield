import * as PIXI from 'pixi.js';
import * as Matter from 'matter-js';

/**
 * Terrain generates and manages a destructible landscape comprised of many
 * vertical segments. Each segment has an independent height and is
 * represented by both a Matter.js static body (for collisions) and a
 * PixiJS rectangle (for rendering). When explosions occur the
 * `destroyAt` method can be used to carve away portions of the terrain
 * by shortening or removing individual segments. A helper method
 * `getHeightAt` returns the current surface height at an x‑coordinate.
 */
export default class Terrain {
  app: PIXI.Application;
  engine: Matter.Engine;
  /** Container grouping all segment graphics together. */
  container: PIXI.Container;
  /** Array of physics bodies for each terrain segment. Null if removed. */
  segmentBodies: Array<Matter.Body | null>;
  /** Array of graphics corresponding to each terrain segment. Null if removed. */
  segmentGraphics: Array<PIXI.Graphics | null>;
  /** Width of each terrain segment in pixels. */
  segmentWidth: number;
  /** Current height of each segment in pixels. */
  heights: number[];

  constructor(app: PIXI.Application, engine: Matter.Engine) {
    this.app = app;
    this.engine = engine;
    this.container = new PIXI.Container();
    this.segmentBodies = [];
    this.segmentGraphics = [];
    // Choose a relatively small segment width to allow finer terrain detail.
    this.segmentWidth = 40;
    this.heights = [];
    this.generateTerrain();
    this.app.stage.addChild(this.container);
  }

  /**
   * Generate a new random terrain. The ground height is chosen per
   * segment within a sensible range to create hills and valleys. Static
   * Matter bodies are created for each segment so that units and
   * projectiles collide with the ground rather than pass through it.
   */
  generateTerrain() {
    const width = this.app.renderer.width;
    const height = this.app.renderer.height;
    const segmentCount = Math.ceil(width / this.segmentWidth);
    for (let i = 0; i < segmentCount; i++) {
      const xStart = i * this.segmentWidth;
      // Generate height using a simple random value within a band. This
      // could be replaced with perlin noise or other algorithms for
      // smoother terrain, but random values give varied battlefields.
      const minHeight = height * 0.3;
      const maxHeight = height * 0.6;
      const segHeight = minHeight + Math.random() * (maxHeight - minHeight);
      this.heights[i] = segHeight;
      // Pixi graphic for this segment
      const g = new PIXI.Graphics();
      g.beginFill(0x8b4513);
      g.drawRect(0, 0, this.segmentWidth, segHeight);
      g.endFill();
      g.position.set(xStart, height - segHeight);
      this.container.addChild(g);
      this.segmentGraphics[i] = g;
      // Matter body for collisions. Note: bodies are centred on the
      // rectangle's centre. Use a custom label for terrain.
      const body = Matter.Bodies.rectangle(
        xStart + this.segmentWidth / 2,
        height - segHeight / 2,
        this.segmentWidth,
        segHeight,
        {
          isStatic: true,
          label: 'terrain'
        }
      );
      Matter.World.add(this.engine.world, body);
      this.segmentBodies[i] = body;
    }
  }

  /**
   * Destroy or shrink terrain segments within the given explosion radius.
   * The algorithm computes overlap based solely on horizontal distance
   * from the explosion centre. Segments closer to the centre are
   * shortened proportionally, leaving holes that units and projectiles
   * can fall into. If a segment's height drops to zero it is removed
   * entirely.
   *
   * @param x X‑coordinate of the explosion centre.
   * @param y Y‑coordinate of the explosion centre (unused in this
   *     implementation but provided for future expansion).
   * @param radius Explosion radius in pixels.
   */
  destroyAt(x: number, y: number, radius: number) {
    const height = this.app.renderer.height;
    for (let i = 0; i < this.segmentBodies.length; i++) {
      const body = this.segmentBodies[i];
      if (!body) continue;
      const segX = body.position.x;
      const dx = Math.abs(x - segX);
      if (dx <= radius) {
        // Determine how much to subtract from this segment's height based
        // on proximity to the explosion centre. Segments at the centre
        // lose the full radius; at the edge lose nothing.
        const overlap = radius - dx;
        let newHeight = this.heights[i] - overlap;
        if (newHeight < 0) newHeight = 0;
        if (newHeight < this.heights[i]) {
          // Remove old physics body
          Matter.World.remove(this.engine.world, body);
          this.segmentBodies[i] = null;
          // Clear old graphic
          const g = this.segmentGraphics[i];
          if (g) {
            g.clear();
          }
          if (newHeight > 0) {
            // Redraw the segment with the shortened height
            if (g) {
              g.beginFill(0x8b4513);
              g.drawRect(0, 0, this.segmentWidth, newHeight);
              g.endFill();
              g.position.y = height - newHeight;
            }
            // Create a new static body with the new height
            const newBody = Matter.Bodies.rectangle(
              segX,
              height - newHeight / 2,
              this.segmentWidth,
              newHeight,
              { isStatic: true, label: 'terrain' }
            );
            Matter.World.add(this.engine.world, newBody);
            this.segmentBodies[i] = newBody;
            this.heights[i] = newHeight;
          } else {
            // If the height falls to zero remove the graphic entirely
            if (g && g.parent) {
              g.parent.removeChild(g);
            }
            this.segmentGraphics[i] = null;
            this.heights[i] = 0;
          }
        }
      }
    }
  }

  /**
   * Return the current surface height of the terrain at the specified
   * x‑coordinate. If the coordinate falls between segments the nearest
   * segment's height is returned. This function can be used to place
   * objects on the ground or to avoid teleporting units inside the
   * terrain.
   *
   * @param x Horizontal coordinate in pixels.
   */
  getHeightAt(x: number): number {
    const index = Math.floor(x / this.segmentWidth);
    if (index < 0 || index >= this.heights.length) return 0;
    return this.heights[index];
  }
}