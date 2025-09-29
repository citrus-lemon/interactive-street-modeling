export declare interface VectorFieldBuffer extends Float32Array {
  width?: number;
  height?: number;
}

export declare interface VectorField {
  (x: number, y: number): [number, number] | { x: number; y: number };
}
