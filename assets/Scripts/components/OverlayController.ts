import { GameModel } from '../core/GameModel';
import { GameState } from '../core/types';
import { FONT_FAMILY, MOCKUP_LAYOUT } from '../core/constants';
import { CocosLayout } from './Layout';

const { ccclass, property } = cc._decorator;

@ccclass
export default class OverlayController extends cc.Component {
  @property({ type: cc.Label, tooltip: 'Большой заголовок ("BLAST PUZZLE" / "Победа!" / "Поражение")' })
  titleLabel: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Подзаголовок под заголовком (только Start экран)' })
  subtitleLabel: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Текст правил / причина поражения' })
  textLabel: cc.Label = null;

  @property({ type: cc.Label, tooltip: 'Статистика ("Цель: 500 • Ходов: 37" или финальные очки)' })
  statsLabel: cc.Label = null;

  @property({ type: cc.Node, tooltip: 'Контейнер с подсказками про бустеры/супер-тайлы (скрыт на Win/Lose)' })
  hintsContainer: cc.Node = null;

  @property({ type: cc.Button, tooltip: 'Главная кнопка ("Играть" / "Заново")' })
  playButton: cc.Button = null;

  @property({ type: cc.Node, tooltip: 'Затемняющий фон (Dim). На нём нужен cc.BlockInputEvents.' })
  dimNode: cc.Node = null;

  @property({ type: cc.Node, tooltip: 'Центральная панель (для slide-up анимации при Win/Lose)' })
  panelNode: cc.Node = null;

  @property({ type: cc.Sprite, tooltip: 'Опц. декоративный фон-логотип позади панели' })
  backgroundSprite: cc.Sprite = null;

  onPlayClick?: () => void;

  private model: GameModel = null;
  private unsub: () => void = () => { };

  init(model: GameModel): void {
    this.model = model;
    this.unsub = model.bus.on((e) => {
      if (e.type === 'state:changed') this.onStateChanged(e.state);
    });

    this.playButton.node.on('click', this._onPlayClick, this);
    this.showStart();
  }

  onDestroy(): void {
    this.unsub();
    this.playButton.node.off('click', this._onPlayClick, this);
  }

  private _onPlayClick(): void {
    this.onPlayClick?.();
  }

  showStart(): void {
    this.node.active = true;
    this.node.opacity = 255;
    if (this.dimNode) this.dimNode.opacity = 255;
    if (this.panelNode) {
      this.panelNode.opacity = 255;
      this.panelNode.y = 0;
    }

    if (this.titleLabel) {
      this.titleLabel.string = 'BLAST PUZZLE';
      this.titleLabel.fontSize = 120;
      this.titleLabel.lineHeight = 140;
      this.titleLabel.node.active = true;
    }
    if (this.subtitleLabel) {
      this.subtitleLabel.string = 'Головоломка с механикой Blast';
      this.subtitleLabel.fontSize = 50;
      this.subtitleLabel.lineHeight = 70;
      this.subtitleLabel.node.active = true;
    }
    if (this.textLabel) {
      this.textLabel.string = 'Сжигайте группы из 2+ тайлов одного цвета. Большие группы (5+) создают супер-тайлы!';
      this.textLabel.fontSize = 28;
      this.textLabel.lineHeight = 40;
      this.textLabel.node.active = true;
    }
    if (this.statsLabel) {
      this.statsLabel.string = `Цель: ${this.model.getTargetScore()} очков  •  Ходов: ${this.model.getMovesLeft()}`;
      this.statsLabel.fontSize = 36;
      this.statsLabel.lineHeight = 50;
      this.statsLabel.node.active = true;
    }

    if (this.hintsContainer) this.hintsContainer.active = true;

    this.setButtonLabel('ИГРАТЬ');

    if (this.playButton) {
      this.playButton.node.stopAllActions();
      this.playButton.node.scale = 1;
      cc.tween(this.playButton.node)
        .repeatForever(
          cc.tween(this.playButton.node)
            .to(0.8, { scale: 1.06 }, { easing: 'sineOut' })
            .to(0.8, { scale: 1.0 }, { easing: 'sineIn' })
        )
        .start();
    }
  }

  private onStateChanged(state: GameState): void {
    if (state === 'won') this.showEnd(true);
    else if (state === 'lost') this.showEnd(false);
    else if (state === 'playing' || state === 'ready') this.hide();
  }

  private hide(): void {
    if (this.playButton) {
      this.playButton.node.stopAllActions();
      this.playButton.node.scale = 1;
    }
    this.node.stopAllActions();
    cc.tween(this.node)
      .to(0.25, { opacity: 0 })
      .call(() => { this.node.active = false; })
      .start();
  }

  // ---------- WIN / LOSE экраны ----------

  private showEnd(won: boolean): void {
    this.node.active = true;

    if (this.subtitleLabel) this.subtitleLabel.node.active = false;
    if (this.hintsContainer) this.hintsContainer.active = false;

    if (won) {
      if (this.titleLabel) {
        this.titleLabel.string = 'ПОБЕДА!';
        this.titleLabel.fontSize = 140;
        this.titleLabel.lineHeight = 160;
        this.titleLabel.node.color = cc.Color.YELLOW;
      }
      if (this.textLabel) {
        this.textLabel.string = 'Вы набрали нужное количество очков. Поздравляем!';
        this.textLabel.fontSize = 32;
        this.textLabel.lineHeight = 44;
        this.textLabel.node.active = true;
      }
      if (this.statsLabel) {
        this.statsLabel.string = `Очки: ${this.model.getScore()} / ${this.model.getTargetScore()}`;
        this.statsLabel.fontSize = 48;
        this.statsLabel.lineHeight = 64;
        this.statsLabel.node.active = true;
      }
    } else {
      if (this.titleLabel) {
        this.titleLabel.string = 'ПОРАЖЕНИЕ';
        this.titleLabel.fontSize = 120;
        this.titleLabel.lineHeight = 140;
        this.titleLabel.node.color = cc.Color.RED;
      }
      const reason = this.model.getMovesLeft() <= 0
        ? 'Закончились ходы.'
        : 'На поле нет доступных ходов.';
      if (this.textLabel) {
        this.textLabel.string = `${reason} Попробуйте ещё раз!`;
        this.textLabel.fontSize = 32;
        this.textLabel.lineHeight = 44;
        this.textLabel.node.active = true;
      }
      if (this.statsLabel) {
        this.statsLabel.string = `Очки: ${this.model.getScore()} / ${this.model.getTargetScore()}  •  Ходов: ${this.model.getMovesLeft()}`;
        this.statsLabel.fontSize = 36;
        this.statsLabel.lineHeight = 50;
        this.statsLabel.node.active = true;
      }
    }

    this.setButtonLabel('ЗАНОВО');

    if (this.playButton) {
      this.playButton.node.stopAllActions();
      this.playButton.node.scale = 1;
    }

    this.fadeInEnd();
  }

  private fadeInEnd(): void {
    this.node.opacity = 255;
    if (this.dimNode) {
      this.dimNode.opacity = 0;
      this.dimNode.stopAllActions();
      cc.tween(this.dimNode)
        .to(0.15, { opacity: 255 })
        .start();
    }
    if (this.panelNode) {
      this.panelNode.opacity = 0;
      const originalY = this.panelNode.y;
      this.panelNode.y = originalY - 60;
      this.panelNode.stopAllActions();
      cc.tween(this.panelNode)
        .to(0.35, { opacity: 255, y: originalY }, { easing: 'backOut' })
        .start();
    }
  }
  
  private setButtonLabel(text: string): void {
    if (!this.playButton) return;
    const lbl = this.playButton.getComponentInChildren(cc.Label);
    if (lbl) lbl.string = text;
  }
}
