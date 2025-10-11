declare interface Vector {
  x: number;
  y: number;
}
class Vector {
  x: number;
  y: number;
  constructor(x: number, y: number);
  constructor(point: [number, number]);
  constructor(x_or_arr: number | [number, number], y?: number) {
    if (x_or_arr instanceof Array) {
      this.x = x_or_arr[0];
      this.y = x_or_arr[1];
    } else if (y !== undefined) {
      this.x = x_or_arr;
      this.y = y;
    } else {
      throw new Error("invaild value");
    }
  }
  get 0() {
    return this.x;
  }
  get 1() {
    return this.y;
  }
  equals(other: Vector) {
    return this.x === other.x && this.y === other.y;
  }
  add(other: Vector) {
    return new Vector(this.x + other.x, this.y + other.y);
  }
  mulScalar(scalar: number) {
    return new Vector(this.x * scalar, this.y * scalar);
  }
  length() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  normalize() {
    var l = this.length();
    this.x /= l;
    this.y /= l;
  }
  distanceTo(other: Vector) {
    var dx = other.x - this.x;
    var dy = other.y - this.y;

    return Math.sqrt(dx * dx + dy * dy);
  }
}

export default Vector;
