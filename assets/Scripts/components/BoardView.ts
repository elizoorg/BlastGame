import { GameModel } from '../core/GameModel';
import { GameConfig, MOCKUP_LAYOUT } from '../core/constants';
import { GameEvent, SuperTileKind, Tile, TileColor } from '../core/types';
import { TILE_PALETTE } from '../core/constants';
import TileComponent from './TileComponent';

const { ccclass, property } = cc._decorator;

export type BoosterMode = 'none' | 'bomb' | 'teleport';

@ccclass
export default class BoardView extends cc.Component {
  @property({ type: cc.Prefab, tooltip: 'Префаб тайла (с компонентом TileComponent)' })
  tilePrefab: cc.Prefab = null;

  @property({ type: [cc.SpriteFrame], tooltip: 'Спрайты обычных тайлов по цветам (block_red, block_yellow, ...)' })
  colorSprites: cc.SpriteFrame[] = [];

  @property({
    type: [cc.SpriteFrame],
    tooltip: 'Спрайты супер-тайлов по SuperTileKind: [0]=None, [1]=block_rockets_horisontal (RowClear), [2]=block_rakets (ColumnClear), [3]=block_bomb (AreaClear), [4]=block_bomb_max (AllClear)'
  })
  superSprites: cc.SpriteFrame[] = [];

  @property({ type: cc.Node, tooltip: 'Контейнер для нод тайлов' })
  tilesContainer: cc.Node = null;

  @property({ type: cc.Node, tooltip: 'Превью бомбы (3×3 рамка, скрыта)' })
  bombPreview: cc.Node = null;

  @property({ type: cc.Node, tooltip: 'Подсветка первой клетки телепорта (1×1, скрыта)' })
  teleportHighlight: cc.Node = null;

  
  boosterMode: BoosterMode = 'none';
  onCellTap?: (col: number, row: number) => void;

  private model: GameModel = null;
  private config: GameConfig = null;
  private tiles = new Map<number, cc.Node>();
  private teleportFirst: { col: number; row: number } | null = null;
  private unsub: () => void = () => {};

  private superSpriteByKind: Record<SuperTileKind, cc.SpriteFrame | null> = {
    [SuperTileKind.None]: null,
    [SuperTileKind.RowClear]: null,
    [SuperTileKind.ColumnClear]: null,
    [SuperTileKind.AreaClear]: null,
    [SuperTileKind.AllClear]: null
  };

  init(model: GameModel): void {
    this.model = model;
    this.config = model.config;
    this.node.setAnchorPoint(0.5, 0.5);
    this.node.scale = 1;

    const w = MOCKUP_LAYOUT.boardArea.w;
    const h = MOCKUP_LAYOUT.boardArea.h;
    this.node.setContentSize(w, h);

    if (this.tilesContainer) {
      this.tilesContainer.setAnchorPoint(0.5, 0.5);
      this.tilesContainer.setPosition(0, 0);
      this.tilesContainer.setContentSize(w, h);
    }

    this.superSpriteByKind[SuperTileKind.RowClear]    = this.superSprites[SuperTileKind.RowClear]    ?? null;
    this.superSpriteByKind[SuperTileKind.ColumnClear] = this.superSprites[SuperTileKind.ColumnClear] ?? null;
    this.superSpriteByKind[SuperTileKind.AreaClear]   = this.superSprites[SuperTileKind.AreaClear]   ?? null;
    this.superSpriteByKind[SuperTileKind.AllClear]    = this.superSprites[SuperTileKind.AllClear]    ?? null;


    if (this.bombPreview) this.bombPreview.active = false;
    if (this.teleportHighlight) this.teleportHighlight.active = false;

    this.unsub = this.model.bus.on((e) => this.onModelEvent(e));
    this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
  }

  onDestroy(): void {
    this.unsub();
    this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
    this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
  }

  private get gridWidth(): number { return this.config.cols * MOCKUP_LAYOUT.cell.w; }
  private get gridHeight(): number { return this.config.rows * MOCKUP_LAYOUT.cell.h; }
  private get gridHalfW(): number { return this.gridWidth / 2; }
  private get gridHalfH(): number { return this.gridHeight / 2; }

  private cellToLocal(col: number, row: number): cc.Vec2 {
    const cellW = MOCKUP_LAYOUT.cell.w;
    const cellH = MOCKUP_LAYOUT.cell.h;
    const x = -this.gridHalfW + (col + 0.5) * cellW;
    const y = -this.gridHalfH + (row + 0.5) * cellH;
    return cc.v2(x, y);
  }

  private localToCell(local: cc.Vec2): { col: number; row: number } | null {
    const cellW = MOCKUP_LAYOUT.cell.w;
    const cellH = MOCKUP_LAYOUT.cell.h;
    const col = Math.floor((local.x + this.gridHalfW) / cellW);
    const row = Math.floor((local.y + this.gridHalfH) / cellH);
    if (col < 0 || col >= this.config.cols || row < 0 || row >= this.config.rows) return null;
    return { col, row };
  }

  private onTouchStart(touch: cc.Touch, _event: cc.Event.EventTouch): void {
    if (this.model.getState() !== 'playing') return;
    const worldPos = touch.getLocation();
    const local = this.node.convertToNodeSpaceAR(worldPos);
    const cell = this.localToCell(local);
    if (!cell) return;
    if (this.boosterMode === 'bomb') {
      this.updateBombPreview(local);
    }

    this.onCellTap?.(cell.col, cell.row);
  }

  setBoosterMode(mode: BoosterMode): void {
    this.boosterMode = mode;
    this.teleportFirst = null;
    if (this.bombPreview) this.bombPreview.active = false;
    if (this.teleportHighlight) this.teleportHighlight.active = false;
    if (mode === 'bomb') {
      this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    } else {
      this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
    }
  }

  showTeleportFirstCell(col: number, row: number): void {
    this.teleportFirst = { col, row };
    if (this.teleportHighlight) {
      const pos = this.cellToLocal(col, row);
      this.teleportHighlight.setPosition(pos);
      this.teleportHighlight.active = true;
      this.teleportHighlight.stopAllActions();
      cc.tween(this.teleportHighlight)
        .repeatForever(
          cc.tween(this.teleportHighlight)
            .to(0.4, { scale: 1.1 })
            .to(0.4, { scale: 1.0 })
        )
        .start();
    }
  }

  hideTeleportHighlight(): void {
    this.teleportFirst = null;
    if (this.teleportHighlight) {
      this.teleportHighlight.stopAllActions();
      this.teleportHighlight.active = false;
    }
  }

  private updateBombPreview(local: cc.Vec2): void {
    if (!this.bombPreview || this.boosterMode !== 'bomb') return;
    const cell = this.localToCell(local);
    if (!cell) {
      this.bombPreview.active = false;
      return;
    }
    const pos = this.cellToLocal(cell.col, cell.row);
    this.bombPreview.setPosition(pos);
    this.bombPreview.active = true;
  }

  private onTouchMove(touch: cc.Touch, _event: cc.Event.EventTouch): void {
    if (this.boosterMode !== 'bomb') return;
    const worldPos = touch.getLocation();
    const local = this.node.convertToNodeSpaceAR(worldPos);
    this.updateBombPreview(local);
  }

  private onModelEvent(e: GameEvent): void {
    switch (e.type) {
      case 'tiles:removed':
        this.animateRemoval(e.tiles);
        break;
      case 'tiles:moved':
        this.animateMoves(e.moves);
        break;
      case 'tiles:spawned':
        this.animateSpawns(e.tiles);
        break;
      case 'super:created':
        this.onSuperCreated(e.tile);
        break;
      case 'grid:changed':
        this.scheduleOnce(() => this.syncFromModel(), 0.05);
        break;
    }
  }

  private animateRemoval(tiles: ReadonlyArray<{ id: number; col: number; row: number; color: TileColor }>): void {
    for (const t of tiles) {
      const node = this.tiles.get(t.id);
      if (!node) continue;
      this.tiles.delete(t.id);
      cc.tween(node)
        .to(0.22, { scale: 0, opacity: 0 }, { easing: 'quadIn' })
        .call(() => node.destroy())
        .start();
      this.spawnParticles(node.getPosition(), TILE_PALETTE[t.color].base);
    }
  }

  private animateMoves(moves: ReadonlyArray<{ id: number; fromCol: number; fromRow: number; toCol: number; toRow: number }>): void {
    for (const m of moves) {
      const node = this.tiles.get(m.id);
      if (!node) continue;
      const target = this.cellToLocal(m.toCol, m.toRow);
      const dist = Math.abs(m.toRow - m.fromRow);
      const duration = Math.min(0.45, 0.18 + dist * 0.05);
      cc.tween(node)
        .to(duration, { x: target.x, y: target.y }, { easing: 'bounceOut' })
        .start();
    }
  }

  private animateSpawns(tiles: ReadonlyArray<Tile>): void {
    for (const t of tiles) {
      const node = cc.instantiate(this.tilePrefab);
      const tileComp = node.getComponent(TileComponent)!;
      tileComp.applyTile(t, this.colorSprites, this.superSpriteByKind);
      const target = this.cellToLocal(t.col, t.row);
      const startY = this.gridHalfH + MOCKUP_LAYOUT.cell.h;
      node.setPosition(target.x, startY);
      this.tilesContainer.addChild(node);
      this.tiles.set(t.id, node);
      const dist = startY - target.y;
      const duration = Math.min(0.5, 0.2 + (dist / MOCKUP_LAYOUT.cell.h) * 0.04);
      cc.tween(node)
        .to(duration, { y: target.y }, { easing: 'bounceOut' })
        .start();
    }
  }

  private onSuperCreated(tile: Tile): void {
    const node = this.tiles.get(tile.id);
    if (!node) return;
    const tileComp = node.getComponent(TileComponent)!;
    tileComp.setSuperKind(tile.superTile, this.superSpriteByKind);
    node.scale = 0;
    cc.tween(node)
      .to(0.18, { scale: 1.2 }, { easing: 'backOut' })
      .to(0.12, { scale: 1.0 }, { easing: 'quadOut' })
      .start();
  }

  private syncFromModel(): void {
    const seen = new Set<number>();
    this.model.getGrid().forEach((t) => {
      seen.add(t.id);
      let node = this.tiles.get(t.id);
      if (!node) {
        node = cc.instantiate(this.tilePrefab);
        this.tilesContainer.addChild(node);
        this.tiles.set(t.id, node);
      }
      const tileComp = node.getComponent(TileComponent)!;
      tileComp.applyTile(t, this.colorSprites, this.superSpriteByKind);
      const pos = this.cellToLocal(t.col, t.row);
      node.setPosition(pos);
    });
    for (const [id, node] of this.tiles) {
      if (!seen.has(id)) {
        this.tiles.delete(id);
        node.destroy();
      }
    }
  }

  private spawnParticles(pos: cc.Vec2, colorHex: string): void {
    const color = new cc.Color().fromHEX(colorHex);
    for (let i = 0; i < 6; i++) {
      const p = new (cc.Node as any)();
      const sp = p.addComponent(cc.Sprite) as cc.Sprite;
      sp.spriteFrame = this.colorSprites[0];
      p.color = color;
      p.setContentSize(12, 12);
      p.setPosition(pos);
      this.tilesContainer.addChild(p);
      const angle = (i / 6) * Math.PI * 2;
      const dist = 60 + Math.random() * 40;
      cc.tween(p)
        .by(0.45, { x: Math.cos(angle) * dist, y: Math.sin(angle) * dist, opacity: -255 })
        .call(() => p.destroy())
        .start();
    }
  }
}
