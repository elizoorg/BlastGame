import { Cell, SuperTileKind, Tile, TileColor } from './types';
import { Grid } from './Grid';

export class MatchFinder {
  findGroup(grid: Grid, start: Cell): Cell[] {
    const startTile = grid.get(start);
    if (!startTile) return [];

    const color = startTile.color;
    const visited = new Set<string>();
    const stack: Cell[] = [start];
    const out: Cell[] = [];

    while (stack.length) {
      const c = stack.pop()!;
      const key = `${c.col},${c.row}`;
      if (visited.has(key)) continue;
      visited.add(key);

      const t = grid.get(c);
      if (!t || t.color !== color) continue;
      out.push(c);

      stack.push({ col: c.col + 1, row: c.row });
      stack.push({ col: c.col - 1, row: c.row });
      stack.push({ col: c.col, row: c.row + 1 });
      stack.push({ col: c.col, row: c.row - 1 });
    }
    return out;
  }

  isBurnable(grid: Grid, start: Cell): boolean {
    return this.findGroup(grid, start).length >= 2;
  }

  hasAnyMove(grid: Grid): boolean {
    for (let row = 0; row < grid.rows; row++) {
      for (let col = 0; col < grid.cols; col++) {
        const t = grid.get({ col, row });
        if (!t) continue;
        if (this.isBurnable(grid, { col, row })) return true;
      }
    }
    return false;
  }
  
  findSuperTiles(grid: Grid): Tile[] {
    const out: Tile[] = [];
    grid.forEach((t) => {
      if (t.superTile !== SuperTileKind.None) out.push(t);
    });
    return out;
  }
}
