import { Config } from "./Config";
import LookupGrid from "./LookupGrid";
import rk4 from "./rk4";
import Vector from "./Vector";

export class StreamlineIntegrator {
  static FORWARD = 1;
  static BACKWARD = 2;
  static DONE = 3;

  declare start: Vector;
  declare grid: LookupGrid;
  declare config: Config;
  declare points: Vector[] & { seedPoint?: Vector };
  declare pos: Vector;
  declare state: number /* StreamlineIntegrator State Enum */;
  declare candidate: Vector | null;
  declare lastCheckedSeed: number;
  declare ownGrid: LookupGrid;

  constructor(start: Vector, grid: LookupGrid, config: Config) {
    this.start = start;
    this.grid = grid;
    this.config = config;

    this.points = [start];
    this.points.seedPoint = this.start;
    this.pos = start;
    this.state = StreamlineIntegrator.FORWARD;
    this.candidate = null;
    this.lastCheckedSeed = -1;
    this.ownGrid = LookupGrid.create(config.boundingBox, config.timeStep * 0.9);
  }

  static create(start: Vector, grid: LookupGrid, config: Config) {
    return new StreamlineIntegrator(start, grid, config);
  }

  getStreamline() {
    return this.points;
  }

  getNextValidSeed() {
    while (this.lastCheckedSeed < this.points.length - 1) {
      this.lastCheckedSeed += 1;

      var p = this.points[this.lastCheckedSeed];
      var v = this.normalizedVectorField(p);
      if (!v) continue;
      // Check one normal. We just set c = p + n, where n is orthogonal to v.
      // Since v is unit vector we can multiply it by scaler (config.dSep) to get to the
      // right point. It is also easy to find normal in 2d: normal to (x, y) is just (-y, x).
      // You can get it by applying 2d rotation matrix.)
      var cx = p.x - v.y * this.config.dSep;
      var cy = p.y + v.x * this.config.dSep;

      if (
        Array.isArray(this.config.seedArray) &&
        this.config.seedArray.length > 0
      ) {
        var seed = this.config.seedArray.shift()!!;
        cx = seed.x;
        cy = seed.y;
      }

      if (
        !this.grid.isOutside(cx, cy) &&
        !this.grid.isTaken(cx, cy, this.checkDSep.bind(this))
      ) {
        // this will let us check the other side. When we get back
        // into this method, the point `cx, cy` will be taken (by construction of another streamline)
        // And we will throw through to the next orthogonal check.
        this.lastCheckedSeed -= 1;
        return new Vector(cx, cy);
      }

      // Check orthogonal coordinates on the other side (o = p - n).
      var ox = p.x + v.y * this.config.dSep;
      var oy = p.y - v.x * this.config.dSep;
      if (
        !this.grid.isOutside(ox, oy) &&
        !this.grid.isTaken(ox, oy, this.checkDSep.bind(this))
      )
        return new Vector(ox, oy);
    }
  }

  checkDTest(distanceToCandidate: number) {
    if (StreamlineIntegrator.isSame(distanceToCandidate, this.config.dTest))
      return false;
    return distanceToCandidate < this.config.dTest;
  }

  checkDSep(distanceToCandidate: number) {
    if (StreamlineIntegrator.isSame(distanceToCandidate, this.config.dSep))
      return false;

    return distanceToCandidate < this.config.dSep;
  }

  next() {
    while (true) {
      this.candidate = null;
      if (this.state === StreamlineIntegrator.FORWARD) {
        var point = this.growForward();
        if (point) {
          this.points.push(point);
          this.ownGrid.occupyCoordinates(point);
          this.pos = point;
          var shouldPause = this.notifyPointAdded(point);
          if (shouldPause) return;
        } else {
          // Reset position to start, and grow backwards:
          if (this.config.forwardOnly) {
            this.state = StreamlineIntegrator.DONE;
          } else {
            this.pos = this.start;
            this.state = StreamlineIntegrator.BACKWARD;
          }
        }
      }
      if (this.state === StreamlineIntegrator.BACKWARD) {
        var point = this.growBackward();
        if (point) {
          this.points.unshift(point);
          this.pos = point;
          this.ownGrid.occupyCoordinates(point);

          var shouldPause = this.notifyPointAdded(point);
          if (shouldPause) return;
        } else {
          this.state = StreamlineIntegrator.DONE;
        }
      }

      if (this.state === StreamlineIntegrator.DONE) {
        this.points.forEach((p) => this.occupyPointInGrid(p));
        return true;
      }
    }
  }

  occupyPointInGrid(p: Vector) {
    this.grid.occupyCoordinates(p);
  }

  growForward() {
    var velocity = rk4(
      this.pos,
      this.config.timeStep,
      this.normalizedVectorField.bind(this)
    );
    if (!velocity) return; // Hit the singularity.

    return this.growByVelocity(this.pos, velocity);
  }

  growBackward() {
    var velocity = rk4(
      this.pos,
      this.config.timeStep,
      this.normalizedVectorField.bind(this)
    );
    if (!velocity) return; // Singularity
    velocity = velocity.mulScalar(-1);

    return this.growByVelocity(this.pos, velocity);
  }

  growByVelocity(pos: Vector, velocity: Vector) {
    this.candidate = pos.add(velocity);
    if (this.grid.isOutside(this.candidate.x, this.candidate.y)) return;
    if (
      this.grid.isTaken(
        this.candidate.x,
        this.candidate.y,
        this.checkDTest.bind(this)
      )
    )
      return;

    // did we hit any of our points?
    if (
      this.ownGrid.isTaken(
        this.candidate.x,
        this.candidate.y,
        this.timeStepCheck.bind(this)
      )
    )
      return;
    // for (var i = 0; i < points.length; ++i) {
    //   if (points[i].distanceTo(candidate) < config.timeStep * 0.9) return;
    // }

    return this.candidate;
  }

  timeStepCheck(distanceToCandidate: number) {
    return distanceToCandidate < this.config.timeStep * 0.9;
  }

  notifyPointAdded(point: Vector) {
    var shouldPause = false;
    if (this.config.onPointAdded) {
      shouldPause = !!this.config.onPointAdded(
        point,
        this.points[
          this.state === StreamlineIntegrator.FORWARD
            ? this.points.length - 2
            : 1
        ],
        this.config
      );
    }

    return shouldPause;
  }

  normalizedVectorField(p: Vector) {
    const vec = this.config.vectorField(p);
    if (!vec) return; // Assume singularity
    if (Number.isNaN(vec.x) || Number.isNaN(vec.y)) return; // Not defined. e.g. Math.log(-1);

    let l = vec.x * vec.x + vec.y * vec.y;

    if (l === 0) return; // the same, singularity
    l = Math.sqrt(l);

    // We need normalized field.
    return new Vector(vec.x / l, vec.y / l);
  }

  static isSame(a: number, b: number) {
    // to avoid floating point error
    return Math.abs(a - b) < 1e-4;
  }
}

export default StreamlineIntegrator;
