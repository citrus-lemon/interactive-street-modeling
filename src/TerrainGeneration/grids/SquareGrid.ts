import { Box, point, Point, Polygon } from "@flatten-js/core";
import { BoardGrid } from "./BoardGrid";

export type SquareGridCell = string; // Format: "row,col" e.g., "0,0", "2,5"

/**
 * SquareGrid - A rectangular grid of square cells
 * Cells are referenced by "row,col" string format for stable Map/Set keys
 */
export class SquareGrid implements BoardGrid<SquareGridCell> {
  readonly bound: Box;
  private readonly cellSize: number;
  private readonly origin: Point;

  constructor(bound: Box, cellSize: number) {
    this.bound = bound;
    this.cellSize = cellSize;
    this.origin = new Point(0, 0);
  }

  getCellAt(point: Point): SquareGridCell {
    const xx = Math.floor(
      (point.x - this.origin.x + this.cellSize / 2) / this.cellSize
    );
    const yy = Math.floor(
      (point.y - this.origin.y + this.cellSize / 2) / this.cellSize
    );

    return `${xx},${yy}`;
  }

  getNeighbors(cell: SquareGridCell): SquareGridCell[] {
    const [xx, yy] = this.parseCell(cell);

    // 4-connected neighbors (orthogonal only)
    const directions = [
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
    ];

    return directions
      .map(([dx, dy]) => [xx + dx, yy + dy])
      .filter(([xx, yy]) =>
        this.bound.contains(
          point(
            xx * this.cellSize + this.origin.x,
            yy * this.cellSize + this.origin.y
          )
        )
      )
      .map(([xx, yy]) => `${xx},${yy}`);
  }

  getCellCenter(cell: SquareGridCell): Point {
    const [xx, yy] = this.parseCell(cell);
    return point(
      xx * this.cellSize + this.origin.x,
      yy * this.cellSize + this.origin.y
    );
  }

  getCellBoundary(cell: SquareGridCell): Polygon {
    const [xx, yy] = this.parseCell(cell);
    return new Polygon(
      new Box(
        (xx - 0.5) * this.cellSize + this.origin.x,
        (yy - 0.5) * this.cellSize + this.origin.y,
        (xx + 0.5) * this.cellSize + this.origin.x,
        (yy + 0.5) * this.cellSize + this.origin.y
      )
    );
  }

  *getAllCells() {
    const [xxmin, xxmax, yymin, yymax] = [
      Math.floor((this.bound.xmin - this.origin.x) / this.cellSize + 0.5),
      Math.ceil((this.bound.xmax - this.origin.x) / this.cellSize + 0.5),
      Math.floor((this.bound.ymin - this.origin.y) / this.cellSize + 0.5),
      Math.ceil((this.bound.ymax - this.origin.y) / this.cellSize + 0.5),
    ];
    for (let xx = xxmin; xx < xxmax; xx++) {
      for (let yy = yymin; yy < yymax; yy++) {
        yield `${xx},${yy}`;
      }
    }
  }

  // Helper method to parse cell reference
  private parseCell(cell: SquareGridCell): [number, number] {
    const [row, col] = cell.split(",").map(Number);
    if (isNaN(row) || isNaN(col)) {
      throw new Error(`Invalid cell reference: ${cell}`);
    }
    return [row, col];
  }

  toString() {
    return `SquareBoard`;
  }
}

type SquareGridParameters = {
  bound: Box;
  cellSize: number;
};
export const squareGrid = ({ bound, cellSize }: SquareGridParameters) =>
  new SquareGrid(bound, cellSize);
