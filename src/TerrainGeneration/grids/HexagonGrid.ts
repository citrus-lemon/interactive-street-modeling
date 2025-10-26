import { Box, Point, Polygon } from "@flatten-js/core";
import { BoardGrid } from "./BoardGrid";

export type HexagonGridCell = string; // Format: "q,r" e.g., "0,0", "2,-1"

/**
 * HexagonGrid - A hexagonal grid tessellation
 *
 * Uses axial coordinates (q, r) for efficient neighbor calculations.
 * Cells are referenced by "q,r" string format for stable Map/Set keys.
 *
 * Supports both flat-top and pointy-top orientations:
 * - Flat-top: Hexagon has flat edges on top/bottom (wider than tall)
 * - Pointy-top: Hexagon has points on top/bottom (taller than wide)
 */
export class HexagonGrid implements BoardGrid<HexagonGridCell> {
  readonly bound: Box;
  private readonly hexSize: number;
  private readonly orientation: "flat" | "pointy";
  private readonly origin: Point;

  constructor(
    bound: Box,
    hexSize: number,
    orientation: "flat" | "pointy" = "flat"
  ) {
    this.bound = bound;
    this.hexSize = hexSize;
    this.orientation = orientation;
    this.origin = new Point(bound.xmin + hexSize * 2, bound.ymin + hexSize * 2);
  }

  getCellAt(point: Point): HexagonGridCell {
    const { q, r } = this.pixelToAxial(point);
    return `${q},${r}`;
  }

  getNeighbors(cell: HexagonGridCell): HexagonGridCell[] {
    const [q, r] = this.parseCell(cell);
    const neighbors: HexagonGridCell[] = [];

    // Axial coordinate directions for hex neighbors
    const directions = [
      [+1, 0], // East
      [+1, -1], // Northeast
      [0, -1], // Northwest
      [-1, 0], // West
      [-1, +1], // Southwest
      [0, +1], // Southeast
    ];

    for (const [dq, dr] of directions) {
      const newQ = q + dq;
      const newR = r + dr;

      // Check if within grid bounds
      if (this.bound.contains(this.axialToPixel(newQ, newR))) {
        neighbors.push(`${newQ},${newR}`);
      }
    }

    return neighbors;
  }

  getCellCenter(cell: HexagonGridCell): Point {
    const [q, r] = this.parseCell(cell);
    return this.axialToPixel(q, r);
  }

  getCellBoundary(cell: HexagonGridCell): Polygon {
    const center = this.getCellCenter(cell);
    const corners = this.getHexCorners(center);
    return new Polygon(corners);
  }

  *getAllCells() {
    // Calculate grid bounds in axial coordinates
    const topLeft = this.pixelToAxialRaw(
      new Point(this.bound.xmin, this.bound.ymin)
    );
    const bottomRight = this.pixelToAxialRaw(
      new Point(this.bound.xmax, this.bound.ymax)
    );
    const bottomLeft = this.pixelToAxialRaw(
      new Point(this.bound.xmin, this.bound.ymax)
    );

    const qMin = Math.floor(topLeft.q);
    const qMax = Math.ceil(bottomRight.q);
    const rMin = Math.floor(topLeft.r);
    const rMax = Math.ceil(bottomLeft.r);
    // FIXIT: pointy need to be fix
    for (let q = qMin; q <= qMax; q++) {
      const d = Math.floor((q - qMin) / 2);
      for (let r = rMin - d; r <= rMax - d; r++) {
        if (this.bound.contains(this.axialToPixel(q, r))) {
          yield `${q},${r}`;
        }
      }
    }
  }

  // ============= Coordinate Conversion Methods =============

  /**
   * Convert axial coordinates to pixel coordinates
   */
  private axialToPixel(q: number, r: number): Point {
    if (this.orientation === "flat") {
      const x = this.hexSize * (1.5 * q) + this.origin.x;
      const y = this.hexSize * (Math.sqrt(3) * (r + 0.5 * q)) + this.origin.y;
      return new Point(x, y);
    } else {
      const x = this.hexSize * (Math.sqrt(3) * (q + 0.5 * r)) + this.origin.x;
      const y = this.hexSize * (1.5 * r) + this.origin.y;
      return new Point(x, y);
    }
  }

  /**
   * Convert pixel coordinates to axial coordinates (with rounding)
   */
  private pixelToAxial(point: Point): { q: number; r: number } {
    const raw = this.pixelToAxialRaw(point);
    return this.axialRound(raw.q, raw.r);
  }

  /**
   * Convert pixel to axial without rounding (for bounds calculation)
   */
  private pixelToAxialRaw(point: Point): { q: number; r: number } {
    const x = point.x - this.origin.x;
    const y = point.y - this.origin.y;

    if (this.orientation === "flat") {
      const q = ((2 / 3) * x) / this.hexSize;
      const r = ((-1 / 3) * x + (Math.sqrt(3) / 3) * y) / this.hexSize;
      return { q, r };
    } else {
      const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / this.hexSize;
      const r = ((2 / 3) * y) / this.hexSize;
      return { q, r };
    }
  }

  /**
   * Round fractional axial coordinates to nearest hex
   */
  private axialRound(q: number, r: number): { q: number; r: number } {
    // Convert to cube coordinates for rounding
    const s = -q - r;
    let rq = Math.round(q);
    let rr = Math.round(r);
    let rs = Math.round(s);

    const qDiff = Math.abs(rq - q);
    const rDiff = Math.abs(rr - r);
    const sDiff = Math.abs(rs - s);

    // Fix rounding to maintain q + r + s = 0
    if (qDiff > rDiff && qDiff > sDiff) {
      rq = -rr - rs;
    } else if (rDiff > sDiff) {
      rr = -rq - rs;
    }

    return { q: rq, r: rr };
  }

  /**
   * Get the 6 corner points of a hexagon
   */
  private getHexCorners(center: Point): Point[] {
    const corners: Point[] = [];

    for (let i = 0; i < 6; i++) {
      const angleDeg = this.orientation === "flat" ? 60 * i : 60 * i + 30;
      const angleRad = (Math.PI / 180) * angleDeg;

      corners.push(
        new Point(
          center.x + this.hexSize * Math.cos(angleRad),
          center.y + this.hexSize * Math.sin(angleRad)
        )
      );
    }

    return corners;
  }

  // ============= Helper Methods =============

  /**
   * Parse cell reference string "q,r" into coordinates
   */
  private parseCell(cell: HexagonGridCell): [number, number] {
    const [q, r] = cell.split(",").map(Number);
    if (isNaN(q) || isNaN(r)) {
      throw new Error(`Invalid hex cell reference: ${cell}`);
    }
    return [q, r];
  }
}

type HexagonGridParameters = {
  bound: Box;
  cellSize: number;
  orientation?: "flat" | "pointy";
};
export const hexagonGrid = ({
  bound,
  cellSize,
  orientation,
}: HexagonGridParameters) => new HexagonGrid(bound, cellSize, orientation);
