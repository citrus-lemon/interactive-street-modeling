# BoardGrid Architecture

## Core Concept

The **BoardGrid** system provides a minimal, efficient abstraction for spatial grid systems, from simple rectangular grids to complex irregular tessellations like:
- Chess/checkerboard (rectangular grid)
- Civilization VI (hexagonal grid)
- Voronoi diagrams
- Delaunay triangulation

## Design Philosophy

### Key Principles
1. **Cells as References**: Cells are reference types (like string, number), not independent objects
2. **Board-Centric**: All cell properties are derived from the board itself
3. **Memory Efficient**: Supports lazy evaluation and sparse data storage
4. **Type Safe**: Cell references must be stable for use as Map/Set keys

## Core Interface

```typescript
interface BoardGrid<CellRef> {
  readonly bound: Box;

  // Core spatial operations
  getCellAt(point: Point): CellRef;
  getNeighbors(cell: CellRef): CellRef[];

  // Cell properties
  getCellCenter(cell: CellRef): Point;
  getCellBoundary(cell: CellRef): Polygon;

  // Iteration
  getAllCells(): Generator<CellRef, void, unknown>;
}
```

### Cell Reference Requirements

CellRef must be usable as Map/Set keys:
- ✅ **Good**: Primitives (number, string, symbol)
- ✅ **Good**: Cached/interned objects with stable references
- ❌ **Bad**: Arrays like `[x, y]` (creates new reference each time)

## BoardLayer - Data on the Grid

The `BoardLayer` class associates data with cells, supporting multiple data layers on the same board structure:

```typescript
class BoardLayer<T, CellRef, Board extends BoardGrid<CellRef>> {
  readonly board: Board;
  readonly data: Map<CellRef, T>;

  // Lazy initialization for memory efficiency
  constructor(board: Board, initializer?: T | ((cell: CellRef) => T));

  // Core operations
  get(cell: CellRef): T | undefined;
  set(cell: CellRef, value: T): void;
  has(cell: CellRef): boolean;
}
```

### Memory Optimization

BoardLayer supports lazy evaluation for constant values:
- Constant initializers are stored as default values, not in the map
- Only modified cells consume memory
- Massive grids with uniform values use minimal memory

## Implementation Examples

### SquareGrid
A simple rectangular grid implementation:

```typescript
class SquareGrid implements BoardGrid<string> {
  // Uses "row,col" format for stable references
  getCellAt(point: Point): string {
    const col = Math.floor((point.x - origin.x) / cellSize);
    const row = Math.floor((point.y - origin.y) / cellSize);
    return `${row},${col}`;
  }
}
```

### Usage Example

```typescript
// Create a board
const board = new SquareGrid(bounds, cellSize);

// Create data layers with lazy initialization
const elevation = new BoardLayer(board, 0);        // Lazy default
const moisture = new BoardLayer(board, 0.5);       // Lazy default
const temperature = new BoardLayer(board, (cell) => {
  // Computed per cell - eager evaluation
  const center = board.getCellCenter(cell);
  return 20 + Math.sin(center.x / 100) * 5;
});

// Modify specific cells - only these are stored
elevation.set("5,5", 100);
elevation.set("10,10", 200);
```

## Operations & Algorithms

### 1. Mapping
Transform data while preserving board structure:
```typescript
const slopes = elevation.transform((height, cell) => {
  const neighbors = elevation.getNeighborValues(cell);
  return Math.max(...neighbors) - height;
});
```

### 2. Walking/Propagation
Spread values through the grid:
```typescript
// Mountain generation - start from peak, propagate decreasing height
function generateMountain(layer: BoardLayer, peak: CellRef, height: number) {
  const visited = new Set<CellRef>();
  const queue = [{cell: peak, height}];

  while (queue.length > 0) {
    const {cell, height} = queue.shift()!;
    if (visited.has(cell) || height <= 0) continue;

    layer.set(cell, height);
    visited.add(cell);

    for (const neighbor of board.getNeighbors(cell)) {
      queue.push({cell: neighbor, height: height * 0.8});
    }
  }
}
```

### 3. Spatial Queries
Efficient lookups and neighbor operations:
```typescript
// Find cell at click position
const clickedCell = board.getCellAt(mousePoint);

// Get surrounding context
const neighbors = board.getNeighbors(clickedCell);
const neighborValues = elevation.getNeighborValues(clickedCell);
```

## Use Cases

- **Terrain Generation**: Elevation, moisture, temperature layers
- **Game Boards**: Chess, checkers, tactical games
- **Pathfinding**: Navigation meshes with cost layers
- **Simulation**: Cellular automata, fluid dynamics
- **Procedural Generation**: Biomes, cities, dungeons

## Extensibility

The BoardGrid interface is minimal by design. Extensions can add:
- Distance calculations between cells
- Pathfinding algorithms
- Line-of-sight calculations
- Cell validation
- Coordinate transformations

## Performance Characteristics

- **getCellAt**: O(1) for regular grids, O(log n) for irregular with spatial indexing
- **getNeighbors**: O(1) for fixed neighbor counts
- **BoardLayer.get**: O(1) with lazy defaults
- **Memory**: Sparse storage - only modified cells consume memory

## Migration from SpatialMesh

The BoardGrid architecture simplifies the previous SpatialMesh design:
- Cleaner separation between structure (BoardGrid) and data (BoardLayer)
- More efficient memory usage with lazy evaluation
- Simpler interface focused on essential operations
- Better type safety with stable cell references