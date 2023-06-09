export class Dimension {
  static SIDES = {
    TOP: "top",
    RIGHT: "right",
    BOTTOM: "bottom",
    LEFT: "left",
  };

  static getClockwiseSides() {
    return [
      Dimension.SIDES.TOP,
      Dimension.SIDES.RIGHT,
      Dimension.SIDES.BOTTOM,
      Dimension.SIDES.LEFT,
    ];
  }

  static getRelatedSpatialAttr(side) {
    const SPATIAL_ATTRIBUTES = {
      [Dimension.SIDES.TOP]: "height",
      [Dimension.SIDES.BOTTOM]: "height",
      [Dimension.SIDES.RIGHT]: "width",
      [Dimension.SIDES.LEFT]: "width",
    };
    return SPATIAL_ATTRIBUTES[side];
  }
}
