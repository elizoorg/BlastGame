import { Cell, Tile, TileColor } from './types';

export class Grid {
  readonly cols: number;
  readonly rows: number;
  private tiles: Array<Tile | null>;

  constructor(cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;
    this.tiles = new Array<Tile | null>(cols * rows).fill(null);
  }

  inBounds(c: Cell): boolean {
    return c.col >= 0 && c.col < this.cols && c.row >= 0 && c.row < this.rows;
  }

  get(c: Cell): Tile | null {
    if (!this.inBounds(c)) return null;
    return this.tiles[c.row * this.cols + c.col];
  }

  set(c: Cell, tile: Tile | null): void {
    if (!this.inBounds(c)) return;
    this.tiles[c.row * this.cols + c.col] = tile;
    if (tile) {
      tile.col = c.col;
      tile.row = c.row;
    }
  }

  swap(a: Cell, b: Cell): void {
    const ta = this.get(a);
    const tb = this.get(b);
    this.set(a, tb);
    this.set(b, ta);
  }

  remove(c: Cell): Tile | null {
    const t = this.get(c);
    this.set(c, null);
    return t;
  }

  forEach(handler: (tile: Tile) => void): void {
    for (const t of this.tiles) if (t) handler(t);
  }

  all(): Tile[] {
    const out: Tile[] = [];
    for (const t of this.tiles) if (t) out.push(t);
    return out;
  }

  applyGravity(): ReadonlyArray<{ id: number; fromCol: number; fromRow: number; toCol: number; toRow: number }> {
    const moves: Array<{ id: number; fromCol: number; fromRow: number; toCol: number; toRow: number }> = [];
    for (let col = 0; col < this.cols; col++) {
      let writeRow = 0;
      for (let readRow = 0; readRow < this.rows; readRow++) {
        const cell = { col, row: readRow };
        const t = this.get(cell);
        if (!t) continue;

        if (readRow !== writeRow) {
          const target = { col, row: writeRow };
          this.set(cell, null);
          this.set(target, t);
          moves.push({
            id: t.id,
            fromCol: col,
            fromRow: readRow,
            toCol: col,
            toRow: writeRow
          });
        }
        writeRow++;
      }
    }
    return moves;
  }

  emptyCellsByColumn(): Cell[][] {
    const byCol: Cell[][] = [];
    for (let col = 0; col < this.cols; col++) {
      const empties: Cell[] = [];
      for (let row = 0; row < this.rows; row++) {
        if (!this.get({ col, row })) empties.push({ col, row });
      }
      byCol.push(empties);
    }
    return byCol;
  }

  countColors(): Map<TileColor, number> {
    const counts = new Map<TileColor, number>();
    this.forEach((t) => counts.set(t.color, (counts.get(t.color) ?? 0) + 1));
    return counts;
  }

  snapshotColors(): (TileColor | null)[] {
    return this.tiles.map((t) => (t ? t.color : null));
  }
  
  applyColors(colors: (TileColor | null)[]): void {
    if (colors.length !== this.tiles.length) {
      throw new Error('applyColors: layout mismatch');
    }
    for (let i = 0; i < this.tiles.length; i++) {
      const t = this.tiles[i];
      const c = colors[i];
      if (t && c !== null) t.color = c;
    }
  }
}
