import { Box, Point, Polygon } from "@flatten-js/core";

export type Cell = any;

/**
 * BoardGrid Interface - Core abstraction for spatial grid systems
 *
 * A minimal interface for representing various types of game boards and spatial grids,
 * from simple rectangular grids to complex irregular tessellations (Voronoi, hexagonal, etc.).
 */
export interface BoardGrid<CellRef> {
  /*
  any point inside the bound should have a cell
   */

  /**
   * Find the cell containing the given point.
   */
  getCellAt(point: Point): CellRef;

  /**
   * Get all cells adjacent to the given cell.
   */
  getNeighbors(cell: CellRef): CellRef[];

  /**
   * Get the reference point (center/centroid) of a cell.
   */
  getCellCenter(cell: CellRef): Point;

  /**
   * Get the boundary polygon defining the cell's area.
   */
  getCellBoundary(cell: CellRef): Polygon;

  /**
   * Iterate over all cells in the board.
   */
  getAllCells(): Iterable<CellRef>;
}

export interface BoardLayerReader<T, Board extends BoardGrid<Cell>> {
  readonly board: Board;
  get(cell: Cell): T | undefined;
}

/**
 * BoardLayer - A data layer on top of a board structure
 *
 * Associates data of type T with each cell in the board.
 * Can be used to layer different attributes (elevation, moisture, temperature)
 * on the same board structure.
 *
 * Supports lazy initialization - constant default values are not stored
 * until explicitly set, saving memory for sparse data.
 */
export class BoardLayer<T, Board extends BoardGrid<Cell>>
  implements BoardLayerReader<T, Board>
{
  readonly board: Board;
  readonly data: Map<Cell, T>;
  private defaultValue?: T;
  private generator?: (cell: Cell, board: Board) => T;

  constructor(
    board: Board,
    initializer?: T | ((cell: Cell, board: Board) => T)
  ) {
    this.board = board;
    this.data = new Map<Cell, T>();

    if (initializer !== undefined) {
      if (typeof initializer === "function") {
        // Store generator function for computed values
        this.generator = initializer as (cell: Cell, board: Board) => T;
        // Eagerly compute values for function initializers
        this.initializeWithGenerator();
      } else {
        // Store default value for lazy evaluation
        this.defaultValue = initializer;
        // Don't populate map - values will be returned on-demand
      }
    }
  }

  /**
   * Initialize all cells with generator function
   */
  private initializeWithGenerator(): void {
    if (!this.generator) return;
    const cells = this.board.getAllCells();
    if (!cells) return;

    for (const cell of cells) {
      this.data.set(cell, this.generator(cell, this.board));
    }
  }

  get(cell: Cell): T | undefined {
    // Check if value exists in map
    const value = this.data.get(cell);
    if (value !== undefined) {
      return value;
    }

    // Return default value if set (lazy evaluation)
    return this.defaultValue;
  }

  set(cell: Cell, value: T): void {
    this.data.set(cell, value);
  }

  has(cell: Cell): boolean {
    // Has explicit value or has default value
    return this.data.has(cell) || this.defaultValue !== undefined;
  }

  getAtPoint(point: Point): T | undefined {
    const cell = this.board.getCellAt(point);
    return cell !== undefined ? this.get(cell) : undefined;
  }

  /**
   * Fill all cells with a value
   */
  fill(value: T): void {
    // Clear existing data and set new default
    this.data.clear();
    this.defaultValue = value;
    this.generator = undefined;
  }

  /**
   * Apply a transformation to all cell values
   */
  map(fn: (value: T, cell: Cell) => T): void {
    // Transform explicit values
    for (const [cell, value] of this.data.entries()) {
      this.data.set(cell, fn(value, cell));
    }

    // Transform default value if it exists
    if (this.defaultValue !== undefined) {
      // Need to decide: either materialize all cells or transform the default
      // For consistency, we'll materialize cells with default values
      const cells = this.board.getAllCells();
      if (cells) {
        for (const cell of cells) {
          if (!this.data.has(cell)) {
            this.data.set(cell, fn(this.defaultValue, cell));
          }
        }
      }
      // Clear default since all values are now explicit
      this.defaultValue = undefined;
    }
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.data.clear();
    this.defaultValue = undefined;
    this.generator = undefined;
  }

  /**
   * Check if this layer is using lazy default values
   */
  isUsingDefault(): boolean {
    return this.defaultValue !== undefined;
  }

  /**
   * Get the count of cells with data
   */
  size(): number {
    return this.data.size;
  }

  /**
   * Create a new layer with transformed values
   */
  transform<U>(fn: (value: T, cell: Cell) => U): BoardLayer<U, Board> {
    const newLayer = new BoardLayer<U, Board>(this.board);

    // Transform explicit values
    for (const [cell, value] of this.data.entries()) {
      newLayer.set(cell, fn(value, cell));
    }

    // If we have a default value, set it as the new default (transformed)
    if (this.defaultValue !== undefined) {
      // We need to get all cells to transform the default for cells not in the map
      const cells = this.board.getAllCells();
      if (cells) {
        for (const cell of cells) {
          if (!this.data.has(cell)) {
            newLayer.set(cell, fn(this.defaultValue, cell));
          }
        }
      }
    }

    return newLayer;
  }

  /**
   * Iterate over all cell-value pairs
   */
  *entries(): Generator<[Cell, T], void, unknown> {
    for (const entry of this.data.entries()) {
      yield entry;
    }
  }

  /**
   * Get all values as an array
   */
  values(): T[] {
    return Array.from(this.data.values());
  }

  /**
   * Get neighboring values for a cell
   */
  getNeighborValues(cell: Cell): T[] {
    const neighbors = this.board.getNeighbors(cell);
    const values: T[] = [];

    for (const neighbor of neighbors) {
      const value = this.get(neighbor);
      if (value !== undefined) {
        values.push(value);
      }
    }

    return values;
  }
}

type BoardLayerParameters<T, Board extends BoardGrid<Cell>> = {
  board: Board;
  value?: T;
  initializer?: (cell: Cell, board: Board) => T;
};
export const boardLayer = <T, Board extends BoardGrid<Cell>>({
  board,
  value,
  initializer,
}: BoardLayerParameters<T, Board>) =>
  new BoardLayer(board, initializer || value);
