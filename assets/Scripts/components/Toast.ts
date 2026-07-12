import { GameModel } from '../core/GameModel';
import { GameEvent } from '../core/types';

const { ccclass, property } = cc._decorator;

@ccclass
export default class Toast extends cc.Component {
  @property({ type: cc.Label, tooltip: 'Лейбл для текста нижней подсказки (если component на отдельной ноде)' })
  label: cc.Label = null;

  private model: GameModel = null;
  private unsub: () => void = () => {};
  private hideTimer: number = -1;

  init(model: GameModel): void {
    this.model = model;
    if (!this.label) this.label = this.getComponent(cc.Label);
    this.node.active = false;
    this.unsub = model.bus.on((e: GameEvent) => {
      if (e.type === 'log') this.show(e.message);
    });
  }

  onDestroy(): void {
    this.unsub();
  }

  show(text: string): void {
    if (!text) { this.hide(); return; }
    this.label.string = text;
    this.node.active = true;
    this.node.opacity = 0;
    this.node.stopAllActions();
    cc.tween(this.node)
      .to(0.18, { opacity: 255 })
      .delay(1.4)
      .to(0.25, { opacity: 0 })
      .call(() => { this.node.active = false; })
      .start();
  }

  hide(): void {
    this.node.stopAllActions();
    this.node.active = false;
  }
}
