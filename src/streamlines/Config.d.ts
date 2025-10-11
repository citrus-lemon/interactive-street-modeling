import type Vector from "./Vector";

declare interface Config {
  maxTimePerIteration?: number;
  stepsPerIteration?: number;
  dTest: number;
  forwardOnly?: boolean;
  vectorField: VectorField;
  seedArray?: Vector[];
  boundingBox: BoundingBox;
  timeStep: number;
  dSep: number;
  seed?: Vector | Vector[];
  onPointAdded?(from: Vector, to: Vector, config: Config): boolean | undefined;
  onStreamlineAdded?(points: Vector[], config: Config);
  random?(): number;
  seedStreamlinePolicy?: "bfs" | "dfs";
  seedDirection?: "center" | "flow";
  async?: boolean;
}

declare interface VectorField {
  (point: Vector): Vector | undefined;
}
