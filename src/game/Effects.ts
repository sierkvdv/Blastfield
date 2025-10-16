
import * as PIXI from 'pixi.js';

export function createExplosion(app: PIXI.Application, x: number, y: number, radius: number) {
  const graphics = new PIXI.Graphics();
  graphics.beginFill(0xffff00, 0.5);
  graphics.drawCircle(x, y, radius);
  graphics.endFill();
  app.stage.addChild(graphics);

  // Fade out animation
  let elapsed = 0;
  const duration = 500;
  const ticker = app.ticker.add((delta) => {
    elapsed += delta * (1000 / 60);
    if (elapsed > duration) {
      app.ticker.remove(ticker);
      app.stage.removeChild(graphics);
    } else {
      graphics.alpha = 1 - elapsed / duration;
    }
  });
}

export function showDamageText(app: PIXI.Application, x: number, y: number, text: string) {
  const style = new PIXI.TextStyle({ fill: '#ff4444', fontSize: 18, fontWeight: 'bold' });
  const t = new PIXI.Text(text, style);
  t.x = x; t.y = y;
  app.stage.addChild(t);
  let elapsed = 0;
  const duration = 700;
  const ticker = app.ticker.add((delta) => {
    elapsed += delta * (1000 / 60);
    t.y -= 0.4 * delta;
    t.alpha = Math.max(0, 1 - elapsed / duration);
    if (elapsed > duration) {
      app.ticker.remove(ticker);
      app.stage.removeChild(t);
    }
  });
}
