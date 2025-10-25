import * as Plot from "@observablehq/plot";

import { BoardGrid, BoardLayerReader } from "./grids/BoardGrid";
import { polygon } from "@turf/turf";
import { Point } from "@flatten-js/core";

export function plot_board<T, Board extends BoardGrid<unknown>>(
  boardLayer: BoardLayerReader<T, Board>,
  options?: Plot.GeoOptions
): Plot.Geo {
  const board = boardLayer.board;
  const features = [...board.getAllCells()].map((cell) => {
    // Get the Flatten.js Polygon from board
    const boundary = board.getCellBoundary(cell);

    // Convert vertices to coordinate pairs
    const coordinates = boundary.vertices.map((vertex) => [vertex.x, vertex.y]);

    // Ensure the ring is closed (first and last points are the same)
    if (
      coordinates.length > 0 &&
      (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
        coordinates[0][1] !== coordinates[coordinates.length - 1][1])
    ) {
      coordinates.push(coordinates[0]);
    }

    // Create a turf polygon
    return polygon([coordinates], {
      value: boardLayer.get(cell),
    });
  });

  options ||= {
    fill: "value",
    stroke: "white",
  };
  return Plot.geo(features, options);
}

export function point2xyArray(point: Point): [number, number] {
  const { x, y } = point;
  return [x, y];
}
