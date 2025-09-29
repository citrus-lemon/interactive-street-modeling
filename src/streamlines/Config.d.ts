import type Vector from "./Vector";

declare interface Config {
  maxTimePerIteration: number;
  stepsPerIteration: number;
  dTest: number;
  forwardOnly: boolean;
  vectorField: VectorField;
  seedArray: Vector[];
  boundingBox: BoundingBox;
  timeStep: number;
  dSep: number;
  seed: Vector | Vector[];
  onPointAdded?(from: Vector, to: Vector, config: Config): boolean | undefined;
  onStreamlineAdded?(points: Vector[], config: Config);
  random?(): number;
}

declare interface VectorField {
  (point: Vector): Vector | undefined;
}
