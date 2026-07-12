import { Cell, TileColor, TileId, SuperTileKind, Tile } from './types';

export class TileFactory {
  private nextId = 1;

  create(color: TileColor, col: number, row: number, superTile: SuperTileKind = SuperTileKind.None): Tile {
    const id: TileId = this.nextId++;
    return { id, color, col, row, superTile };
  }

  reset(): void {
    this.nextId = 1;
  }
}

export function cellEquals(a: Cell, b: Cell): boolean {
  return a.col === b.col && a.row === b.row;
}

export function cellKey(c: Cell): string {
  return `${c.col},${c.row}`;
}
