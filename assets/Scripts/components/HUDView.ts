import { GameModel } from '../core/GameModel';
import { GameEvent } from '../core/types';
import { FONT_FAMILY, MOCKUP_LAYOUT } from '../core/constants';
import { CocosLayout } from './Layout';

const { ccclass, property } = cc._decorator;

@ccclass
export default class HUDView extends cc.Component {
  @property({ type: cc.Sprite, tooltip: '9-slice фрейм moves (bg_frame_moves)' })
  movesFrame: cc.Sprite = null;

  @property({ type: cc.Sprite, tooltip: 'Круг с числом ходов (bg_moves.png)' })
  movesCircle: cc.Sprite = null;

  @property({ type: cc.Label, tooltip: 'Лейбл "37" — текущие ходы' })
  movesLabel: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Лейбл "очки:"' })
  scoreCaption: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Лейбл "221/500" — счёт / цель' })
  scoreLabel: cc.Label = null;

  @property({ type: cc.Sprite})
  progressBarSprite: cc.Sprite = null;

  @property({
    type: cc.Component
  })
  progressBarComponent: any = null;

  @property({ type: cc.Button, tooltip: 'Кнопка бустера Бомба (правая)' })
  bombButton: cc.Button = null;

  @property({ type: cc.Label, tooltip: 'Счётчик бомб "×5"' })
  bombCountLabel: cc.Label = null;

  @property({ type: cc.Button, tooltip: 'Кнопка бустера Телепорт (левая)' })
  teleportButton: cc.Button = null;

  @property({ type: cc.Label, tooltip: 'Счётчик телепортов "×3"' })
  teleportCountLabel: cc.Label = null;

  @property({
    type: cc.Sprite,
    tooltip: 'Левая фоновая панель бустера'
  })
  teleportPanel: cc.Sprite = null;

  @property({
    type: cc.Sprite,
    tooltip: 'Правая фоновая панель бустера'
  })
  bombPanel: cc.Sprite = null;

  @property({
    type: cc.Sprite,
    tooltip: 'Левая подпись под счётчиком'
  })
  teleportCountBg: cc.Sprite = null;

  @property({
    type: cc.Sprite,
    tooltip: 'Правая подпись под счётчиком'
  })
  bombCountBg: cc.Sprite = null;

  @property({ type: cc.Label, tooltip: 'Заголовок "Бустеры" над панелями' })
  boostersTitleLabel: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Подсказка режима бустера (скрыта)' })
  boosterHint: cc.Label = null;

  onBombTap?: () => void;
  onTeleportTap?: () => void;

  private model: GameModel = null;
  private unsub: () => void = () => {};

  init(model: GameModel): void {
    this.model = model;
    this.applyLayout();
    this.refreshAll();
    this.unsub = model.bus.on((e) => this.onModelEvent(e));

    this.bombButton.node.on('click', this._onBombClick, this);
    this.teleportButton.node.on('click', this._onTeleportClick, this);

    if (this.progressBarComponent && typeof this.progressBarComponent.init === 'function') {
      this.progressBarComponent.init(model);
    }

    if (this.boosterHint) this.boosterHint.node.active = false;
  }

  onDestroy(): void {
    this.unsub();
    this.bombButton.node.off('click', this._onBombClick, this);
    this.teleportButton.node.off('click', this._onTeleportClick, this);
  }

  private _onBombClick(): void { this.onBombTap?.(); }
  private _onTeleportClick(): void { this.onTeleportTap?.(); }

  private applyLayout(): void {
    if (this.movesFrame) {
      const m = MOCKUP_LAYOUT.movesArea;
      this.movesFrame.node.setPosition(CocosLayout.rectCenter(m.x, m.y, m.w, m.h));
      this.movesFrame.node.setContentSize(m.w, m.h);
    }
    // MovesCircle.
    if (this.movesCircle) {
      const c = MOCKUP_LAYOUT.movesCircle;
      this.movesCircle.node.setPosition(CocosLayout.rectCenter(c.x, c.y, c.w, c.h));
      this.movesCircle.node.setContentSize(c.w, c.h);
    }
    if (this.movesLabel) {
      this.movesLabel.node.setPosition(CocosLayout.movesNumberPos);
      this.movesLabel.fontSize = MOCKUP_LAYOUT.movesNumber.fontSize;
      this.movesLabel.lineHeight = MOCKUP_LAYOUT.movesNumber.fontSize + 10;
    }
    if (this.scoreCaption) {
      this.scoreCaption.node.setPosition(CocosLayout.scoreLabelPos);
      this.scoreCaption.string = 'очки:';
      this.scoreCaption.fontSize = MOCKUP_LAYOUT.scoreLabel.fontSize;
    }
    if (this.scoreLabel) {
      this.scoreLabel.node.setPosition(CocosLayout.scoreNumberPos);
      this.scoreLabel.fontSize = MOCKUP_LAYOUT.scoreNumber.fontSize;
    }
    if (this.bombButton) {
      this.bombButton.node.setPosition(CocosLayout.bombIconPos);
      this.bombButton.node.setContentSize(95, 117);
    }
    if (this.bombCountLabel) {
      this.bombCountLabel.node.setPosition(CocosLayout.rightBoosterCountPos);
      this.bombCountLabel.fontSize = 65;
      this.bombCountLabel.lineHeight = 89;
    }
    if (this.teleportButton) {
      this.teleportButton.node.setPosition(CocosLayout.teleportIconPos);
      this.teleportButton.node.setContentSize(95, 117);
    }
    if (this.teleportCountLabel) {
      this.teleportCountLabel.node.setPosition(CocosLayout.leftBoosterCountPos);
      this.teleportCountLabel.fontSize = 65;
      this.teleportCountLabel.lineHeight = 89;
    }

    if (this.teleportPanel) {
      const pos = CocosLayout.rectCenter(216, 1562, 339.33, 346.88);
      this.teleportPanel.node.setPosition(pos);
      this.teleportPanel.node.setContentSize(339.33, 346.88);
      this.teleportPanel.type = cc.Sprite.Type.SLICED;
    }
    if (this.bombPanel) {
      const pos = CocosLayout.rectCenter(525.17, 1562, 339.33, 346.88);
      this.bombPanel.node.setPosition(pos);
      this.bombPanel.node.setContentSize(339.33, 346.88);
      this.bombPanel.type = cc.Sprite.Type.SLICED;
    }
    if (this.teleportCountBg) {
      const pos = CocosLayout.rectCenter(273, 1748, 230, 113);
      this.teleportCountBg.node.setPosition(pos);
      this.teleportCountBg.node.setContentSize(230, 113);
      this.teleportCountBg.type = cc.Sprite.Type.SLICED;
    }
    if (this.bombCountBg) {
      const pos = CocosLayout.rectCenter(580, 1748, 230, 113);
      this.bombCountBg.node.setPosition(pos);
      this.bombCountBg.node.setContentSize(230, 113);
      this.bombCountBg.type = cc.Sprite.Type.SLICED;
    }

    if (this.boostersTitleLabel) {
      const pos = CocosLayout.rectCenter((1080 - 566) / 2, 1455, 566, 110);
      this.boostersTitleLabel.node.setPosition(pos);
      this.boostersTitleLabel.string = 'Бустеры';
      this.boostersTitleLabel.fontSize = 80;
      this.boostersTitleLabel.lineHeight = 110;
      //NOTE: попытка загрузить шрифт из кода не увенчалась успехом
    }
  }

  private getMarvinFont(): cc.TTFFont | null {
    try {
      const font = cc.resources.get('fonts/Marvin', cc.TTFFont) as cc.TTFFont;
      return font ?? null;
    } catch {
      return null;
    }
  }

  setBoosterHint(text: string): void {
    if (!this.boosterHint) return;
    if (text) {
      this.boosterHint.node.active = true;
      this.boosterHint.string = text;
      this.boosterHint.node.setPosition(0, -500);
    } else {
      this.boosterHint.node.active = false;
    }
  }

  setActiveBooster(mode: 'none' | 'bomb' | 'teleport'): void {
    if (this.bombButton) {
      const active = mode === 'bomb';
      this.bombButton.node.color = active ? cc.Color.YELLOW : cc.Color.WHITE;
      this.bombButton.node.scale = active ? 1.08 : 1.0;
    }
    if (this.teleportButton) {
      const active = mode === 'teleport';
      this.teleportButton.node.color = active ? cc.Color.YELLOW : cc.Color.WHITE;
      this.teleportButton.node.scale = active ? 1.08 : 1.0;
    }
  }

  private onModelEvent(e: GameEvent): void {
    switch (e.type) {
      case 'score:changed':
        this.scoreLabel.string = `${this.model.getScore()}/${this.model.getTargetScore()}`;
        this.updateProgress();
        this.bumpLabel(this.scoreLabel.node);
        break;
      case 'moves:changed':
        this.movesLabel.string = `${this.model.getMovesLeft()}`;
        this.bumpLabel(this.movesLabel.node);
        break;
      case 'boosters:changed':
        if (this.bombCountLabel) this.bombCountLabel.string = `×${this.model.getBombsLeft()}`;
        if (this.teleportCountLabel) this.teleportCountLabel.string = `×${this.model.getTeleportsLeft()}`;
        if (this.bombButton) this.bombButton.interactable = this.model.getBombsLeft() > 0;
        if (this.teleportButton) this.teleportButton.interactable = this.model.getTeleportsLeft() > 0;
        break;
    }
  }

  private refreshAll(): void {
    this.movesLabel.string = `${this.model.getMovesLeft()}`;
    this.scoreLabel.string = `${this.model.getScore()}/${this.model.getTargetScore()}`;
    if (this.bombCountLabel) this.bombCountLabel.string = `×${this.model.getBombsLeft()}`;
    if (this.teleportCountLabel) this.teleportCountLabel.string = `×${this.model.getTeleportsLeft()}`;
    if (this.bombButton) this.bombButton.interactable = this.model.getBombsLeft() > 0;
    if (this.teleportButton) this.teleportButton.interactable = this.model.getTeleportsLeft() > 0;
    this.updateProgress();
  }

  private updateProgress(): void {
    const ratio = Math.max(0, Math.min(1, this.model.getScore() / this.model.getTargetScore()));
    if (this.progressBarComponent && typeof this.progressBarComponent.updateProgress === 'function') {
      this.progressBarComponent.updateProgress();
      return;
    }
    if (this.progressBarSprite) {
      this.progressBarSprite.fillRange = ratio;
    }
  }

  private bumpLabel(node: cc.Node): void {
    node.stopAllActions();
    cc.tween(node)
      .to(0.08, { scale: 1.2 })
      .to(0.08, { scale: 1.0 })
      .start();
  }
}
