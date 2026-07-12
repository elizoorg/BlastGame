import { SuperTileKind } from '../core/types';
import { SuperTileStrategy, RowClearStrategy, ColumnClearStrategy, AreaClearStrategy, AllClearStrategy } from './strategies';

export class SuperTileFactory {
  private readonly strategies: Map<SuperTileKind, SuperTileStrategy>;

  constructor(superTileAreaRadius: number) {
    this.strategies = new Map<SuperTileKind, SuperTileStrategy>([
      [SuperTileKind.RowClear, new RowClearStrategy()],
      [SuperTileKind.ColumnClear, new ColumnClearStrategy()],
      [SuperTileKind.AreaClear, new AreaClearStrategy(superTileAreaRadius)],
      [SuperTileKind.AllClear, new AllClearStrategy()]
    ]);
  }

  randomKind(): SuperTileKind {
    const kinds = [
      SuperTileKind.RowClear,
      SuperTileKind.ColumnClear,
      SuperTileKind.AreaClear,
      SuperTileKind.AllClear
    ];
    return kinds[Math.floor(Math.random() * kinds.length)];
  }
  
  strategyFor(kind: SuperTileKind): SuperTileStrategy {
    const s = this.strategies.get(kind);
    if (!s) throw new Error(`No strategy registered for kind ${kind}`);
    return s;
  }
}
