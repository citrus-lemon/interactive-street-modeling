/**
 * Reactive Variable Mixins
 *
 * Import this file to enable all mixin methods on Variable instances.
 * Alternatively, import specific mixins to only add the methods you need.
 *
 * @example
 * // Import all mixins
 * import 'reactive-variable/mixins';
 *
 * @example
 * // Import specific mixins
 * import 'reactive-variable/mixins/debug';
 * import 'reactive-variable/mixins/array';
 * import 'reactive-variable/mixins/object';
 * import 'reactive-variable/mixins/cached';
 */

import "./debug";
import "./array";
import "./object";
import "./cached";

// This file automatically registers all mixins when imported
// Each mixin extends Variable.prototype with additional methods
