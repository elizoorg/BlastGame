export enum TileColor {
  Red = 0,
  Yellow = 1,
  Green = 2,
  Blue = 3,
  Purple = 4,
  Orange = 5
}

export enum SuperTileKind {
  None = 0,
  RowClear = 1,
  ColumnClear = 2,
  AreaClear = 3,
  AllClear = 4
}

export enum GameState {
  Ready = 'ready',
  Playing = 'playing',
  Won = 'won',
  Lost = 'lost',
  Busy = 'busy'
}

export interface Cell {
  readonly col: number;
  readonly row: number;
}

export type TileId = number;

export interface Tile {
  readonly id: TileId;
  color: TileColor;
  superTile: SuperTileKind;
  col: number;
  row: number;
}

export type GameEvent =
  | { type: 'grid:changed' }
  | { type: 'tiles:removed'; tiles: ReadonlyArray<{ id: TileId; col: number; row: number; color: TileColor }> }
  | { type: 'tiles:moved'; moves: ReadonlyArray<{ id: TileId; fromCol: number; fromRow: number; toCol: number; toRow: number }> }
  | { type: 'tiles:spawned'; tiles: ReadonlyArray<Tile> }
  | { type: 'score:changed'; score: number; delta: number }
  | { type: 'moves:changed'; movesLeft: number; delta: number }
  | { type: 'shuffles:changed'; shufflesLeft: number }
  | { type: 'state:changed'; state: GameState }
  | { type: 'super:created'; tile: Tile }
  | { type: 'boosters:changed'; bomb: number; teleport: number }
  | { type: 'log'; message: string };
  
export interface IEventBus {
  emit(event: GameEvent): void;
  on(handler: (event: GameEvent) => void): () => void;
}
