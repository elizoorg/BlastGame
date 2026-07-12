import { Cell, SuperTileKind } from '../core/types';
import { Grid } from '../core/Grid';

export interface SuperTileStrategy {
  readonly kind: SuperTileKind;
  computeAffected(grid: Grid, origin: Cell): Cell[];
}

export class RowClearStrategy implements SuperTileStrategy {
  readonly kind = SuperTileKind.RowClear;
  computeAffected(grid: Grid, origin: Cell): Cell[] {
    const out: Cell[] = [];
    for (let c = 0; c < grid.cols; c++) {
      if (c === origin.col) continue;
      out.push({ col: c, row: origin.row });
    }
    return out;
  }
}

export class ColumnClearStrategy implements SuperTileStrategy {
  readonly kind = SuperTileKind.ColumnClear;
  computeAffected(grid: Grid, origin: Cell): Cell[] {
    const out: Cell[] = [];
    for (let r = 0; r < grid.rows; r++) {
      if (r === origin.row) continue;
      out.push({ col: origin.col, row: r });
    }
    return out;
  }
}

export class AreaClearStrategy implements SuperTileStrategy {
  readonly kind = SuperTileKind.AreaClear;
  constructor(private readonly radius: number) {}
  computeAffected(grid: Grid, origin: Cell): Cell[] {
    const out: Cell[] = [];
    for (let dr = -this.radius; dr <= this.radius; dr++) {
      for (let dc = -this.radius; dc <= this.radius; dc++) {
        if (dr === 0 && dc === 0) continue;
        const c: Cell = { col: origin.col + dc, row: origin.row + dr };
        if (grid.inBounds(c)) out.push(c);
      }
    }
    return out;
  }
}

export class AllClearStrategy implements SuperTileStrategy {
  readonly kind = SuperTileKind.AllClear;
  computeAffected(grid: Grid): Cell[] {
    const out: Cell[] = [];
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        out.push({ col: c, row: r });
      }
    }
    return out;
  }
}
