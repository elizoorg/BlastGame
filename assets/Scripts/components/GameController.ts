import { GameModel } from '../core/GameModel';
import { GameConfig } from '../core/constants';
import { TileColor } from '../core/types';
import BoardView, { BoosterMode } from './BoardView';
import HUDView from './HUDView';
import OverlayController from './OverlayController';
import Toast from './Toast';

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameController extends cc.Component {
  @property({ type: BoardView, tooltip: 'Компонент BoardView на ноде Board' })
  boardView: BoardView = null;

  @property({ type: HUDView, tooltip: 'Компонент HUDView на ноде HUD' })
  hudView: HUDView = null;

  @property({ type: OverlayController, tooltip: 'Компонент OverlayController на ноде Overlay' })
  overlay: OverlayController = null;

  @property({ type: Toast, tooltip: 'Компонент Toast' })
  toast: Toast = null;

  @property({ type: cc.Integer, tooltip: 'Колонок поля (по макету — 7)' })
  cols: number = 7;

  @property({ type: cc.Integer, tooltip: 'Строк поля (по макету — 8)' })
  rows: number = 8;

  @property({ type: cc.Integer, tooltip: 'Очки для победы (по макету — 500)' })
  targetScore: number = 500;

  @property({ type: cc.Integer, tooltip: 'Максимум ходов (по макету — 37)' })
  maxMoves: number = 37;

  @property({ type: cc.Integer, tooltip: 'Лимит перемешиваний' })
  maxShuffles: number = 3;

  @property({ type: cc.Integer, tooltip: 'Радиус бомбы (в клетках)' })
  bombRadius: number = 1;

  @property({ type: cc.Integer, tooltip: 'Минимальный размер группы для супер-тайла' })
  superTileThreshold: number = 5;

  @property({ type: cc.Integer, tooltip: 'Радиус AreaClear супер-тайла' })
  superTileAreaRadius: number = 1;

  @property({ type: cc.Integer, tooltip: 'Бомб на старте (по макету — 5)' })
  initialBombs: number = 5;

  @property({ type: cc.Integer, tooltip: 'Телепортов на старте (по макету — 3)' })
  initialTeleports: number = 3;

  @property({
    type: [cc.Integer],
    tooltip: 'Цвета тайлов (значения enum TileColor: 0=Red,1=Yellow,2=Green,3=Blue,4=Purple,5=Orange)'
  })
  colors: number[] = [0, 1, 2, 3, 4];

  private model: GameModel = null;
  private boosterMode: BoosterMode = 'none';
  private teleportFirst: { col: number; row: number } | null = null;

  onLoad(): void {

    const config: GameConfig = {
      cols: this.cols,
      rows: this.rows,
      colors: this.colors.map((c) => c as TileColor),
      targetScore: this.targetScore,
      maxMoves: this.maxMoves,
      maxShuffles: this.maxShuffles,
      bombRadius: this.bombRadius,
      superTileThreshold: this.superTileThreshold,
      superTileAreaRadius: this.superTileAreaRadius,
      initialBombs: this.initialBombs,
      initialTeleports: this.initialTeleports
    };

    this.model = new GameModel(config);

    this.boardView.init(this.model);
    this.hudView.init(this.model);
    this.overlay.init(this.model);
    this.toast.init(this.model);

    this.hudView.onBombTap = () => this.toggleBooster('bomb');
    this.hudView.onTeleportTap = () => this.toggleBooster('teleport');

    this.boardView.onCellTap = (col, row) => this.handleCellTap(col, row);

    this.overlay.onPlayClick = () => this.startNewGame();
  }

  onDestroy(): void {
  }

  private startNewGame(): void {
    const config = this.model.config;
    this.model = new GameModel(config);
    this.boardView.init(this.model);
    this.hudView.init(this.model);
    this.overlay.init(this.model);
    this.toast.init(this.model);
    this.hudView.onBombTap = () => this.toggleBooster('bomb');
    this.hudView.onTeleportTap = () => this.toggleBooster('teleport');
    this.boardView.onCellTap = (col, row) => this.handleCellTap(col, row);
    this.overlay.onPlayClick = () => this.startNewGame();
    this.setBoosterMode('none');
    this.model.start();
  }

  private toggleBooster(kind: 'bomb' | 'teleport'): void {
    if (this.model.getState() !== 'playing') return;
    if (kind === 'bomb' && this.model.getBombsLeft() <= 0) {
      this.toast.show('Бомбы закончились');
      return;
    }
    if (kind === 'teleport' && this.model.getTeleportsLeft() <= 0) {
      this.toast.show('Телепорты закончились');
      return;
    }
    this.setBoosterMode(this.boosterMode === kind ? 'none' : kind);
  }

  private setBoosterMode(mode: BoosterMode): void {
    this.boosterMode = mode;
    this.teleportFirst = null;
    this.boardView.setBoosterMode(mode);
    this.hudView.setActiveBooster(mode);
    this.hudView.setBoosterHint(
      mode === 'bomb' ? 'Выберите клетку для бомбы'
        : mode === 'teleport' ? 'Выберите два тайла для обмена'
        : ''
    );
  }

  private handleCellTap(col: number, row: number): void {
    if (this.model.getState() !== 'playing') return;

    if (this.boosterMode === 'bomb') {
      const r = this.model.useBomb(col, row);
      if (!r.ok) this.toast.show('Нельзя применить бомбу здесь');
      this.setBoosterMode('none');
      return;
    }

    if (this.boosterMode === 'teleport') {
      if (!this.teleportFirst) {
        this.teleportFirst = { col, row };
        this.boardView.showTeleportFirstCell(col, row);
        this.toast.show('Выберите второй тайл');
      } else {
        const r = this.model.useTeleport(this.teleportFirst, { col, row });
        if (!r.ok) this.toast.show('Нельзя поменять эти тайлы');
        this.boardView.hideTeleportHighlight();
        this.setBoosterMode('none');
      }
      return;
    }

    const r = this.model.tap(col, row);
    if (!r.ok && r.reason === 'no-group') {
      this.toast.show('Нет группы для сжигания');
    }
  }
}
