import { Box, Point, point } from "@flatten-js/core";
import PoissonDiskSampling from "poisson-disk-sampling";

/**
 * Configuration options for Poisson disk sampling
 */
type PoissonPropertyType = {
  /** The bounding box where points will be generated */
  bound: Box;
  /** Custom random number generator function. Defaults to Math.random */
  random?: () => number;
  /** Target number of points to generate. Will calculate appropriate minDistance */
  n?: number;
  /** Average distance between points. Used directly as minDistance */
  distance?: number;
  /** Exact minimum distance between points. Takes highest priority */
  minDistance?: number;
  /** Number of attempts to place each point. Higher values = better distribution but slower */
  tries?: number;
};

/**
 * Generates a set of randomly distributed points using Poisson disk sampling.
 * Points are guaranteed to maintain a minimum distance from each other, creating
 * a natural, non-clustered distribution.
 *
 * @param options - Configuration object with flexible distance parameters
 * @returns Array of Point objects within the specified bounds
 *
 * @example
 * ```typescript
 * // Generate ~100 points in a 200x200 area
 * const points = poisson({
 *   bound: new Box(0, 0, 200, 200),
 *   n: 100
 * });
 *
 * // Use specific minimum distance
 * const points = poisson({
 *   bound: new Box(0, 0, 200, 200),
 *   minDistance: 10
 * });
 *
 * // Use custom random function for reproducible results
 * const points = poisson({
 *   bound: new Box(0, 0, 200, 200),
 *   distance: 15,
 *   random: seedrandom('my-seed')
 * });
 * ```
 */
export function poisson({
  bound,
  random,
  n,
  distance,
  minDistance,
  tries = 30,
}: PoissonPropertyType): Point[] {
  const width = bound.width;
  const height = bound.height;

  // Determine the minimum distance using priority order:
  // 1. Direct minDistance (highest priority)
  // 2. averageDistance
  // 3. Calculate from desired point count (n)
  // 4. Default fallback
  let calculatedMinDistance: number;

  if (minDistance !== undefined) {
    // Direct specification - use as-is
    calculatedMinDistance = minDistance;
  } else if (distance !== undefined) {
    // Use average distance directly as minimum distance
    calculatedMinDistance = distance;
  } else if (n !== undefined) {
    // Calculate minimum distance from desired point count
    // Formula: assume points distributed in circles, solve for radius
    const area = width * height;
    const averageArea = area / n;
    calculatedMinDistance = Math.sqrt(averageArea / Math.PI) * 1.5;
  } else {
    // Default fallback distance
    calculatedMinDistance = 3;
  }

  // Create the Poisson disk sampler with calculated parameters
  const sampling = new PoissonDiskSampling(
    {
      shape: [width, height],
      minDistance: calculatedMinDistance,
      tries: tries,
    },
    random || null
  );

  // Generate points in local coordinate space [0, width] x [0, height]
  const points = sampling.fill();

  // Transform points to the actual bound coordinates and convert to Point objects
  return points.map(([x, y]) => point(x + bound.xmin, y + bound.ymin));
}
