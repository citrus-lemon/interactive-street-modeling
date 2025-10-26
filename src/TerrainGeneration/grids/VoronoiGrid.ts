import { Box, point, Point, Polygon } from "@flatten-js/core";
import { BoardGrid } from "./BoardGrid";
import { Delaunay, Voronoi } from "d3";

// Point index in the Delaunay triangulation (index into points array)
export type DelaunayPoint = number;
// Triangle index in the Delaunay triangulation (index into triangles array / 3)
export type DelaunayTriangle = number;

/**
 * VoronoiGrid - Implements BoardGrid using Voronoi cells
 * Each cell is a Voronoi region around a point in the Delaunay triangulation
 */
export class VoronoiGrid implements BoardGrid<DelaunayPoint> {
  delaunay: Delaunay<Point>;
  voronoi: Voronoi<Point>;
  readonly delaunayGrid = new DelaunayGrid(this);

  // Cache mapping from point index to triangle indices that include that point
  private _triangles_by_point: DelaunayTriangle[][];

  constructor(points: Point[], readonly bound: Box) {
    this.delaunay = Delaunay.from(
      points,
      (p) => p.x,
      (p) => p.y
    );

    // Initialize array of empty arrays for each point
    this._triangles_by_point = Array.from(
      { length: this.delaunay.points.length / 2 },
      () => []
    );

    // Build reverse mapping: point -> triangles containing that point
    this.delaunay.triangles.forEach((point, e) => {
      const triangleId = Math.floor(e / 3);
      this._triangles_by_point[point].push(triangleId);
    });

    const { xmin, ymin, xmax, ymax } = bound;
    this.voronoi = this.delaunay.voronoi([xmin, ymin, xmax, ymax]);
  }

  /**
   * Check if a point lies inside a triangle using the orientation test
   * Uses cross product to check if point is on the left side of each edge
   */
  private pointInTriangle(point: Point, triangle: DelaunayTriangle): boolean {
    const { triangles, points } = this.delaunay;
    const { x, y } = point;

    // Get triangle vertices
    const [ax, ay] = [
      points[triangles[triangle * 3] * 2],
      points[triangles[triangle * 3] * 2 + 1],
    ];
    const [bx, by] = [
      points[triangles[triangle * 3 + 1] * 2],
      points[triangles[triangle * 3 + 1] * 2 + 1],
    ];
    const [cx, cy] = [
      points[triangles[triangle * 3 + 2] * 2],
      points[triangles[triangle * 3 + 2] * 2 + 1],
    ];

    // Check if point is on the correct side of all three edges
    // Triangles are counter-clockwise, so point should be to the left of each edge
    const d0 = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    const d1 = (cx - bx) * (y - by) - (cy - by) * (x - bx);
    const d2 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);

    return d0 >= 0 && d1 >= 0 && d2 >= 0;
  }

  /**
   * Find which triangle contains a given point
   * Uses cached point->triangles mapping for O(k) lookup where k is vertex degree
   * @returns Triangle index, or throws if point is outside triangulation
   */
  getTriangleAt(point: Point): DelaunayTriangle {
    const nearestPoint = this.delaunay.find(point.x, point.y);
    if (nearestPoint === -1) {
      throw new Error("Point is outside the triangulation");
    }

    const triangle = this._triangles_by_point[nearestPoint].find((triangle) =>
      this.pointInTriangle(point, triangle)
    );

    if (triangle === undefined) {
      throw new Error("Point is outside the triangulation");
    }

    return triangle;
  }

  /**
   * Get neighboring triangles that share an edge with the given triangle
   * @returns Array of 0-3 triangle indices (less than 3 if on convex hull)
   */
  getTriangleNeighbors(triangle: DelaunayTriangle): DelaunayTriangle[] {
    const neighbors: DelaunayTriangle[] = [];
    for (let i = 0; i < 3; i++) {
      const opposite = this.delaunay.halfedges[triangle * 3 + i];
      if (opposite !== -1) {
        neighbors.push(Math.floor(opposite / 3));
      }
    }
    return neighbors;
  }

  getCellAt(point: Point): DelaunayPoint {
    return this.delaunay.find(point.x, point.y);
  }

  getNeighbors(point: DelaunayPoint): DelaunayPoint[] {
    return [...this.voronoi.neighbors(point)];
  }

  getCellCenter(cell: DelaunayPoint): Point {
    return point(
      this.delaunay.points[cell * 2],
      this.delaunay.points[cell * 2 + 1]
    );
  }

  getCellBoundary(point: DelaunayPoint): Polygon {
    return new Polygon(this.voronoi.cellPolygon(point));
  }

  getAllCells() {
    return Array(this.delaunay.points.length / 2).keys();
  }
}

/**
 * DelaunayGrid - Implements BoardGrid using Delaunay triangles
 * Each cell is a triangle in the Delaunay triangulation
 * Dual of the VoronoiGrid
 */
export class DelaunayGrid implements BoardGrid<DelaunayTriangle> {
  constructor(readonly voronoiGrid: VoronoiGrid) {}

  getCellAt(point: Point): DelaunayTriangle {
    return this.voronoiGrid.getTriangleAt(point);
  }

  getNeighbors(cell: DelaunayTriangle): DelaunayTriangle[] {
    return this.voronoiGrid.getTriangleNeighbors(cell);
  }

  /**
   * Get the centroid of a triangle (average of its three vertices)
   */
  getCellCenter(cell: DelaunayTriangle): Point {
    const { triangles, points } = this.voronoiGrid.delaunay;
    const i = cell * 3;

    // Get triangle vertices
    const ax = points[triangles[i] * 2];
    const ay = points[triangles[i] * 2 + 1];
    const bx = points[triangles[i + 1] * 2];
    const by = points[triangles[i + 1] * 2 + 1];
    const cx = points[triangles[i + 2] * 2];
    const cy = points[triangles[i + 2] * 2 + 1];

    // Return centroid
    return point((ax + bx + cx) / 3, (ay + by + cy) / 3);
  }

  /**
   * Get the boundary polygon of a triangle
   */
  getCellBoundary(cell: DelaunayTriangle): Polygon {
    const poly = this.voronoiGrid.delaunay.trianglePolygon(cell);
    return new Polygon(poly);
  }

  getAllCells() {
    return Array(this.voronoiGrid.delaunay.triangles.length / 3).keys();
  }
}

type VoronoiGridParameters = {
  points: Point[];
  bound: Box;
};
export const voronoiGrid = ({ points, bound }: VoronoiGridParameters) =>
  new VoronoiGrid(points, bound);
