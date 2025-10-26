import { Box, point, Point, Polygon } from "@flatten-js/core";
import { BoardGrid } from "./BoardGrid";
import { Delaunay, Voronoi } from "d3";

export type DelaunayPoint = number;
export type DelaunayTriangle = number;

export class VoronoiGrid implements BoardGrid<DelaunayPoint> {
  delaunay: Delaunay<Point>;
  voronoi: Voronoi<Point>;
  readonly delaunayGrid = new DelaunayGrid(this);

  private _triangles_by_point: DelaunayTriangle[][];
  constructor(points: Point[], readonly bound: Box) {
    this.delaunay = Delaunay.from(
      points,
      (p) => p.x,
      (p) => p.y
    );
    this._triangles_by_point = Array(this.delaunay.points.length / 2).fill([]);
    this.delaunay.triangles.forEach((point, e) => {
      const triangleId = Math.floor(e / 3);
      this._triangles_by_point[point].push(triangleId);
    });
    this.voronoi = this.delaunay.voronoi();
  }

  private pointInTriangle(point: Point, triangle: DelaunayTriangle): boolean {
    const { triangles, points } = this.delaunay;
    const { x, y } = point;
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

    const d0 = (bx - ax) * (y - ay) - (by - ay) * (x - ax);
    const d1 = (cx - bx) * (y - by) - (cy - by) * (x - bx);
    const d2 = (ax - cx) * (y - cy) - (ay - cy) * (x - cx);

    return d0 >= 0 && d1 >= 0 && d2 >= 0;
  }

  getTriangleAt(point: Point): DelaunayTriangle {
    return this._triangles_by_point[this.delaunay.find(point.x, point.y)]
      [Symbol.iterator]()
      .find((triangle) => this.pointInTriangle(point, triangle))!;
  }

  getTriangleNeighbors(triangle: DelaunayTriangle): DelaunayTriangle[] {
    throw new Error("Method not implemented.");
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

export class DelaunayGrid implements BoardGrid<DelaunayTriangle> {
  constructor(readonly voronoiGrid: VoronoiGrid) {}
  getCellAt(point: Point): DelaunayTriangle {
    return this.voronoiGrid.getTriangleAt(point);
  }
  getNeighbors(cell: DelaunayTriangle): DelaunayTriangle[] {
    return this.voronoiGrid.getTriangleNeighbors(cell);
  }
  getCellCenter(cell: DelaunayTriangle): Point {
    throw new Error("Method not implemented.");
  }
  getCellBoundary(cell: DelaunayTriangle): Polygon {
    throw new Error("Method not implemented.");
  }
  *getAllCells() {
    throw new Error("Method not implemented.");
  }
}
