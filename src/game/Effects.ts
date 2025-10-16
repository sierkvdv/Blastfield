import * as PIXI from 'pixi.js';

/**
 * Create a fading explosion graphic at the given world coordinates.
 * The explosion is drawn as a filled circle with the provided colour and
 * radius. Over 500ms the graphic fades out before removing itself.
 *
 * @param app PixiJS Application to render into.
 * @param x X‑coordinate of the explosion centre.
 * @param y Y‑coordinate of the explosion centre.
 * @param radius Size of the explosion in pixels.
 * @param color Fill colour for the explosion (decimal RGB).
 */
export function createExplosion(
  app: PIXI.Application,
  x: number,
  y: number,
  radius: number,
  color: number
) {
  const graphic = new PIXI.Graphics();
  graphic.beginFill(color, 0.6);
  graphic.drawCircle(0, 0, radius);
  graphic.endFill();
  graphic.position.set(x, y);
  app.stage.addChild(graphic);

  let elapsed = 0;
  const duration = 500; // ms
  const ticker = app.ticker.add((delta) => {
    // delta is in frames; convert to milliseconds based on 60fps
    elapsed += delta * (1000 / 60);
    if (elapsed >= duration) {
      app.ticker.remove(ticker);
      if (graphic.parent) graphic.parent.removeChild(graphic);
    } else {
      graphic.alpha = 1 - elapsed / duration;
    }
  });
}
