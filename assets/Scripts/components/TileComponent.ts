import { TileColor, SuperTileKind, Tile } from '../core/types';
import { SPRITE_ASSET_NAMES, FONT_FAMILY } from '../core/constants';

const { ccclass, property } = cc._decorator;

@ccclass
export default class TileComponent extends cc.Component {
  @property({ type: cc.Sprite, tooltip: 'Спрайт тела тайла (block_red, block_blue, ...)' })
  body: cc.Sprite = null;

  @property({ type: cc.Sprite, tooltip: 'Спрайт супер-тайла (block_bomb, block_rakets, ...)' })
  superMark: cc.Sprite = null;

  tileId: number = -1;
  color: TileColor = TileColor.Red;
  superKind: SuperTileKind = SuperTileKind.None;
  private colorSprites: cc.SpriteFrame[] = [];

  private superSprites: Record<SuperTileKind, cc.SpriteFrame | null> = {
    [SuperTileKind.None]: null,
    [SuperTileKind.RowClear]: null,
    [SuperTileKind.ColumnClear]: null,
    [SuperTileKind.AreaClear]: null,
    [SuperTileKind.AllClear]: null
  };

  applyTile(
    tile: Tile,
    colorSprites: cc.SpriteFrame[],
    superSprites: Record<SuperTileKind, cc.SpriteFrame | null>
  ): void {
    this.tileId = tile.id;
    this.color = tile.color;
    this.superKind = tile.superTile;
    this.colorSprites = colorSprites;
    this.superSprites = superSprites;
    this.refresh();
  }

  setColor(color: TileColor, colorSprites: cc.SpriteFrame[]): void {
    this.color = color;
    this.colorSprites = colorSprites;
    this.body.spriteFrame = colorSprites[color] ?? null;
  }

  setSuperKind(kind: SuperTileKind, superSprites: Record<SuperTileKind, cc.SpriteFrame | null>): void {
    this.superKind = kind;
    this.superSprites = superSprites;
    this.refresh();
  }

  private refresh(): void {
    this.body.spriteFrame = this.colorSprites[this.color] ?? null;
    this.body.node.color = cc.Color.WHITE;
    this.body.node.opacity = 255;
    this.body.node.active = true;
    
    if (this.superKind === SuperTileKind.None) {
      this.superMark.node.active = false;
      this.superMark.node.angle = 0;
      this.node.stopAllActions();
      this.node.scale = 1;
    } else {
      this.superMark.node.active = true;
      this.superMark.spriteFrame = this.superSprites[this.superKind] ?? null;
      this.superMark.node.color = cc.Color.WHITE;
      this.superMark.node.opacity = 255;
      this.superMark.node.angle = 0; 

      // Лёгкая пульсация.
      this.node.stopAllActions();
      cc.tween(this.node)
        .repeatForever(
          cc.tween(this.node)
            .to(0.6, { scale: 1.06 })
            .to(0.6, { scale: 1.0 })
        )
        .start();
    }

    this.node.opacity = 255;
    this.node.color = cc.Color.WHITE;
  }
}
