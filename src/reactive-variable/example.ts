import { html, render } from "lit";
import { block, Inputs, InputVariable, variable } from ".";
// Import mixins to enable additional methods (log, tap, map, filter, etc.)
import "./mixins";

// ============================================
// 1. BASIC VARIABLES
// ============================================

// Simple input variables (mutable)
const numberVar = variable(5);
const stringVar = variable("Hello");
const booleanVar = variable(true);

// ============================================
// 2. DERIVED/COMPUTED VARIABLES
// ============================================

// Apply transformations to create derived variables
const doubledNumber = numberVar.apply((n) => n * 2);
const uppercaseString = stringVar.apply((s) => s.toUpperCase());
const numberSquared = numberVar.apply((n) => n ** 2);

// Chain multiple transformations
const complexTransform = numberVar
  .apply((n) => n * 10)
  .apply((n) => `Value: ${n}`);

// ============================================
// 3. COMPOSITE VARIABLES (block)
// ============================================

// Combine multiple variables into one object
const compositeVar = block({
  number: numberVar,
  string: stringVar,
  boolean: booleanVar,
  doubled: doubledNumber,
  staticValue: 42, // Can mix variables with static values
});

// Apply transformation to composite
const compositeMessage = compositeVar.apply(
  ({ number, string, doubled }) =>
    `${string} - Number: ${number}, Doubled: ${doubled}`
);

// ============================================
// 4. CACHED VARIABLES
// ============================================

// Expensive computation that should be cached
let computationCount = 0;
const expensiveComputation = numberVar
  .apply((n) => {
    computationCount++;
    console.log(`Expensive computation called ${computationCount} times`);
    // Simulate expensive operation
    return Array.from({ length: n }, (_, i) => i + 1).reduce(
      (sum, val) => sum + val,
      0
    );
  })
  .cached(); // Cache the result until dependencies change

// ============================================
// 5. SELECTION/DROPDOWN INPUTS
// ============================================

// String-based selection
const algorithmVar: InputVariable<"bfs" | "dfs" | "dijkstra"> = variable("bfs");

// Selection with custom display names
const themeVar: InputVariable<"light" | "dark" | "auto"> = variable("light");

// ============================================
// 6. ADVANCED INPUT TYPES
// ============================================

// Date input
const dateVar = variable(new Date());

// Email input
const emailVar = variable("user@example.com");

// Color input
const colorVar = variable("#ff5733");

// Textarea input
const textareaVar = variable("Multi-line\ntext content");

// Array input (JSON)
const arrayVar = variable([1, 2, 3]);

// Object input (JSON)
const objectVar = variable({ name: "John", age: 30 });

// ============================================
// 7. CUSTOM INPUT COMPONENTS (Inputs class)
// ============================================

// Range input with synchronized number input
const rangeVar = Inputs.range([0, 100], {
  label: "Range Value",
  value: 50,
  step: 5,
});

// Slider with label
const sliderVar = Inputs.slider([0, 360], {
  label: "Rotation",
  value: 45,
  step: 15,
  showValue: true,
});

// Radio/select input
const categoryVar = Inputs.radio(["Option A", "Option B", "Option C"], {
  label: "Category",
  value: "Option A",
});

// Color picker
const bgColorVar = Inputs.color({
  label: "Background Color",
  value: "#4a90e2",
});

// Textarea
const notesVar = Inputs.textarea({
  label: "Notes",
  value: "Enter your notes here...",
  rows: 4,
  cols: 50,
});

// Button with action
const counterVar = Inputs.button("Click me!", () => Math.random());

// ============================================
// 8. HTML TEMPLATE VARIABLES
// ============================================

// Create variables that render as HTML templates
const htmlTemplateVar = block({
  name: stringVar,
  count: numberVar,
  active: booleanVar,
}).apply(
  ({ name, count, active }) => html`
    <div style="padding: 10px; background: ${active ? "#e8f5e9" : "#ffebee"}">
      <strong>${name}</strong> has count of <code>${count}</code>
      ${active ? html`<span> ✓ Active</span>` : html`<span> ✗ Inactive</span>`}
    </div>
  `
);

// ============================================
// 9. CONDITIONAL RENDERING
// ============================================

const showAdvanced = variable(false);
const advancedContent = showAdvanced.apply((show) =>
  show
    ? html`<div style="background: #f5f5f5; padding: 10px; margin: 10px 0;">
        <h4>Advanced Options</h4>
        <p>These are advanced configuration options.</p>
      </div>`
    : html``
);

// ============================================
// 10. MATHEMATICAL OPERATIONS
// ============================================

const num1 = variable(10);
const num2 = variable(20);
const mathOperations = block({ a: num1, b: num2 }).apply(({ a, b }) => ({
  sum: a + b,
  difference: a - b,
  product: a * b,
  quotient: b / a,
  average: (a + b) / 2,
}));

// ============================================
// 11. ARRAY/LIST RENDERING
// ============================================

const itemCount = variable(3);
const itemList = itemCount.apply((count) =>
  Array.from({ length: count }, (_, i) => `Item ${i + 1}`)
);

// ============================================
// 12. MIXIN FEATURES
// ============================================

// Debug mixin - log changes to console
variable(0).debug(); // Logs every change with count

// Array mixins - functional array operations
const numbers = variable([1, 2, 3, 4, 5]);
const doubled = numbers.map((n) => n * 2);
const evens = numbers.filter((n) => n % 2 === 0);
const sumFromReduce = numbers.reduce((acc, n) => acc + n, 0);
const arrayLength = numbers.length;

// Chaining mixins together
const processedData = variable([10, 20, 30, 40, 50])
  .tap((arr) => console.log("Original array:", arr))
  .map((n) => n / 10)
  .filter((n) => n >= 2)
  .log("Processed data");

// Object mixin - destructure object into separate variables
const { sum, difference, average } = mathOperations.destructure();

// Or pick specific properties
const product = mathOperations.pick("product");
const { quotient } = mathOperations.picks("quotient");

// ============================================
// 13. REACTIVE COMPONENT INTEGRATION
// ============================================

// Variables can be embedded directly in templates using ${variable}
// The iterator protocol allows this syntax to work seamlessly
const rotationDemo = sliderVar.apply(
  (deg) => html`
    <div
      style="width: 100px; height: 100px; background: ${bgColorVar};
             transform: rotate(${deg}deg); transition: all 0.3s;"
    >
      Rotated
    </div>
  `
);

// ============================================
// RENDER TO DOM
// ============================================

render(
  html`
    <h1>Reactive Variable System - Interactive Demo</h1>
    <p>
      This page demonstrates a lightweight reactive programming system built on
      RxJS and Lit. Try interacting with the inputs below to see how changes
      automatically propagate through the system.
    </p>

    <h2>1. Basic Input Variables</h2>
    <p>
      Input variables are mutable and can be changed by the user. When their
      value changes, all derived values automatically update.
    </p>
    ${numberVar.input({ label: "Number", min: "0", max: "20", step: "1" })}
    <p>Current value: ${numberVar}</p>

    ${stringVar.input({ label: "String", placeholder: "Enter text..." })}
    <p>You entered: "${stringVar}"</p>

    ${booleanVar.input({ label: "Boolean Toggle" })}
    <p>Toggle state: ${booleanVar}</p>

    <h2>2. Derived/Computed Variables</h2>
    <p>
      These values are automatically computed from the inputs above using
      <code>.apply()</code>. They update instantly when dependencies change.
    </p>
    <p>
      Original number: ${numberVar} → Doubled: ${doubledNumber} → Squared:
      ${numberSquared}
    </p>
    <p>Chained transformation: ${complexTransform}</p>
    <p>
      Original text: "${stringVar}" → Uppercase: ${uppercaseString} → Length:
      ${stringVar.apply((s) => s.length)} characters
    </p>

    <h2>3. Composite Variables (block)</h2>
    <p>
      The <code>block()</code> function combines multiple variables into a
      single reactive object. This is useful for managing related state.
    </p>
    <p>${compositeMessage}</p>

    <h2>4. Cached Variables</h2>
    <p>
      Expensive computations should use <code>.cached()</code> to avoid
      redundant calculations. The result is cached until dependencies change.
    </p>
    <p>
      Sum of numbers from 1 to ${numberVar} = ${expensiveComputation}
      <br />
      <em>Open the console to see how many times the computation runs.</em>
    </p>

    <h2>5. Selection Inputs</h2>
    <p>
      Dropdowns can be created with an array of options or an object mapping
      values to display names.
    </p>
    ${algorithmVar.input({
      label: "Algorithm",
      selection: ["bfs", "dfs", "dijkstra"],
    })}
    <p>You selected: <strong>${algorithmVar}</strong></p>

    ${themeVar.input({
      label: "Theme",
      selection: { light: "Light Mode", dark: "Dark Mode", auto: "Auto" },
    })}
    <p>Current theme setting: <strong>${themeVar}</strong></p>

    <h2>6. Advanced Input Types</h2>
    <p>
      The system automatically generates appropriate inputs based on the value
      type, or you can specify a custom type.
    </p>

    <h3>Date Input</h3>
    ${dateVar.input({ label: "Date", type: "date" })}
    <p>Selected date: ${dateVar.apply((d) => d.toLocaleDateString())}</p>

    <h3>Email Input</h3>
    ${emailVar.input({ label: "Email", type: "email" })}
    <p>Email address: ${emailVar}</p>

    <h3>Color Picker</h3>
    ${colorVar.input({ label: "Color", type: "color" })}
    <p>Chosen color: <span style="color: ${colorVar}">${colorVar}</span></p>

    <h3>Textarea</h3>
    ${textareaVar.input({ label: "Textarea", type: "textarea", rows: 3 })}
    <p>Text length: ${textareaVar.apply((t) => t.length)} characters</p>

    <h3>Array (JSON Editor)</h3>
    ${arrayVar.input({ label: "Array (JSON)" })}
    <p>Array contents: ${arrayVar.apply((arr) => JSON.stringify(arr))}</p>

    <h3>Object (JSON Editor)</h3>
    ${objectVar.input({ label: "Object (JSON)" })}
    <p>Object data: ${objectVar.apply((obj) => JSON.stringify(obj))}</p>

    <h2>7. Custom Input Components (Inputs class)</h2>
    <p>
      The <code>Inputs</code> class provides pre-built custom input components
      with enhanced functionality.
    </p>

    <h3>Range Input</h3>
    <p>Combines a number input with a synchronized slider.</p>
    ${rangeVar.input()}
    <p>
      Current value: ${rangeVar} (which is ${rangeVar.apply((v) => v)}% of
      maximum)
    </p>

    <h3>Slider</h3>
    <p>A simple slider with an optional value display.</p>
    ${sliderVar.input()}

    <h3>Radio/Select</h3>
    ${categoryVar.input()}
    <p>Selected category: <strong>${categoryVar}</strong></p>

    <h3>Color Picker with Value Display</h3>
    ${bgColorVar.input()}

    <h3>Textarea Component</h3>
    ${notesVar.input()}
    <p>
      Notes length: ${notesVar.apply((n) => n.length)} characters
      ${notesVar.apply((n) =>
        n.length > 50
          ? html`<strong>(Getting long!)</strong>`
          : html`<em>(You can write more)</em>`
      )}
    </p>

    <h3>Button with Action</h3>
    <p>Buttons can trigger actions and display results reactively.</p>
    ${counterVar.input()}

    <h2>8. HTML Template Variables</h2>
    <p>
      Variables can generate entire HTML templates that update reactively based
      on their dependencies.
    </p>
    ${htmlTemplateVar}

    <h2>9. Conditional Rendering</h2>
    <p>
      Use <code>.apply()</code> to conditionally show or hide content based on
      variable values.
    </p>
    ${showAdvanced.input({ label: "Show Advanced Options" })} ${advancedContent}

    <h2>10. Mathematical Operations</h2>
    <p>
      Complex calculations can be performed reactively. All results update
      instantly when inputs change.
    </p>
    ${num1.input({ label: "Number 1", min: "0", max: "100" })}
    ${num2.input({ label: "Number 2", min: "0", max: "100" })}
    <p>
      <strong>Results:</strong><br />
      ${num1} + ${num2} = ${mathOperations.apply((ops) => ops.sum)}<br />
      ${num1} − ${num2} = ${mathOperations.apply((ops) => ops.difference)}<br />
      ${num1} × ${num2} = ${mathOperations.apply((ops) => ops.product)}<br />
      Average = ${mathOperations.apply((ops) => ops.average)}
    </p>

    <h2>11. Array/List Rendering</h2>
    <p>Dynamically generate lists based on variable values.</p>
    ${itemCount.input({ label: "Item Count", min: "0", max: "10" })}
    ${itemList.apply(
      (items) => html`
        <p>Generated ${items.length} items:</p>
        <ul>
          ${items.map((item) => html`<li>${item}</li>`)}
        </ul>
      `
    )}

    <h2>12. Mixin Features (Optional Extensions)</h2>
    <p>
      Mixins add powerful methods to variables without bloating the core API.
      Import <code>'./mixins'</code> to enable debug and array operations.
    </p>

    <h3>Debug Mixin</h3>
    <p>
      Use <code>.log()</code>, <code>.tap()</code>, and <code>.debug()</code>
      to inspect variable changes. Check the console for output.
    </p>
    ${numbers.input({ label: "Edit Array (JSON)" })}
    <p>Open console to see debug output when array changes.</p>

    <h3>Array Mixin Operations</h3>
    <p>
      Array variables gain functional programming methods like map, filter,
      reduce.
    </p>
    <p>
      Original: ${numbers.apply((arr) => JSON.stringify(arr))}<br />
      Doubled: ${doubled.apply((arr) => JSON.stringify(arr))}<br />
      Evens only: ${evens.apply((arr) => JSON.stringify(arr))}<br />
      Sum: ${sumFromReduce}<br />
      Length: ${arrayLength}
    </p>

    <h3>Method Chaining</h3>
    <p>
      Mixins preserve method chaining for fluent APIs:
      <code>.tap().map().filter().log()</code>
    </p>
    <p>
      Processed data result:
      ${processedData.apply((arr) => JSON.stringify(arr))}
    </p>

    <h3>Object Destructuring</h3>
    <p>
      Use <code>.destructure()</code> to split an object variable into
      individual variables for each property. Perfect for computed object
      results!
    </p>
    <p>
      Instead of accessing properties like
      <code>mathOperations.apply(ops => ops.sum)</code>, destructure once:
    </p>
    <p>
      Sum (destructured): ${sum}<br />
      Difference (destructured): ${difference}<br />
      Average (destructured): ${average}<br />
      Product (picked): ${product}<br />
      Quotient (picked): ${quotient}
    </p>
    <p>
      <em
        >Each property is now a separate reactive Variable that updates
        independently!</em
      >
    </p>

    <h2>13. Reactive Component Integration</h2>
    <p>
      Variables can be directly embedded in templates using
      <code>\${variable}</code> syntax. The iterator protocol enables seamless
      reactive component rendering without extra boilerplate.
    </p>
    <p>
      Try adjusting the rotation angle and background color below to see the div
      update in real-time:
    </p>
    ${sliderVar.input()} ${bgColorVar.input()} ${rotationDemo}

    <h2>14. Combining Multiple Variables</h2>
    <p>
      Multiple reactive variables work together seamlessly. Change any input
      above and watch related values update across the entire page.
    </p>
    <p>
      <strong>Current State Summary:</strong><br />
      Rotation angle: ${sliderVar}°<br />
      Background color: ${bgColorVar}<br />
      Selected theme: ${themeVar}<br />
      Main number: ${numberVar} (doubled: ${doubledNumber}, squared:
      ${numberSquared})<br />
      Text: "${stringVar}" (${stringVar.apply((s) => s.length)} characters)
    </p>
  `,
  document.querySelector("#root") as HTMLElement
);
