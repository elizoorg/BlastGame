import { MOCKUP_LAYOUT } from '../core/constants';

export class CocosLayout {
  static rectCenter(x: number, y: number, w: number, h: number): cc.Vec2 {
    const cx = (x + w / 2) - MOCKUP_LAYOUT.canvas.width / 2;
    const cy = MOCKUP_LAYOUT.canvas.height / 2 - (y + h / 2);
    return cc.v2(cx, cy);
  }

  static point(x: number, y: number): cc.Vec2 {
    const cx = x - MOCKUP_LAYOUT.canvas.width / 2;
    const cy = MOCKUP_LAYOUT.canvas.height / 2 - y;
    return cc.v2(cx, cy);
  }

  static top(y: number): number {
    return MOCKUP_LAYOUT.canvas.height / 2 - y;
  }

  static bottom(y: number): number {
    return -(y - MOCKUP_LAYOUT.canvas.height / 2);
  }

  static get movesAreaCenter(): cc.Vec2 {
    const m = MOCKUP_LAYOUT.movesArea;
    return this.rectCenter(m.x, m.y, m.w, m.h);
  }

  static get movesCircleCenter(): cc.Vec2 {
    const m = MOCKUP_LAYOUT.movesCircle;
    return this.rectCenter(m.x, m.y, m.w, m.h);
  }

  static get movesNumberPos(): cc.Vec2 {
    const m = MOCKUP_LAYOUT.movesNumber;
    return this.rectCenter(MOCKUP_LAYOUT.movesCircle.x, MOCKUP_LAYOUT.movesCircle.y,
                           MOCKUP_LAYOUT.movesCircle.w, MOCKUP_LAYOUT.movesCircle.h);
  }

  static get scoreLabelPos(): cc.Vec2 {
    const m = MOCKUP_LAYOUT.movesArea;
    const cx = (m.x + m.w / 2 + m.x + m.w) / 2 - MOCKUP_LAYOUT.canvas.width / 2;
    const cy = MOCKUP_LAYOUT.canvas.height / 2 - (m.y + MOCKUP_LAYOUT.scoreLabel.y);
    return cc.v2(cx, cy);
  }

  static get scoreNumberPos(): cc.Vec2 {
    const m = MOCKUP_LAYOUT.movesArea;
    const cx = (m.x + m.w / 2 + m.x + m.w) / 2 - MOCKUP_LAYOUT.canvas.width / 2;
    const cy = MOCKUP_LAYOUT.canvas.height / 2 - (m.y + MOCKUP_LAYOUT.scoreNumber.y);
    return cc.v2(cx, cy);
  }

  static get boardCenter(): cc.Vec2 {
    const b = MOCKUP_LAYOUT.boardArea;
    return this.rectCenter(b.x, b.y, b.w, b.h);
  }

  static get cellSize(): cc.Vec2 {
    return cc.v2(MOCKUP_LAYOUT.cell.w, MOCKUP_LAYOUT.cell.h);
  }

  static get bonusAreaCenter(): cc.Vec2 {
    return this.rectCenter(216, 1455, 648.51, 453.88);
  }

  static get boostersTitlePos(): cc.Vec2 {
    return this.rectCenter((1080 - 566) / 2, 1455, 566, 110);
  }

  static get leftBonusPanelCenter(): cc.Vec2 {
    return this.rectCenter(216, 1562, 339.33, 346.88);
  }

  static get rightBonusPanelCenter(): cc.Vec2 {
    return this.rectCenter(525.17, 1562, 339.33, 346.88);
  }

  static get leftBoosterCountPos(): cc.Vec2 {
    return this.rectCenter(364, 1758, 43.74, 88.23);
  }

  static get rightBoosterCountPos(): cc.Vec2 {
    return this.rectCenter(674, 1758, 42.98, 88.23);
  }

  static get teleportIconPos(): cc.Vec2 {
    return this.rectCenter(338, 1621, 95, 117);
  }
  
  static get bombIconPos(): cc.Vec2 {
    return this.rectCenter(647, 1624, 95, 117);
  }
}
