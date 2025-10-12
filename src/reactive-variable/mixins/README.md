# Reactive Variable Mixins

Mixins extend the Variable class with additional methods while keeping the core API clean and focused.

## Installation

Import all mixins:
```typescript
import 'reactive-variable/mixins';
```

Or import specific mixins:
```typescript
import 'reactive-variable/mixins/debug';
import 'reactive-variable/mixins/array';
```

## Available Mixins

### Debug Mixin

**Methods:**
- `.log(label?)` - Log value changes to console
- `.tap(fn)` - Execute side effects without changing value
- `.debug()` - Detailed debugging with change counter

**Example:**
```typescript
const count = variable(5)
  .log('counter')
  .tap(v => console.log('Tapped:', v));

const debugged = variable(0).debug();
```

### Array Mixin

**Methods:**
- `.map(fn)` - Transform array elements
- `.filter(predicate)` - Filter array elements
- `.reduce(fn, initial)` - Reduce array to single value
- `.length` - Get array length reactively
- `.at(index)` - Get element at index
- `.find(predicate)` - Find first matching element
- `.some(predicate)` - Test if any element matches
- `.every(predicate)` - Test if all elements match

**Example:**
```typescript
const numbers = variable([1, 2, 3, 4, 5]);

const doubled = numbers.map(n => n * 2);
const evens = numbers.filter(n => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
const len = numbers.length;

// Method chaining
const processed = numbers
  .map(n => n * 2)
  .filter(n => n > 5)
  .log('processed');
```

## Creating Custom Mixins

Create a new file in `src/reactive-variable/mixins/`:

```typescript
// my-mixin.ts
import { Variable } from "../core";

declare module "../core" {
  interface Variable<T> {
    myMethod(): this;
  }
}

Variable.prototype.myMethod = function() {
  // Implementation
  return this;
};
```

Then add it to `mixins/index.ts`:
```typescript
import "./my-mixin";
```

## Design Principles

1. **Opt-in**: Users choose which mixins to import
2. **Method chaining**: All methods return `this` for fluent APIs
3. **Type-safe**: TypeScript module augmentation provides full type safety
4. **Organized**: Each mixin in its own file by feature
5. **No bloat**: Core module stays clean and minimal
