import { Config } from "./Config";
import LookupGrid from "./LookupGrid";
import StreamlineIntegrator from "./StreamlineIntegrator";
import Vector from "./Vector";

export class Streamlines {
  static STATE_INIT = 0 as const;
  static STATE_STREAMLINE = 1 as const;
  static STATE_PROCESS_QUEUE = 2 as const;
  static STATE_DONE = 3 as const;
  static STATE_SEED_STREAMLINE = 4 as const;

  declare options: Config;
  declare boundingBox: BoundingBox;
  declare grid: LookupGrid;
  declare stepsPerIteration: number;
  declare resolve?: (value: Config | PromiseLike<Config>) => void;
  declare state: 0 | 1 | 2 | 3 | 4;
  declare nextTimeout?: number;
  declare running: boolean;
  declare streamlineIntegrator: StreamlineIntegrator;
  declare disposed: boolean;
  declare finishedStreamlineIntegrators: StreamlineIntegrator[];

  constructor(protoOptions: Config) {
    this.options = Object.create(null);
    if (!protoOptions)
      throw new Error("Configuration is required to compute streamlines");
    if (!protoOptions.boundingBox) {
      console.warn(
        "No bounding box passed to streamline. Creating default one"
      );
      this.options.boundingBox = { left: -5, top: -5, width: 10, height: 10 };
    } else {
      this.options.boundingBox = protoOptions.boundingBox;
    }

    normalizeBoundingBox(this.options.boundingBox);

    this.boundingBox = this.options.boundingBox;
    this.options.vectorField = protoOptions.vectorField;
    this.options.onStreamlineAdded = protoOptions.onStreamlineAdded;
    this.options.onPointAdded = protoOptions.onPointAdded;
    this.options.forwardOnly = protoOptions.forwardOnly;

    if (!protoOptions.seed) {
      this.options.seed = new Vector(
        Math.random() * this.boundingBox.width + this.boundingBox.left,
        Math.random() * this.boundingBox.height + this.boundingBox.top
      );
    } else if (Array.isArray(protoOptions.seed)) {
      var seed = protoOptions.seed.shift()!!;
      this.options.seed = new Vector(seed.x, seed.y);
      this.options.seedArray = protoOptions.seed;
    } else {
      this.options.seed = new Vector(protoOptions.seed.x, protoOptions.seed.y);
    }

    // Separation between streamlines. Naming according to the paper.
    this.options.dSep =
      protoOptions.dSep > 0
        ? protoOptions.dSep
        : 1 / Math.max(this.boundingBox.width, this.boundingBox.height);

    // When should we stop integrating a streamline.
    this.options.dTest =
      protoOptions.dTest > 0 ? protoOptions.dTest : this.options.dSep * 0.5;

    // Lookup grid helps to quickly tell if there are points nearby
    this.grid = LookupGrid.create(this.boundingBox, this.options.dSep);

    // Integration time step.
    this.options.timeStep =
      protoOptions.timeStep > 0 ? protoOptions.timeStep : 0.01;
    this.options.stepsPerIteration =
      (protoOptions.stepsPerIteration ?? 0) > 0
        ? protoOptions.stepsPerIteration
        : 10;
    this.options.maxTimePerIteration =
      (protoOptions.maxTimePerIteration ?? 0) > 0
        ? protoOptions.maxTimePerIteration
        : 1000;

    this.stepsPerIteration = this.options.stepsPerIteration ?? 10;
    this.resolve;
    this.state = Streamlines.STATE_INIT;
    this.finishedStreamlineIntegrators = [];
    this.streamlineIntegrator = StreamlineIntegrator.create(
      this.options.seed,
      this.grid,
      this.options
    );
    this.disposed = false;
    this.running = false;
    this.nextTimeout;
    // It is asynchronous. If this is used in a browser we don't want to freeze the UI thread.
    // On the other hand, if you need this to be sync - we can extend the API. Just let me know.
  }

  getGrid() {
    return this.grid;
  }

  run() {
    if (this.options.async) {
      if (this.running) return;
      this.running = true;
      this.nextTimeout = setTimeout(this.nextStep.bind(this), 0);
      return new Promise(this.assignResolve.bind(this));
    } else {
      this.nextStep();
    }
  }

  assignResolve(pResolve: (value: Config | PromiseLike<Config>) => void) {
    this.resolve = pResolve;
  }

  dispose() {
    this.disposed = true;
    clearTimeout(this.nextTimeout);
  }

  nextStep() {
    if (this.disposed) return;
    var maxTimePerIteration = this.options.maxTimePerIteration ?? 1000;
    var start = window.performance.now();

    for (var i = 0; i < this.stepsPerIteration; ++i) {
      if (this.state === Streamlines.STATE_INIT) this.initProcessing();
      if (this.state === Streamlines.STATE_STREAMLINE)
        this.continueStreamline();
      if (this.state === Streamlines.STATE_PROCESS_QUEUE) this.processQueue();
      if (this.state === Streamlines.STATE_SEED_STREAMLINE)
        this.seedStreamline();
      if (window.performance.now() - start > maxTimePerIteration) break;

      if (this.state === Streamlines.STATE_DONE) {
        this.resolve!!(this.options);
        return;
      }
    }

    this.nextTimeout = setTimeout(this.nextStep.bind(this), 0);
  }

  initProcessing() {
    var streamLineCompleted = this.streamlineIntegrator.next();
    if (streamLineCompleted) {
      this.addStreamLineToQueue();
      this.state = Streamlines.STATE_PROCESS_QUEUE;
    }
  }

  seedStreamline() {
    var currentStreamLine = this.finishedStreamlineIntegrators[0];

    var validCandidate = currentStreamLine.getNextValidSeed();
    if (validCandidate) {
      this.streamlineIntegrator = StreamlineIntegrator.create(
        validCandidate,
        this.grid,
        this.options
      );
      this.state = Streamlines.STATE_STREAMLINE;
    } else {
      this.finishedStreamlineIntegrators.shift();
      this.state = Streamlines.STATE_PROCESS_QUEUE;
    }
  }

  processQueue() {
    if (this.finishedStreamlineIntegrators.length === 0) {
      this.state = Streamlines.STATE_DONE;
    } else {
      this.state = Streamlines.STATE_SEED_STREAMLINE;
    }
  }

  continueStreamline() {
    var isDone = this.streamlineIntegrator.next();
    if (isDone) {
      this.addStreamLineToQueue();
      this.state = Streamlines.STATE_SEED_STREAMLINE;
    }
  }

  addStreamLineToQueue() {
    var streamLinePoints = this.streamlineIntegrator.getStreamline();
    if (streamLinePoints.length > 1) {
      this.finishedStreamlineIntegrators.push(this.streamlineIntegrator);
      if (this.options.onStreamlineAdded)
        this.options.onStreamlineAdded(streamLinePoints, this.options);
    }
  }
}

function normalizeBoundingBox(bbox: BoundingBox) {
  var requiredBoxMessage =
    "Bounding box {left, top, width, height} is required";
  if (!bbox) throw new Error(requiredBoxMessage);

  assertNumber(bbox.left, requiredBoxMessage);
  assertNumber(bbox.top, requiredBoxMessage);
  if (typeof bbox.size === "number") {
    bbox.width = bbox.size;
    bbox.height = bbox.size;
  }
  assertNumber(bbox.width, requiredBoxMessage);
  assertNumber(bbox.height, requiredBoxMessage);

  if (bbox.width <= 0 || bbox.height <= 0)
    throw new Error("Bounding box cannot be empty");
}

function assertNumber(x: any, msg: string) {
  if (typeof x !== "number" || Number.isNaN(x)) throw new Error(msg);
}

export function computeStreamlines(c: Config) {
  return new Streamlines(c);
}

export default computeStreamlines;
