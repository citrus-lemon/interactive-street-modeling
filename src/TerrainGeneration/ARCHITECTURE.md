# Terrain Generation Architecture

## Overview

This document outlines the architecture for a terrain generation playground that combines ideas from three approaches:

1. **Amit's approach**: Dual graph structure (Voronoi/Delaunay), working backwards from constraints, redistribution techniques
2. **mewo's approach**: Physical simulation with erosion, water flow, and sophisticated terrain features
3. **reference/terrain approach**: Simple Voronoi-based height spreading with interactive editing

Our goal is to create a clean, understandable, and configurable playground where each step of terrain generation can be experimented with independently.

## Core Concepts

### Dual Graph Structure (Amit's Insight)

The map representation uses **two interconnected graphs** that are duals of each other:

1. **Delaunay triangulation** (polygon centers):
   - Nodes: Centers of Voronoi polygons (red points)
   - Edges: Connect adjacent polygon centers
   - Use for: Adjacency, pathfinding, region properties

2. **Voronoi diagram** (polygon corners):
   - Nodes: Corners where polygons meet (blue points)
   - Edges: Polygon boundaries
   - Use for: Elevation, rivers, moisture

Every edge in one graph corresponds to exactly one edge in the other. This duality allows us to choose the most appropriate representation for each operation.

### Block (Mesh Unit)

A "block" is the fundamental spatial unit that can refer to either:
- A **Voronoi polygon** (in the Delaunay graph)
- A **Triangle** (formed by polygon corners)

Properties can be stored on either centers or corners depending on what works best.

### Key Operations

1. **Adjacency queries**: "Give me all neighboring blocks"
2. **Spatial queries**: "What block contains point (x,y)?"
3. **Property mapping**: Block ID → Height (and other properties)
4. **Graph traversal**: Moving between dual representations

## Generation Flow

### 1. Point Generation

- **Method**: Poisson disc sampling or random with Lloyd relaxation
- **Lloyd variant (Amit)**: Move points to average of polygon corners (not centroid)
- **Iterations**: 1-2 iterations give good results
- **Configurable**:
  - Number of points
  - Distribution method
  - Relaxation iterations
- **Output**: Set of well-distributed points

### 2. Mesh Generation

Both options available for experimentation:

#### Voronoi Mesh

- Each point becomes the center of a Voronoi cell
- Advantages:
  - Natural irregular shapes (organic look)
  - Each point "owns" a region
  - Good for city/region placement
- Challenges:
  - Irregular number of neighbors (typically 5-7)
  - Complex point-in-polygon tests
  - Need library support (d3-voronoi or similar)

#### Triangular Mesh

- Delaunay triangulation or dual of Voronoi
- Advantages:
  - Fixed 3 neighbors per triangle
  - Simple point-in-triangle tests
  - Natural for slope calculations
  - Better for erosion simulation
- Challenges:
  - More blocks than points (~2x)
  - Less intuitive for region boundaries

### 3. Initial Terrain

#### Amit's "Backwards from Constraints" Approach:
1. **Define coastline first** using shape functions (radial, noise, drawn shapes)
2. **Set elevation as distance from coast** (guarantees no local minima)
3. **Redistribute elevations** to match desired distribution (e.g., more lowlands than mountains)

#### Alternative approaches:
- **Random heights** for prototyping
- **Geometric primitives**: Slopes, cones, blobs
- **Interactive placement** (from reference/terrain)
- **Noise-based** elevation (then define water where elevation < sea level)

### 4. Terrain Modification (Experimentation Zone)

#### From mewo's approach:

- **Erosion simulation**:
  - Water flows downhill
  - Carves valleys based on flow
  - Erosion ∝ water_flux × slope
- **Depression filling**:
  - Planchon-Darboux algorithm
  - Ensures water can flow to map edge
- **Flux-based erosion**:
  - Track water accumulation
  - More water = more erosion

#### From terrain/index.js approach:

- **Height spreading**:
  - Click adds height at point
  - Spreads to neighbors with decay factor
  - Random sharpness for organic feel
- **Simple perturbation**:
  - Add noise to heights
  - Random variation in spreading

#### Ideas to explore:

- **Thermal erosion**: Material slides down steep slopes
- **Tectonic uplift**: Regional lifting/sinking
- **Sediment deposition**: Material fills valleys
- **Weathering**: Heights decay over time

### 5. Feature Detection

#### Water Assignment (Amit's approach):
1. **Assign water/land to corners** based on shape function
2. **Assign to polygons** based on fraction of water corners
3. **Flood fill from edges** to distinguish ocean from lakes

#### Rivers (Amit's approach):
- Start at random mountain corners
- **Flow corner-to-corner** following downslope
- Multiple rivers can merge (accumulate flow)
- River width = sqrt(flow volume)

#### Natural Features:
- **Ocean**: Water connected to map edge
- **Lakes**: Water surrounded by land
- **Beaches**: Land polygons adjacent to ocean
- **Mountains**: Highest elevation areas
- **Valleys**: Created naturally by rivers

#### Human/Political Features

- **City suggestion points**:
  - Near rivers (water source)
  - Not too steep (buildable)
  - Good connectivity to other areas
  - Away from map edges
  - Scoring function combines these factors
- **Region boundaries**:
  - Natural boundaries (ridges, rivers)
  - Distance-based (Voronoi of cities)
  - Cost-based (harder to cross mountains/rivers)
  - Expansion from city centers

### 6. Rendering (Placeholder)

- Height → Color mapping
- Contour lines at height intervals
- Slope shading (hatching style)
- Feature overlays (rivers, cities, borders)
- Label placement

## Data Structure Considerations

### Dual Mesh Structure (Based on Amit's Design)

```typescript
interface Point {
  x: number;
  y: number;
}

interface Edge {
  // Connects two centers (Delaunay edge)
  c0: number;  // center/polygon 0
  c1: number;  // center/polygon 1

  // Connects two corners (Voronoi edge)
  v0: number;  // corner/vertex 0
  v1: number;  // corner/vertex 1
}

interface DualMesh {
  // Polygon centers (Delaunay triangulation)
  centers: Point[];
  centerNeighbors: number[][];  // adjacency lists

  // Polygon corners (Voronoi vertices)
  corners: Point[];
  cornerNeighbors: number[][];  // adjacency lists

  // Edges connect both graphs
  edges: Edge[];

  // Properties - choose appropriate storage
  centerElevation: number[];     // Averaged from corners
  cornerElevation: number[];     // Primary elevation storage
  cornerMoisture: number[];      // Moisture on corners
  centerBiome: string[];         // Biomes on centers
  riverFlow: Map<number, number>; // Edge id → flow volume
}
```

### Property Placement Strategy (Amit's Discoveries)

| Property | Store On | Reason |
|----------|----------|---------|
| Elevation | Corners | Creates natural ridges/valleys |
| Water/Land | Corners first, then centers | Better coastline generation |
| Rivers | Corner-to-corner edges | Smoother, more natural flow |
| Moisture | Corners | Propagates from water features |
| Biomes | Centers | Averaged from corner properties |
| Cities | Centers | Natural for regions |

### Performance Considerations

- **Block count**: mewo uses 16,384 (2^14) points
- **Our target**: Start with 4,096 (2^12) for faster iteration
- **Scaling**: Design to handle up to 65,536 (2^16) blocks
- **Real-time needs**: Interactive editing requires fast updates

## Key Algorithms

### Value Redistribution (Amit's Technique)

Essential for consistent map characteristics:
```typescript
function redistribute(values: number[], mapFunction: (x: number) => number) {
  // 1. Sort values and track original indices
  const sorted = values.map((v, i) => ({value: v, index: i}))
                       .sort((a, b) => a.value - b.value);

  // 2. Assign new values based on position in sorted order
  sorted.forEach((item, i) => {
    const x = i / (sorted.length - 1);  // Normalize to [0,1]
    values[item.index] = mapFunction(x);
  });
}

// Example distributions:
// More lowlands: y = 1 - (1-x)²
// Linear: y = x
// More highlands: y = x²
```

### Spatial Queries

- **Point-in-polygon**: For Voronoi cells
- **Point-in-triangle**: For Delaunay triangles
- **Nearest center/corner**: For finding closest node
- **Graph traversal**: Between dual meshes

### Height Operations

- **Distance from coast**: Primary elevation method (Amit)
- **Corner elevation**: Store on corners
- **Center elevation**: Average of corner elevations
- **Downslope calculation**: Find lowest neighbor
- **Gradient**: Between adjacent corners

### Water Flow

- **Flow direction**: Corner to lowest adjacent corner
- **Flow accumulation**: Sum all upstream flows
- **No depressions**: Guaranteed by distance-from-coast
- **River extraction**: Edges with flow > threshold

### Feature Detection

- **Flood fill**: For identifying regions
- **Contour extraction**: For coastlines
- **Ridge/valley detection**: From slopes
- **Connectivity analysis**: For islands/lakes

## Open Questions

### 1. Height Representation

- Store at block centers, vertices, or both?
- How to interpolate within blocks?
- Fixed precision or floating point?

### 2. Water Flow Model

- Track per block or per edge?
- How to handle flow accumulation efficiently?
- Rainfall distribution (uniform vs variable)?

### 3. Multi-scale Operations

- Some operations work better at different scales
- How to handle level-of-detail?
- Hierarchical representations?

### 4. Reactive Integration

- Which parameters should be reactive?
- How to handle expensive recomputation?
- Caching strategies for intermediate results?

### 5. Mesh Choice

Based on Amit's experience:
- **Recommend: Voronoi with dual Delaunay** structure
- Store different properties on appropriate graph
- Corner graph better for continuous values (elevation, moisture)
- Center graph better for discrete regions (biomes, territories)

## Algorithm Comparison

| Aspect | Amit's Approach | mewo's Approach | Our Hybrid |
|--------|-----------------|-----------------|------------|
| **Mesh** | Dual Voronoi/Delaunay | Triangular (dual) | Start with dual Voronoi |
| **Elevation** | Distance from coast | Primitives + erosion | Both options |
| **Rivers** | Corner-to-corner | Physical simulation | Corner-based |
| **Philosophy** | Work backwards from goals | Physical simulation | Configurable |
| **Complexity** | Medium | High | Adjustable |

## Implementation Priority

Based on the analysis:

1. **Implement dual mesh structure** (Voronoi + Delaunay)
2. **Use Amit's property placement** (corners vs centers)
3. **Start with "backwards" generation** (coastline → elevation)
4. **Add redistribution** for all continuous values
5. **Implement corner-to-corner rivers**
6. **Later: Add erosion** as optional modification

## Next Steps

1. **Implement dual mesh data structure** with proper graph representation
2. **Create point generation** with Lloyd relaxation variant
3. **Build coastline → elevation pipeline** (Amit's approach)
4. **Add redistribution algorithm** for value normalization
5. **Implement river generation** on corner graph
6. **Create reactive playground** with parameter controls
7. **Add erosion/modification** algorithms as experiments

## References

- [Amit's polygon map generation](http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/)
- [Amit's x1721 Voronoi alternative](https://www.redblobgames.com/x/1721-voronoi-alternative/)
- [mewo's terrain generation](https://web.archive.org/web/20180728080132/https://mewo2.com/notes/terrain/)
- [Planchon-Darboux algorithm](https://horizon.documentation.ird.fr/exl-doc/pleins_textes/divers20-05/010031925.pdf)
- [Delaunator library](https://mapbox.github.io/delaunator/)
