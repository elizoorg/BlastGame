import { Cell } from '../core/types';
import { Grid } from '../core/Grid';

interface Booster {
  readonly name: string;
  activate(grid: Grid, ...args: Cell[]): Cell[];
}

export class BombBooster implements Booster {
  readonly name = 'bomb';
  constructor(private readonly radius: number) {}

  activate(grid: Grid, target: Cell): Cell[] {
    const out: Cell[] = [];
    for (let dr = -this.radius; dr <= this.radius; dr++) {
      for (let dc = -this.radius; dc <= this.radius; dc++) {
        const c: Cell = { col: target.col + dc, row: target.row + dr };
        if (grid.inBounds(c) && grid.get(c)) out.push(c);
      }
    }
    return out;
  }
}

export class TeleportBooster implements Booster {
  readonly name = 'teleport';

  activate(grid: Grid, a: Cell, b: Cell): Cell[] {
    if (!grid.inBounds(a) || !grid.inBounds(b)) return [];
    if (!grid.get(a) || !grid.get(b)) return [];
    if (a.col === b.col && a.row === b.row) return [];
    return [];
  }
}
