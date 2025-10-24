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

  // Grid bounds in axial coordinates
  private readonly qMin: number;
  private readonly qMax: number;
  private readonly rMin: number;
  private readonly rMax: number;

  constructor(
    bound: Box,
    hexSize: number,
    orientation: "flat" | "pointy" = "flat"
  ) {
    this.bound = bound;
    this.hexSize = hexSize;
    this.orientation = orientation;
    this.origin = new Point(bound.xmin + hexSize * 2, bound.ymin + hexSize * 2);

    // Calculate grid bounds in axial coordinates
    const topLeft = this.pixelToAxialRaw(new Point(bound.xmin, bound.ymin));
    const bottomRight = this.pixelToAxialRaw(new Point(bound.xmax, bound.ymax));

    this.qMin = Math.floor(Math.min(topLeft.q, bottomRight.q)) - 1;
    this.qMax = Math.ceil(Math.max(topLeft.q, bottomRight.q)) + 1;
    this.rMin = Math.floor(Math.min(topLeft.r, bottomRight.r)) - 1;
    this.rMax = Math.ceil(Math.max(topLeft.r, bottomRight.r)) + 1;
  }

  getCellAt(point: Point): HexagonGridCell {
    const axial = this.pixelToAxial(point);

    // Check if within grid bounds and clamp if necessary
    const q = Math.max(this.qMin, Math.min(axial.q, this.qMax));
    const r = Math.max(this.rMin, Math.min(axial.r, this.rMax));

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
      if (
        newQ >= this.qMin &&
        newQ <= this.qMax &&
        newR >= this.rMin &&
        newR <= this.rMax
      ) {
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

  *getAllCells(): Generator<HexagonGridCell, void, unknown> {
    for (let q = this.qMin; q <= this.qMax; q++) {
      for (let r = this.rMin; r <= this.rMax; r++) {
        // Check if hex center is within bounds
        const center = this.axialToPixel(q, r);
        if (
          center.x >= this.bound.xmin &&
          center.x <= this.bound.xmax &&
          center.y >= this.bound.ymin &&
          center.y <= this.bound.ymax
        ) {
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

  // ============= Utility Methods =============

  /**
   * Get the distance between two hexagons (in hex steps)
   */
  getHexDistance(cell1: HexagonGridCell, cell2: HexagonGridCell): number {
    const [q1, r1] = this.parseCell(cell1);
    const [q2, r2] = this.parseCell(cell2);

    // Convert to cube coordinates and calculate Manhattan distance
    const s1 = -q1 - r1;
    const s2 = -q2 - r2;

    return (Math.abs(q1 - q2) + Math.abs(r1 - r2) + Math.abs(s1 - s2)) / 2;
  }

  /**
   * Get a line of hexagons between two cells
   */
  getHexLine(start: HexagonGridCell, end: HexagonGridCell): HexagonGridCell[] {
    const [q1, r1] = this.parseCell(start);
    const [q2, r2] = this.parseCell(end);

    const distance = this.getHexDistance(start, end);
    const line: HexagonGridCell[] = [];

    for (let i = 0; i <= distance; i++) {
      const t = distance === 0 ? 0 : i / distance;
      const q = Math.round(q1 + (q2 - q1) * t);
      const r = Math.round(r1 + (r2 - r1) * t);
      line.push(`${q},${r}`);
    }

    return line;
  }

  /**
   * Get all hexagons within a certain distance from a center hex
   */
  getHexesInRange(center: HexagonGridCell, range: number): HexagonGridCell[] {
    const [q, r] = this.parseCell(center);
    const hexes: HexagonGridCell[] = [];

    for (let dq = -range; dq <= range; dq++) {
      for (
        let dr = Math.max(-range, -dq - range);
        dr <= Math.min(range, -dq + range);
        dr++
      ) {
        const newQ = q + dq;
        const newR = r + dr;

        if (
          newQ >= this.qMin &&
          newQ <= this.qMax &&
          newR >= this.rMin &&
          newR <= this.rMax
        ) {
          hexes.push(`${newQ},${newR}`);
        }
      }
    }

    return hexes;
  }

  /**
   * Get ring of hexagons at exact distance from center
   */
  getHexRing(center: HexagonGridCell, radius: number): HexagonGridCell[] {
    if (radius === 0) return [center];

    const [q, r] = this.parseCell(center);
    const ring: HexagonGridCell[] = [];

    // Start from a corner and walk around the ring
    let hex = { q: q - radius, r: r + radius };

    const directions = [
      [+1, -1],
      [+1, 0],
      [0, +1],
      [-1, +1],
      [-1, 0],
      [0, -1],
    ];

    for (const [dq, dr] of directions) {
      for (let i = 0; i < radius; i++) {
        if (
          hex.q >= this.qMin &&
          hex.q <= this.qMax &&
          hex.r >= this.rMin &&
          hex.r <= this.rMax
        ) {
          ring.push(`${hex.q},${hex.r}`);
        }
        hex.q += dq;
        hex.r += dr;
      }
    }

    return ring;
  }

  // ============= Grid Information =============

  getHexSize(): number {
    return this.hexSize;
  }

  getOrientation(): "flat" | "pointy" {
    return this.orientation;
  }

  getGridBounds(): { qMin: number; qMax: number; rMin: number; rMax: number } {
    return {
      qMin: this.qMin,
      qMax: this.qMax,
      rMin: this.rMin,
      rMax: this.rMax,
    };
  }
}
