# Reactive Variable Project - Coding Style Guide

This document outlines the coding conventions and best practices for the reactive-variable system.

## Important: Reference Code Directory

**⚠️ DO NOT MODIFY FILES IN `reference-code/`**

The `reference-code/` directory contains code downloaded from external sources for:
- Reading and learning purposes
- Reference implementation examples
- Inspiration for rewrites in other files

**Rules:**
- ✅ Read and analyze reference code
- ✅ Learn from patterns and implementations
- ✅ Rewrite concepts in new files elsewhere in the project
- ❌ Do NOT modify files in `reference-code/`
- ❌ Do NOT refactor or "improve" reference code
- ❌ Do NOT move or delete reference files

If you need to use ideas from reference code, create new files in the appropriate `src/` directories.

## Core Principles

### 1. **Use Semantic HTML Only**

When working with Lit templates, use semantic HTML elements without unnecessary wrapper divs or complex styling structures.

**Good:**
```typescript
render(html`
  <h1>Title</h1>
  <h2>Section</h2>
  <p>Content: ${variable}</p>
`, container);
```

**Bad:**
```typescript
render(html`
  <div class="container">
    <div class="section">
      <div class="title-wrapper">
        <h1>Title</h1>
      </div>
    </div>
  </div>
`, container);
```

- Avoid excessive div nesting
- Use appropriate semantic tags: `<h1>`, `<h2>`, `<p>`, `<label>`, `<section>`, etc.
- Keep HTML structure flat and simple
- Let the reactive variables handle the dynamic behavior

### 2. **Embed Variables Directly into Lit Templates for Automatic Reactivity**

Variables can be embedded directly into Lit templates using `${variable}` syntax. They automatically become reactive through the iterator protocol.

**Pattern:**
```typescript
const count = variable(0);
const doubled = count.apply(n => n * 2);

render(html`
  <p>Count: ${count}</p>
  <p>Doubled: ${doubled}</p>
  ${count.input({ label: "Adjust count" })}
`, container);
```

**Key Points:**
- Use `${variable}` to embed reactive values directly in templates
- No need for `.view` or `[...variable]` in most cases
- Variables automatically re-render their portions of the template when changed
- Derived variables (via `.apply()`) update automatically when dependencies change

### 3. **Cache Expensive Computations**

When a variable transformation involves heavy computation, use `.cached()` to avoid redundant calculations.

**Pattern:**
```typescript
// Without caching - computation runs on every access
const expensiveResult = numberVar.apply(n => {
  // Heavy computation
  return heavyCalculation(n);
});

// With caching - computation runs only when dependencies change
const cachedResult = numberVar.apply(n => {
  // Heavy computation
  return heavyCalculation(n);
}).cached();
```

**When to Cache:**
- Loop iterations or recursive operations
- Large array/object transformations
- Mathematical computations on large datasets
- DOM manipulation or rendering calculations
- Any operation taking >10ms

**When NOT to Cache:**
- Simple operations (arithmetic, string concatenation)
- Single property access
- Operations already fast (<1ms)

## Variable Usage Patterns

### Creating Variables

```typescript
// Input variables (mutable)
const name = variable("John");
const age = variable(25);
const active = variable(true);

// Derived variables (computed from other variables)
const greeting = name.apply(n => `Hello, ${n}!`);
const isAdult = age.apply(a => a >= 18);

// Composite variables (combine multiple variables)
const person = block({
  name: name,
  age: age,
  isAdult: isAdult,
  status: "active" // Can mix with static values
});
```

### Input Components

```typescript
// Automatic input based on type
${numberVar.input({ label: "Count", min: "0", max: "10" })}
${stringVar.input({ label: "Name", placeholder: "Enter name..." })}
${booleanVar.input({ label: "Active" })}

// Selection with options
${algorithmVar.input({
  label: "Algorithm",
  selection: ["bfs", "dfs", "dijkstra"]
})}

// Custom input types
${dateVar.input({ label: "Date", type: "date" })}
${emailVar.input({ label: "Email", type: "email" })}
${textVar.input({ label: "Notes", type: "textarea", rows: 5 })}
```

### Advanced Inputs (Inputs Class)

```typescript
// Range with synchronized number input
const rangeVar = Inputs.range([0, 100], { label: "Value", step: 5 });

// Slider with value display
const sliderVar = Inputs.slider([0, 360], { label: "Angle", showValue: true });

// Color picker
const colorVar = Inputs.color({ label: "Color", value: "#ff0000" });

// Textarea
const notesVar = Inputs.textarea({ label: "Notes", rows: 4 });

// Button with action
const actionVar = Inputs.button("Click", () => doSomething());
```

### Template Integration

```typescript
// Simple embedding
render(html`<p>Value: ${variable}</p>`, container);

// With transformations
render(html`<p>Doubled: ${variable.apply(v => v * 2)}</p>`, container);

// Conditional rendering
const content = showDetails.apply(show =>
  show ? html`<div>Details here</div>` : html``
);

render(html`${content}`, container);

// Dynamic styling
const styledDiv = block({ color: colorVar, rotation: angleVar }).apply(
  ({ color, rotation }) => html`
    <div style="background: ${color}; transform: rotate(${rotation}deg)">
      Content
    </div>
  `
);
```

## Code Organization

### Example File Structure

```typescript
// 1. Imports
import { html, render } from "lit";
import { variable, block, Inputs } from "./reactive-variable";

// 2. Basic variables
const count = variable(0);
const name = variable("User");

// 3. Derived variables
const doubled = count.apply(n => n * 2);

// 4. Composite variables
const data = block({ count, name });

// 5. Cached computations
const expensive = count.apply(n => heavyCalc(n)).cached();

// 6. Custom inputs
const slider = Inputs.slider([0, 100]);

// 7. Render
render(html`
  <h1>App</h1>
  ${count.input()}
  <p>${doubled}</p>
`, document.querySelector("#root"));
```

## Best Practices

1. **Keep templates clean** - Minimal HTML, semantic tags
2. **Direct embedding** - Use `${variable}` for automatic reactivity
3. **Cache wisely** - Use `.cached()` for expensive operations only
4. **Descriptive names** - Name variables by purpose, not type
5. **Composition over nesting** - Use `block()` to combine variables
6. **Type-safe selections** - Use TypeScript union types for dropdown options
7. **Avoid side effects** - Keep `.apply()` transformations pure
8. **Single responsibility** - One variable, one concern

## Common Patterns

### Form with Validation

```typescript
const email = variable("");
const isValid = email.apply(e => /\S+@\S+\.\S+/.test(e));

render(html`
  ${email.input({ label: "Email", type: "email" })}
  <p>Valid: ${isValid}</p>
`, container);
```

### Synchronized Inputs

```typescript
const value = variable(50);

render(html`
  ${value.input({ type: "range", min: "0", max: "100" })}
  ${value.input({ type: "number", min: "0", max: "100" })}
  <p>Value: ${value}</p>
`, container);
```

### Computed Display

```typescript
const items = variable([1, 2, 3]);
const total = items.apply(arr => arr.reduce((a, b) => a + b, 0)).cached();

render(html`
  <p>Total: ${total}</p>
  <ul>${items.apply(arr => arr.map(i => html`<li>${i}</li>`))}</ul>
`, container);
```

---

**Note:** This style guide is based on the patterns established in `src/reactive-variable/example.ts`. When in doubt, refer to that file for concrete examples.
