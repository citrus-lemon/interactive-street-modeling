import Vector from "./Vector";

class Cell {
  declare children: Vector[] | null;
  constructor() {
    this.children = null;
  }
  occupy(point: Vector) {
    if (!this.children) this.children = [];
    this.children.push(point);
  }
  isTaken(
    x: number,
    y: number,
    checkCallback: (distance: number, point: Vector) => boolean
  ) {
    if (!this.children) return false;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
        dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (checkCallback(dist, p)) return true;
    }

    return false;
  }
  getMinDistance(x: number, y: number) {
    let minDistance = Infinity;

    if (!this.children) return minDistance;

    for (var i = 0; i < this.children.length; ++i) {
      var p = this.children[i];
      var dx = p.x - x,
        dy = p.y - y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    return minDistance;
  }
}

export default Cell;
