import { MOCKUP_LAYOUT } from '../core/constants';

const { ccclass, property } = cc._decorator;

@ccclass
export default class SlicedBackground extends cc.Component {
  @property({ type: cc.SpriteFrame, tooltip: 'Спрайт-фон (PNG с настроенным Border)' })
  spriteFrame: cc.SpriteFrame = null;

  @property({ type: cc.Integer, tooltip: 'Исходная ширина PNG (для справки)' })
  sourceWidth: number = 339;

  @property({ type: cc.Integer, tooltip: 'Исходная высота PNG (для справки)' })
  sourceHeight: number = 347;

  @property({
    type: cc.Integer,
    tooltip: 'Толщина левого края 9-slice (должна совпадать с Border PNG в Assets)'
  })
  borderLeft: number = 126;

  @property({ type: cc.Integer, tooltip: 'Толщина правого края 9-slice' })
  borderRight: number = 126;

  @property({ type: cc.Integer, tooltip: 'Толщина верхнего края 9-slice' })
  borderTop: number = 126;

  @property({ type: cc.Integer, tooltip: 'Толщина нижнего края 9-slice' })
  borderBottom: number = 126;

  @property({ type: cc.Integer, tooltip: 'Целевая ширина ноды (px)' })
  targetWidth: number = 339;

  @property({ type: cc.Integer, tooltip: 'Целевая высота ноды (px)' })
  targetHeight: number = 347;

  @property({
    type: cc.Enum({
      none: 0,
      movesArea: 1,
      boardArea: 2,
      bonusFrame: 3,
      movesFrame: 4,
      playFrame: 5
    }),
    tooltip: 'Источник размера из макета'
  })
  layoutKey: number = 0;

  @property({ type: cc.Boolean, tooltip: 'Центрировать ноду по макету (только если layoutKey ≠ none)' })
  applyPosition: boolean = false;

  private sprite: cc.Sprite = null;

  onLoad(): void {
    this.sprite = this.getComponent(cc.Sprite);
    if (!this.sprite) {
      cc.warn('[SlicedBackground] cc.Sprite не найден на ноде — добавьте его сначала.');
      return;
    }
    this.applyConfiguration();
  }

  applyConfiguration(): void {
    if (!this.sprite) return;

    if (this.spriteFrame) {
      this.sprite.spriteFrame = this.spriteFrame;
    }

    if (this.sprite.type !== cc.Sprite.Type.SLICED) {
      this.sprite.type = cc.Sprite.Type.SLICED;
    }

    let w = this.targetWidth;
    let h = this.targetHeight;
    if (this.layoutKey !== 0) {
      const size = this.sizeFromLayout(this.layoutKey);
      if (size) { w = size.w; h = size.h; }
    }
    this.node.setContentSize(w, h);

    if (this.applyPosition && this.layoutKey !== 0) {
      const pos = this.centerFromLayout(this.layoutKey);
      if (pos) this.node.setPosition(pos);
    }
  }

  private sizeFromLayout(key: number): { w: number; h: number } | null {
    switch (key) {
      case 1: return { w: MOCKUP_LAYOUT.movesArea.w, h: MOCKUP_LAYOUT.movesArea.h };
      case 2: return { w: MOCKUP_LAYOUT.boardArea.w, h: MOCKUP_LAYOUT.boardArea.h };
      case 3: return { w: 339.33, h: 346.88 };
      case 4: return { w: MOCKUP_LAYOUT.movesArea.w, h: MOCKUP_LAYOUT.movesArea.h };
      case 5: return { w: MOCKUP_LAYOUT.boardArea.w, h: MOCKUP_LAYOUT.boardArea.h };
      default: return null;
    }
  }

  private centerFromLayout(key: number): cc.Vec2 | null {
    switch (key) {
      case 1: { 
        const m = MOCKUP_LAYOUT.movesArea;
        return this.rectCenter(m.x, m.y, m.w, m.h);
      }
      case 2: {
        const b = MOCKUP_LAYOUT.boardArea;
        return this.rectCenter(b.x, b.y, b.w, b.h);
      }
      case 3: {
        return this.rectCenter(216, 1562, 339.33, 346.88);
      }
      default: return null;
    }
  }

  private rectCenter(x: number, y: number, w: number, h: number): cc.Vec2 {
    const cx = (x + w / 2) - MOCKUP_LAYOUT.canvas.width / 2;
    const cy = MOCKUP_LAYOUT.canvas.height / 2 - (y + h / 2);
    return cc.v2(cx, cy);
  }

  resize(w: number, h: number): void {
    this.targetWidth = w;
    this.targetHeight = h;
    this.node.setContentSize(w, h);
  }

  setFrame(frame: cc.SpriteFrame): void {
    this.spriteFrame = frame;
    if (this.sprite) this.sprite.spriteFrame = frame;
  }
}
