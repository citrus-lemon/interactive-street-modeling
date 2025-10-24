import { Box, Point, Polygon } from "@flatten-js/core";
import { BoardGrid } from "./BoardGrid";

export type SquareGridCell = string; // Format: "row,col" e.g., "0,0", "2,5"

/**
 * SquareGrid - A rectangular grid of square cells
 * Cells are referenced by "row,col" string format for stable Map/Set keys
 */
export class SquareGrid implements BoardGrid<SquareGridCell> {
  readonly bound: Box;
  private readonly rows: number;
  private readonly cols: number;
  private readonly cellSize: number;
  private readonly origin: Point;

  constructor(bound: Box, cellSize: number) {
    this.bound = bound;
    this.cellSize = cellSize;
    this.origin = new Point(bound.xmin, bound.ymin);

    // Calculate grid dimensions based on bounds
    this.cols = Math.ceil((bound.xmax - bound.xmin) / cellSize);
    this.rows = Math.ceil((bound.ymax - bound.ymin) / cellSize);
  }

  getCellAt(point: Point): SquareGridCell {
    // Convert world coordinates to grid coordinates
    const col = Math.floor((point.x - this.origin.x) / this.cellSize);
    const row = Math.floor((point.y - this.origin.y) / this.cellSize);

    // Clamp to grid bounds (since any point in bound should have a cell)
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));

    return `${clampedRow},${clampedCol}`;
  }

  getNeighbors(cell: SquareGridCell): SquareGridCell[] {
    const [row, col] = this.parseCell(cell);
    const neighbors: SquareGridCell[] = [];

    // 4-connected neighbors (orthogonal only)
    const directions = [
      [-1, 0], // up
      [1, 0], // down
      [0, -1], // left
      [0, 1], // right
    ];

    // Uncomment for 8-connected (including diagonals)
    // const directions = [
    //   [-1, -1], [-1, 0], [-1, 1],
    //   [0, -1],           [0, 1],
    //   [1, -1],  [1, 0],  [1, 1]
    // ];
    for (const [dr, dc] of directions) {
      const newRow = row + dr;
      const newCol = col + dc;

      if (
        newRow >= 0 &&
        newRow < this.rows &&
        newCol >= 0 &&
        newCol < this.cols
      ) {
        neighbors.push(`${newRow},${newCol}`);
      }
    }

    return neighbors;
  }

  getCellCenter(cell: SquareGridCell): Point {
    const [row, col] = this.parseCell(cell);

    return new Point(
      this.origin.x + (col + 0.5) * this.cellSize,
      this.origin.y + (row + 0.5) * this.cellSize
    );
  }

  getCellBoundary(cell: SquareGridCell): Polygon {
    const [row, col] = this.parseCell(cell);

    // Calculate corner points of the square
    const left = this.origin.x + col * this.cellSize;
    const right = left + this.cellSize;
    const top = this.origin.y + row * this.cellSize;
    const bottom = top + this.cellSize;

    // Create polygon from corners (clockwise)
    return new Polygon([
      new Point(left, top),
      new Point(right, top),
      new Point(right, bottom),
      new Point(left, bottom),
    ]);
  }

  *getAllCells(): Generator<SquareGridCell, void, unknown> {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        yield `${row},${col}`;
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

  // Utility methods for grid information
  getRowCount(): number {
    return this.rows;
  }

  getColumnCount(): number {
    return this.cols;
  }

  getCellSize(): number {
    return this.cellSize;
  }
}
