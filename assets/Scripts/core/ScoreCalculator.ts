export interface IScoreCalculator {
  forGroup(groupSize: number): number;
  forSuperTileActivation(affectedTileCount: number): number;
}

export class ScoreCalculator implements IScoreCalculator {
  forGroup(groupSize: number): number {
    if (groupSize < 2) return 0;
    return groupSize * (groupSize - 1) * 10;
  }

  forSuperTileActivation(affectedTileCount: number): number {
    return Math.floor(this.forGroup(affectedTileCount) * 0.5) + 50;
  }
}
