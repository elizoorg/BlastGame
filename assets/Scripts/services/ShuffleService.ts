import { Grid } from '../core/Grid';
import { MatchFinder } from '../core/MatchFinder';
import { TileColor } from '../core/types';

export class ShuffleService {
  private readonly matchFinder: MatchFinder;

  constructor(matchFinder: MatchFinder) {
    this.matchFinder = matchFinder;
  }

  shuffle(grid: Grid, maxAttempts = 30): boolean {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const colors = grid.snapshotColors();
      const present: TileColor[] = colors.filter((c): c is TileColor => c !== null);

      this.fisherYates(present);

      let writeIdx = 0;
      const next = colors.map((c) => (c === null ? null : present[writeIdx++]));
      grid.applyColors(next);

      if (this.matchFinder.hasAnyMove(grid)) {
        return true;
      }
    }
    return false;
  }

  private fisherYates<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
  }
}
