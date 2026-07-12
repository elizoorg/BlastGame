import { TileColor, SuperTileKind } from './types';

/**
 * Centralized game configuration.
 *
 * Defaults are calibrated against the supplied design mockup:
 *   - Design resolution: 1080×1920 (portrait phone)
 *   - Board area:        979.67×1091.58 px at (50, 351) in mockup coords
 *   - Cell size:         100×112 px (slightly taller than wide)
 *   - Corner of frame:   122.4×116.1 px (9-slice)
 *   - With 8 cols × 9 rows the inner area = 800×1008, which fits inside the
 *     9-slice frame's inner area (979.67-2*122.4 = 734.87 wide).
 *     → we use 7 cols × 8 rows so the board has comfortable margins.
 */
export interface GameConfig {
  /** Grid columns. */
  readonly cols: number;
  /** Grid rows. */
  readonly rows: number;
  /** Distinct colors available on the board. */
  readonly colors: ReadonlyArray<TileColor>;
  /** Score required to win. */
  readonly targetScore: number;
  /** Total moves allowed before losing. */
  readonly maxMoves: number;
  /** Max shuffle attempts (bonus task #1) before declaring a loss. */
  readonly maxShuffles: number;
  /** Bomb booster blast radius in cells (bonus task #2). */
  readonly bombRadius: number;
  /** Min group size that creates a super tile (bonus task #4). */
  readonly superTileThreshold: number;
  /** Radius for the AreaClear super tile (bonus task #4). */
  readonly superTileAreaRadius: number;
  /** Initial count of bomb boosters. */
  readonly initialBombs: number;
  /** Initial count of teleport boosters. */
  readonly initialTeleports: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  cols: 7,
  rows: 8,
  colors: [
    TileColor.Red,
    TileColor.Yellow,
    TileColor.Green,
    TileColor.Blue,
    TileColor.Purple
  ],
  targetScore: 500,
  maxMoves: 37,
  maxShuffles: 3,
  bombRadius: 1,
  superTileThreshold: 5,
  superTileAreaRadius: 1,
  initialBombs: 5,
  initialTeleports: 3
};

/** Distinct palette for each TileColor, used by the View (fallback only). */
export const TILE_PALETTE: Record<TileColor, { base: string; light: string; dark: string; glow: string }> = {
  [TileColor.Red]:    { base: '#ef476f', light: '#ff8aa8', dark: '#b51f47', glow: 'rgba(239, 71, 111, 0.55)' },
  [TileColor.Yellow]: { base: '#ffd166', light: '#ffe6a8', dark: '#c79a14', glow: 'rgba(255, 209, 102, 0.55)' },
  [TileColor.Green]:  { base: '#06d6a0', light: '#7af0cf', dark: '#048b6a', glow: 'rgba(6, 214, 160, 0.55)' },
  [TileColor.Blue]:   { base: '#118ab2', light: '#5fbfd9', dark: '#0a5a78', glow: 'rgba(17, 138, 178, 0.55)' },
  [TileColor.Purple]: { base: '#8338ec', light: '#b87df5', dark: '#5a1fb0', glow: 'rgba(131, 56, 236, 0.55)' },
  [TileColor.Orange]: { base: '#fb8500', light: '#ffb259', dark: '#b85e00', glow: 'rgba(251, 133, 0, 0.55)' }
};

/**
 * Visual symbol drawn on top of super tiles (informational only — real
 * rendering uses dedicated sprites from the mockup, see SPRITE_ASSET_NAMES).
 */
export const SUPER_TILE_LABEL: Record<SuperTileKind, string> = {
  [SuperTileKind.None]: '',
  [SuperTileKind.RowClear]: '↔',
  [SuperTileKind.ColumnClear]: '↕',
  [SuperTileKind.AreaClear]: '✺',
  [SuperTileKind.AllClear]: '★'
};

/**
 * Asset file names from the supplied mockup (see SETUP.md → Step 1).
 *
 * These exact filenames must exist under `assets/resources/tiles/` and
 * `assets/resources/ui/`. The Cocos project loads them via
 * `cc.resources.load(...)` at runtime and the BoardView maps them onto the
 * correct tile / super-tile kind.
 */
export const SPRITE_ASSET_NAMES = {
  /** Regular colored blocks — one per TileColor. */
  tileColor: {
    [TileColor.Red]:    'block_red',
    [TileColor.Yellow]: 'block_yellow',
    [TileColor.Green]:  'block_green',
    [TileColor.Blue]:   'block_blue',
    [TileColor.Purple]: 'block_purpure',
    [TileColor.Orange]: 'block_orange'
  } as Record<TileColor, string>,

  /**
   * Super-tile sprites — each kind uses its OWN dedicated texture
   * (no rotation tricks). Filenames as supplied in the mockup assets:
   *
   *   - block_rakets             → vertical rocket (ColumnClear — clears column)
   *   - block_rockets_horisontal → horizontal rocket (RowClear — clears row)
   *   - block_bomb               → small bomb (AreaClear, radius R)
   *   - block_bomb_max           → mega bomb (AllClear — whole board)
   */
  superTile: {
    [SuperTileKind.RowClear]:    'block_rockets_horisontal', // горизонтальная ракета
    [SuperTileKind.ColumnClear]: 'block_rakets',             // вертикальная ракета
    [SuperTileKind.AreaClear]:   'block_bomb',               // маленькая бомба
    [SuperTileKind.AllClear]:    'block_bomb_max'            // мега-бомба
  } as Record<SuperTileKind, string>,

  /** UI backgrounds. */
  bg: {
    gameBackground: 'img_bg_game',
    movesFrame:     'bg_frame_moves',
    movesCircle:    'bg_moves',
    playFrame:      'bg_frame_play',
    bonusFrame:     'bg_bonus_purpure',
    bonusLabel:     'slon_bonus_purpure'
  },

  /** Booster icons. */
  booster: {
    bomb:     'icon_booster_bomb',
    teleport: 'icon_booster_teleport'
  }
} as const;

/**
 * Pixel-perfect layout constants from the supplied mockup.
 *
 * All values are in mockup-CSS pixels (origin top-left, Y-down). At runtime
 * the CocosView converts to Cocos coordinates (origin center, Y-up) via the
 * helper in Layout.ts.
 */
export const MOCKUP_LAYOUT = {
  canvas:  { width: 1080, height: 1920 },

  // Top "moves" panel
  movesArea:   { x: 104, y: 30, w: 872, h: 321 },
  movesFrame:  { cornerW: 132.3, cornerH: 129.2 },         // 9-slice corners
  movesCircle: { x: 170, y: 63, w: 228, h: 228 },           // bg_moves.png
  movesNumber: { x: 173, y: 122, fontSize: 80 },            // "37"
  scoreLabel:  { x: 0, y: 100, fontSize: 50, text: 'очки:' }, // centered
  scoreNumber: { x: 0, y: 159, fontSize: 70 },              // "221/500"

  // Center "game_play" board area
  boardArea:   { x: 50, y: 351, w: 979.67, h: 1091.58 },
  boardFrame:  { cornerW: 122.4, cornerH: 116.1 },          // 9-slice corners
  blocksArea:  { x: 91, y: 409, w: 897, h: 213 },            // visible blocks region
  cell:        { w: 100, h: 112 }                            // ONE tile size
} as const;

/** Marvin font family name (must be imported into Cocos as a cc.TTFFont). */
export const FONT_FAMILY = 'Marvin';
