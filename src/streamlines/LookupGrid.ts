import Cell from "./Cell";
import Vector from "./Vector";

export class LookupGrid {
  declare bbox: BoundingBox;
  declare dSep: number;
  declare cells: Map<number, Map<number, Cell>>;
  declare bboxSize: number;
  declare cellsCount: number;
  constructor(bbox: BoundingBox, dSep: number) {
    this.bbox = bbox;
    this.dSep = dSep;
    this.bboxSize = Math.max(bbox.width, bbox.height);
    this.cellsCount = Math.ceil(this.bboxSize / dSep);
    this.cells = new Map();
  }

  static create(bbox: BoundingBox, dSep: number) {
    return new LookupGrid(bbox, dSep);
  }

  findNearest(x: number, y: number) {
    var cx = this.gridX(x);
    var cy = this.gridY(y);
    let minDistance = Infinity;

    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= this.cellsCount) continue;

      var cellRow = this.cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= this.cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if (!cellCol) continue;
        let d = cellCol.getMinDistance(x, y);
        if (d < minDistance) minDistance = d;
      }
    }

    return minDistance;
  }

  isOutside(x: number, y: number) {
    return (
      x < this.bbox.left ||
      x > this.bbox.left + this.bbox.width ||
      y < this.bbox.top ||
      y > this.bbox.top + this.bbox.height
    );
  }

  occupyCoordinates(point: Vector) {
    var x = point.x,
      y = point.y;
    this.getCellByCoordinates(x, y).occupy(point);
  }

  isTaken(
    x: number,
    y: number,
    checkCallback: (distance: number, point: Vector) => boolean
  ) {
    if (!this.cells) return false;

    var cx = this.gridX(x);
    var cy = this.gridY(y);
    for (var col = -1; col < 2; ++col) {
      var currentCellX = cx + col;
      if (currentCellX < 0 || currentCellX >= this.cellsCount) continue;

      var cellRow = this.cells.get(currentCellX);
      if (!cellRow) continue;

      for (var row = -1; row < 2; ++row) {
        var currentCellY = cy + row;
        if (currentCellY < 0 || currentCellY >= this.cellsCount) continue;

        var cellCol = cellRow.get(currentCellY);
        if (!cellCol) continue;
        if (cellCol.isTaken(x, y, checkCallback)) return true;
      }
    }

    return false;
  }

  getCellByCoordinates(x: number, y: number) {
    this.assertInBounds(x, y);

    var rowCoordinate = this.gridX(x);
    var row = this.cells.get(rowCoordinate);
    if (!row) {
      row = new Map();
      this.cells.set(rowCoordinate, row);
    }
    var colCoordinate = this.gridY(y);
    var cell = row.get(colCoordinate);
    if (!cell) {
      cell = new Cell();
      row.set(colCoordinate, cell);
    }
    return cell;
  }

  gridX(x: number) {
    return Math.floor((this.cellsCount * (x - this.bbox.left)) / this.bboxSize);
  }

  gridY(y: number) {
    return Math.floor((this.cellsCount * (y - this.bbox.top)) / this.bboxSize);
  }

  assertInBounds(x: number, y: number) {
    if (this.bbox.left > x || this.bbox.left + this.bboxSize < x) {
      throw new Error("x is out of bounds");
    }
    if (this.bbox.top > y || this.bbox.top + this.bboxSize < y) {
      throw new Error("y is out of bounds");
    }
  }
}

export default LookupGrid;
