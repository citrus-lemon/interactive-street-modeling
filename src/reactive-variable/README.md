# Reactive Variable System

A lightweight reactive programming system built on RxJS and Lit for creating interactive web applications with minimal boilerplate.

## Overview

The reactive-variable system provides a simple yet powerful way to manage state and automatically update UI components when data changes. Variables automatically track dependencies and propagate changes through your application.

## Core Concepts

### Creating Variables

Use the `variable()` function to create reactive values:

```typescript
// Create variables with initial values
const count = variable(0);
const name = variable("Alice");
const enabled = variable(true);
```

Variables are:
- **Reactive**: Automatically update dependent values when changed
- **Mutable**: Can be read and written via `.value`
- **Transformable**: Create derived values with `.apply()`
- **Cacheable**: Memoize expensive computations with `.cached()`

### Basic Usage

```typescript
import { variable, block } from "./reactive-variable";
import { html, render } from "lit";

// Create a mutable variable
const count = variable(0);

// Create derived variables
const doubled = count.apply((n) => n * 2);
const squared = count.apply((n) => n ** 2);

// Render reactive template
render(
  html`
    <h1>Count: ${count}</h1>
    <p>Doubled: ${doubled}</p>
    <p>Squared: ${squared}</p>
    ${count.input({ label: "Count", min: "0", max: "10" })}
  `,
  document.body
);

// Update the value
count.value = 5; // UI automatically updates
```

## Features

### 1. Reactive Transformations

Transform variables with `.apply()`:

```typescript
const name = variable("alice");
const greeting = name.apply((n) => `Hello, ${n}!`);
const uppercase = name.apply((n) => n.toUpperCase());

// Chain transformations
const formatted = name
  .apply((n) => n.trim())
  .apply((n) => n.toLowerCase())
  .apply((n) => n.charAt(0).toUpperCase() + n.slice(1));
```

### 2. Composite Variables

Combine multiple variables into a single reactive object:

```typescript
const firstName = variable("John");
const lastName = variable("Doe");

const person = block({
  firstName,
  lastName,
  age: 30, // Can mix variables with static values
});

const fullName = person.apply(
  ({ firstName, lastName }) => `${firstName} ${lastName}`
);
```

### 3. Automatic Input Generation

Variables automatically generate appropriate input components:

```typescript
const numberVar = variable(5);
const stringVar = variable("hello");
const boolVar = variable(true);
const dateVar = variable(new Date());

// Auto-detected inputs
numberVar.input({ label: "Number", min: "0", max: "10" }); // Range input
stringVar.input({ label: "Text" }); // Text input
boolVar.input({ label: "Enable" }); // Checkbox
dateVar.input({ label: "Date", type: "date" }); // Date picker
```

### 4. Custom Input Types

Use pre-configured input components or create custom ones:

```typescript
import { Inputs } from "./reactive-variable";

// Pre-configured inputs
const slider = Inputs.slider([0, 100], {
  value: 50,
  label: "Volume",
  step: 5,
  showValue: true,
});

const color = Inputs.color({
  value: "#ff5733",
  label: "Background Color",
});

const choice = Inputs.radio(["Option A", "Option B", "Option C"], {
  value: "Option A",
  label: "Choose one",
});

// Convert existing variable to custom input
const temp = variable(20).useInput("slider", {
  min: 0,
  max: 100,
  label: "Temperature",
});
```

### 5. Selection Inputs

Create dropdown menus with arrays or objects:

```typescript
// Array of options
const algorithm = variable("bfs");
algorithm.input({
  label: "Algorithm",
  selection: ["bfs", "dfs", "dijkstra"],
});

// Object with display names
const theme = variable("light");
theme.input({
  label: "Theme",
  selection: {
    light: "Light Mode",
    dark: "Dark Mode",
    auto: "Auto (System)",
  },
});
```

### 6. Caching Expensive Computations

Cache results until dependencies change:

```typescript
const n = variable(5);

const fibonacci = n
  .apply((n) => {
    console.log("Computing fibonacci...");
    // Expensive recursive computation
    return computeFib(n);
  })
  .cached();

// First access: computes and caches
console.log(fibonacci.value); // "Computing fibonacci..."

// Second access: uses cache
console.log(fibonacci.value); // (no log)

// After n changes: recomputes
n.value = 6; // Cache invalidated
console.log(fibonacci.value); // "Computing fibonacci..."
```

## Mixins

Import mixins to add powerful methods without bloating the core API:

```typescript
import "./reactive-variable/mixins";
```

### Array Mixins

Functional array operations on array variables:

```typescript
const numbers = variable([1, 2, 3, 4, 5]);

const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const sum = numbers.reduce((acc, n) => acc + n, 0);
const length = numbers.length;
const first = numbers.at(0);

// Chaining
const processed = variable([10, 20, 30, 40, 50])
  .map((n) => n / 10)
  .filter((n) => n >= 2);
```

### Object Mixins

Destructure object variables into individual reactive variables:

```typescript
const stats = block({
  min: variable(0),
  max: variable(100),
  avg: variable(50),
}).apply(({ min, max, avg }) => ({
  min,
  max,
  avg,
  range: max - min,
}));

// Destructure into separate variables
const { min, max, avg, range } = stats.destructure();

// Or pick specific properties
const rangeOnly = stats.pick("range");
const { min: minVal, max: maxVal } = stats.picks("min", "max");
```

### Debug Mixins

Inspect variable changes during development:

```typescript
const count = variable(0);

// Log changes to console
count.log("Count changed");

// Tap into the pipeline
count.tap((value) => console.log("Current value:", value));

// Debug with change counter
count.debug(); // Logs: [Debug] Change #1: 0, Change #2: 1, etc.
```

## Advanced Patterns

### Conditional Rendering

```typescript
const showAdvanced = variable(false);

const advancedOptions = showAdvanced.apply((show) =>
  show
    ? html`<div class="advanced">
        <h3>Advanced Options</h3>
        <!-- ... -->
      </div>`
    : html``
);
```

### Dynamic Lists

```typescript
const itemCount = variable(3);

const items = itemCount.apply((count) =>
  Array.from({ length: count }, (_, i) => `Item ${i + 1}`)
);

const itemList = items.apply(
  (items) => html`
    <ul>
      ${items.map((item) => html`<li>${item}</li>`)}
    </ul>
  `
);
```

### Form Validation

```typescript
const email = variable("user@example.com");

const isValid = email.apply((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));

const feedback = isValid.apply((valid) =>
  valid
    ? html`<span style="color: green">✓ Valid</span>`
    : html`<span style="color: red">✗ Invalid</span>`
);
```

### Mathematical Operations

```typescript
const a = variable(10);
const b = variable(20);

const operations = block({ a, b }).apply(({ a, b }) => ({
  sum: a + b,
  difference: a - b,
  product: a * b,
  quotient: b / a,
  average: (a + b) / 2,
}));

const { sum, product, average } = operations.destructure();
```

## API Reference

### Core Functions

```typescript
// Create a reactive variable
function variable<T>(value: T): Variable<T>;

// Combine multiple variables into one
function block<T extends object>(
  args: T
): Variable<{ [K in keyof T]: Unwrap<T[K]> }>;
```

### Variable Methods

```typescript
// Read and write values
myVariable.value          // Get current value
myVariable.value = newVal // Set new value (triggers updates)

// Transform values
myVariable.apply<U>(transformer: (value: T) => U): Variable<U>

// Cache expensive computations
myVariable.cached(): Variable<T>

// Subscribe to changes
myVariable.subscribe(callback: () => void): Variable<T>

// Render as HTML
myVariable.lit(template?: (value: T) => unknown): DocumentFragment
myVariable.view           // Shorthand for .lit()
${myVariable}             // Direct embedding in templates (uses iterator)

// Generate input components
myVariable.input(options?: InputComponentOptions): TemplateResult

// Set custom input type
myVariable.useInput(type: string, options?: any): Variable<T>
```

### Inputs Helper

Pre-configured input components for common use cases:

```typescript
// Range input (number + slider)
Inputs.range([min, max], { value?, step?, label? })

// Slider only
Inputs.slider([min, max], { value?, step?, label?, showValue? })

// Radio/Select dropdown
Inputs.radio([options...], { value?, label? })

// Color picker
Inputs.color({ value?, label? })

// Textarea
Inputs.textarea({ value?, label?, rows?, cols? })

// Button with action
Inputs.button(label, onClick)
```

## Input Options

```typescript
interface InputComponentOptions {
  label?: string;
  selection?: string[] | { [key: string]: string };
  type?: string; // "text", "number", "range", "date", "email", "color", etc.
  style?: string;
  rows?: number; // For textarea
  cols?: number; // For textarea
  min?: string;
  max?: string;
  step?: string;
  placeholder?: string;
  pattern?: string;
  maxLength?: number;
}
```

## Best Practices

### 1. Use Semantic HTML Only

Keep templates simple and focused on structure:

```typescript
// Good
html`
  <h1>Title</h1>
  <p>Count: ${count}</p>
  ${count.input({ label: "Count" })}
`;

// Avoid
html`
  <div style="padding: 20px; background: blue;">
    <div class="fancy-container">
      <h1 style="color: red;">Title</h1>
    </div>
  </div>
`;
```

### 2. Embed Variables Directly

Let the iterator protocol handle rendering:

```typescript
// Good - direct embedding
html`<p>Value: ${myVariable}</p>`;

// Also good - explicit view
html`<p>Value: ${myVariable.view}</p>`;

// Avoid - manual rendering
html`<p>Value: ${myVariable.value}</p>`; // Not reactive!
```

### 3. Cache Expensive Computations

Use `.cached()` for operations that don't need to run on every access:

```typescript
const expensiveResult = data
  .apply((d) => {
    // Heavy computation
    return processLargeDataset(d);
  })
  .cached();
```

### 4. Name Variables Clearly

Variables ARE variables - no need for "Var" suffix:

```typescript
// Good
const count = variable(0);
const doubled = count.apply((n) => n * 2);

// Avoid
const countVar = variable(0);
const doubledVar = countVar.apply((n) => n * 2);
```

### 5. Use Mixins for Advanced Operations

Keep the core clean by importing mixins only when needed:

```typescript
// At the top of your file
import "./reactive-variable/mixins";

// Now you can use array/object/debug methods
const filtered = myArray.filter((x) => x > 0);
const { x, y } = myPoint.destructure();
myVariable.log("Changed");
```

## Examples

See `example.ts` for a comprehensive demonstration of all features.

## Architecture

- **Core**: `core.ts` - Base Variable and InputVariable classes
- **Input**: `input.ts` - Input component generation and registry system
- **Mixins**: `mixins/` - Optional extensions (array, object, debug, cached, composite)
- **Index**: `index.ts` - Main exports with auto-loaded mixins

## License

Part of the interactive-street-modeling project.
