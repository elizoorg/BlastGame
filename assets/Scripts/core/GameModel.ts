import { GameConfig, DEFAULT_CONFIG } from './constants';
import { EventBus } from './EventBus';
import { Grid } from './Grid';
import { MatchFinder } from './MatchFinder';
import { IScoreCalculator, ScoreCalculator } from './ScoreCalculator';
import { TileFactory } from './TileFactory';
import { Cell, GameState, SuperTileKind, Tile, TileColor } from './types';
import { ShuffleService } from '../services/ShuffleService';
import { SuperTileFactory } from '../super-tiles/SuperTileFactory';
import { BombBooster, TeleportBooster } from '../boosters/Boosters';

export interface ActionResult {
  ok: boolean;
  reason?: string;
}

export class GameModel {
  readonly config: GameConfig;
  readonly bus = new EventBus();

  private readonly grid: Grid;
  private readonly matchFinder = new MatchFinder();
  private readonly scoreCalc: IScoreCalculator;
  private readonly tileFactory: TileFactory;
  private readonly shuffleService: ShuffleService;
  private readonly superTileFactory: SuperTileFactory;
  private readonly bomb: BombBooster;
  private readonly teleport: TeleportBooster;

  private score = 0;
  private movesLeft: number;
  private shufflesLeft: number;
  private bombsLeft: number;
  private teleportsLeft: number;
  private state: GameState = GameState.Ready;

  constructor(config: GameConfig = DEFAULT_CONFIG, scoreCalc?: IScoreCalculator) {
    this.config = config;
    this.grid = new Grid(config.cols, config.rows);
    this.scoreCalc = scoreCalc ?? new ScoreCalculator();
    this.tileFactory = new TileFactory();
    this.shuffleService = new ShuffleService(this.matchFinder);
    this.superTileFactory = new SuperTileFactory(config.superTileAreaRadius);
    this.bomb = new BombBooster(config.bombRadius);
    this.teleport = new TeleportBooster();
    this.movesLeft = config.maxMoves;
    this.shufflesLeft = config.maxShuffles;
    this.bombsLeft = config.initialBombs;
    this.teleportsLeft = config.initialTeleports;
  }


  getGrid(): Grid { return this.grid; }
  getScore(): number { return this.score; }
  getMovesLeft(): number { return this.movesLeft; }
  getShufflesLeft(): number { return this.shufflesLeft; }
  getBombsLeft(): number { return this.bombsLeft; }
  getTeleportsLeft(): number { return this.teleportsLeft; }
  getState(): GameState { return this.state; }
  getTargetScore(): number { return this.config.targetScore; }

  start(): void {
    this.fillBoard();
    if (!this.matchFinder.hasAnyMove(this.grid)) {
      this.shuffleService.shuffle(this.grid);
    }
    this.setState(GameState.Playing);
    this.bus.emit({ type: 'grid:changed' });
    this.bus.emit({ type: 'score:changed', score: this.score, delta: 0 });
    this.bus.emit({ type: 'moves:changed', movesLeft: this.movesLeft, delta: 0 });
    this.bus.emit({ type: 'boosters:changed', bomb: this.bombsLeft, teleport: this.teleportsLeft });
    this.bus.emit({ type: 'shuffles:changed', shufflesLeft: this.shufflesLeft });
  }

  tap(col: number, row: number): ActionResult {
    if (this.state !== GameState.Playing) return { ok: false, reason: 'not-playing' };
    if (!this.grid.inBounds({ col, row })) return { ok: false, reason: 'out-of-bounds' };

    const origin: Cell = { col, row };
    const tile = this.grid.get(origin);
    if (!tile) return { ok: false, reason: 'empty' };

    let burned: Cell[] = [];
    let scoreDelta = 0;
    let superCreated: Tile | null = null;

    if (tile.superTile !== SuperTileKind.None) {
      const allBurned = this.collectCascadeBurn(origin, tile);
      burned = allBurned.cells;
      scoreDelta = this.scoreCalc.forSuperTileActivation(allBurned.cells.length);
    } else {
      const group = this.matchFinder.findGroup(this.grid, origin);
      if (group.length < 2) {
        this.bus.emit({ type: 'log', message: 'Нет группы для сжигания' });
        return { ok: false, reason: 'no-group' };
      }
      burned = group;
      scoreDelta = this.scoreCalc.forGroup(group.length);
      if (group.length >= this.config.superTileThreshold) {
        const kind = this.superTileFactory.randomKind();
        const superTile = this.tileFactory.create(tile.color, col, row, kind);
        burned = group.filter((c) => !(c.col === col && c.row === row));
        superCreated = superTile;
      }
    }

    const removedTiles: Array<{ id: number; col: number; row: number; color: TileColor }> = [];
    for (const c of burned) {
      const t = this.grid.remove(c);
      if (t) removedTiles.push({ id: t.id, col: c.col, row: c.row, color: t.color });
    }
    this.bus.emit({ type: 'tiles:removed', tiles: removedTiles });

    if (superCreated) {
      this.grid.set({ col, row }, superCreated);
      this.bus.emit({ type: 'super:created', tile: superCreated });
    }
    this.addScore(scoreDelta);
    this.spendMove();
    this.gravityAndRefill();
    this.endTurn();

    return { ok: true };
  }

  useBomb(col: number, row: number): ActionResult {
    if (this.state !== GameState.Playing) return { ok: false, reason: 'not-playing' };
    if (this.bombsLeft <= 0) return { ok: false, reason: 'no-bombs' };
    if (!this.grid.inBounds({ col, row })) return { ok: false, reason: 'out-of-bounds' };

    const cells = this.bomb.activate(this.grid, { col, row });
    const removedTiles: Array<{ id: number; col: number; row: number; color: TileColor }> = [];
    for (const c of cells) {
      const t = this.grid.remove(c);
      if (t) removedTiles.push({ id: t.id, col: c.col, row: c.row, color: t.color });
    }
    this.bus.emit({ type: 'tiles:removed', tiles: removedTiles });

    const scoreDelta = this.scoreCalc.forGroup(cells.length) + 50;
    this.addScore(scoreDelta);

    this.bombsLeft = Math.max(0, this.bombsLeft - 1);
    this.bus.emit({ type: 'boosters:changed', bomb: this.bombsLeft, teleport: this.teleportsLeft });

    this.gravityAndRefill();
    this.endTurn();

    return { ok: true };
  }

  useTeleport(a: Cell, b: Cell): ActionResult {
    if (this.state !== GameState.Playing) return { ok: false, reason: 'not-playing' };
    if (this.teleportsLeft <= 0) return { ok: false, reason: 'no-teleports' };
    if (!this.grid.inBounds(a) || !this.grid.inBounds(b)) return { ok: false, reason: 'out-of-bounds' };
    if (!this.grid.get(a) || !this.grid.get(b)) return { ok: false, reason: 'empty' };
    if (a.col === b.col && a.row === b.row) return { ok: false, reason: 'same-cell' };

    this.grid.swap(a, b);

    const ta = this.grid.get(a)!;
    const tb = this.grid.get(b)!;
    this.bus.emit({
      type: 'tiles:moved',
      moves: [
        { id: tb.id, fromCol: a.col, fromRow: a.row, toCol: b.col, toRow: b.row },
        { id: ta.id, fromCol: b.col, fromRow: b.row, toCol: a.col, toRow: a.row }
      ]
    });

    this.teleportsLeft = Math.max(0, this.teleportsLeft - 1);
    this.bus.emit({ type: 'boosters:changed', bomb: this.bombsLeft, teleport: this.teleportsLeft });
    this.endTurn();

    return { ok: true };
  }

  private collectCascadeBurn(origin: Cell, originTile: Tile): { cells: Cell[] } {
    const visited = new Set<string>();
    const out: Cell[] = [];
    const queue: Cell[] = [origin];

    while (queue.length) {
      const c = queue.pop()!;
      const key = `${c.col},${c.row}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const t = this.grid.get(c);
      if (!t) continue;
      out.push(c);

      if (t.superTile !== SuperTileKind.None && !(c.col === origin.col && c.row === origin.row)) {
        const strategy = this.superTileFactory.strategyFor(t.superTile);
        const affected = strategy.computeAffected(this.grid, c);
        for (const a of affected) {
          const k = `${a.col},${a.row}`;
          if (!visited.has(k)) queue.push(a);
        }
      }
    }
    if (originTile.superTile !== SuperTileKind.None) {
      const strategy = this.superTileFactory.strategyFor(originTile.superTile);
      const affected = strategy.computeAffected(this.grid, origin);
      for (const a of affected) {
        const k = `${a.col},${a.row}`;
        if (!visited.has(k)) {
          const t = this.grid.get(a);
          if (t) {
            visited.add(k);
            out.push(a);
            if (t.superTile !== SuperTileKind.None) {
              const sub = this.superTileFactory.strategyFor(t.superTile).computeAffected(this.grid, a);
              for (const s of sub) if (!visited.has(`${s.col},${s.row}`)) queue.push(s);
            }
          }
        }
      }
    }
    return { cells: out };
  }

  private gravityAndRefill(): void {
    const moves = this.grid.applyGravity();
    if (moves.length) this.bus.emit({ type: 'tiles:moved', moves });
    const spawned: Tile[] = [];
    const emptiesByCol = this.grid.emptyCellsByColumn();
    for (let col = 0; col < this.grid.cols; col++) {
      const empties = emptiesByCol[col];
      if (!empties.length) continue;
      for (const cell of empties) {
        const color = this.randomColor();
        const t = this.tileFactory.create(color, cell.col, cell.row);
        this.grid.set(cell, t);
        spawned.push(t);
      }
    }
    if (spawned.length) this.bus.emit({ type: 'tiles:spawned', tiles: spawned });
  }

  private endTurn(): void {
    if (this.score >= this.config.targetScore) {
      this.setState(GameState.Won);
      return;
    }
    if (this.movesLeft <= 0) {
      this.setState(GameState.Lost);
      return;
    }
    if (!this.matchFinder.hasAnyMove(this.grid)) {
      if (this.shufflesLeft > 0) {
        const ok = this.shuffleService.shuffle(this.grid);
        if (ok) {
          this.shufflesLeft--;
          this.bus.emit({ type: 'shuffles:changed', shufflesLeft: this.shufflesLeft });
          this.bus.emit({ type: 'grid:changed' });
          this.bus.emit({ type: 'log', message: `Нет ходов — перемешивание! Осталось: ${this.shufflesLeft}` });
        } else {
          this.setState(GameState.Lost);
          return;
        }
      } else {
        this.setState(GameState.Lost);
        return;
      }
    }
    this.bus.emit({ type: 'grid:changed' });
  }

  private addScore(delta: number): void {
    if (delta <= 0) return;
    this.score += delta;
    this.bus.emit({ type: 'score:changed', score: this.score, delta });
  }

  private spendMove(): void {
    this.movesLeft = Math.max(0, this.movesLeft - 1);
    this.bus.emit({ type: 'moves:changed', movesLeft: this.movesLeft, delta: -1 });
  }

  private setState(s: GameState): void {
    this.state = s;
    this.bus.emit({ type: 'state:changed', state: s });
  }

  private randomColor(): TileColor {
    const cs = this.config.colors;
    return cs[Math.floor(Math.random() * cs.length)];
  }

  private fillBoard(): void {
    for (let row = 0; row < this.grid.rows; row++) {
      for (let col = 0; col < this.grid.cols; col++) {
        const t = this.tileFactory.create(this.randomColor(), col, row);
        this.grid.set({ col, row }, t);
      }
    }
  }
}
