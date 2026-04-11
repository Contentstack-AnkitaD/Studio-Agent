# Composable Studio SDK — Architecture & Setup

## What is Composable Studio SDK?

The SDK (`@contentstack/composable-studio-sdk`) connects any web app to Contentstack's visual editor (Studio). It's a monorepo with two core packages:

- **`studio-registry`** — Component, design token, breakpoint, and data binder registries
- **`studio-internal`** — Editor core: Node interface, Path interface, Operations, Transforms

```
┌─────────────────────┐     postMessage      ┌──────────────────────┐
│   Studio Editor     │ ◄──────────────────► │  SDK (iframe)         │
│   (Parent Window)   │                      │  User's Web App       │
│                     │  composition JSON    │  + studio-registry    │
│                     │  operations          │  + studio-internal    │
└─────────────────────┘                      └──────────────────────┘
```

## Package: `studio-registry`

Located at: `packages/studio-registry/src/`

### ComponentRegistry

Class that manages component registration. Key methods:

```typescript
class ComponentRegistry {
  // Registration
  registerComponents(components: RegisterComponentOptionsInput<C>[]): void;
  registerInternalComponent(componentConfigs, options): void;
  registerSymbolComponent(componentsConfigs): void;
  registerLazyComponent(config, loader, registryType): void;

  // Lookup
  getComponents(options?): RegisterComponentSchema<C>[];
  getComponent(name: string): RegisterComponentSchema<C>;
  getComponentByNode(node: Node, suppressError?): RegisterComponentSchema<C>;
  hasComponent(node: Node): boolean;
  getComponentName(node: Node): string;

  // Lazy loading
  loadComponent(componentType: string): Promise<void>;
  loadComponents(componentTypes: string[]): Promise<void>;
  isLazyComponent(componentType: string): boolean;
  isComponentLoaded(componentType: string): boolean;
  getLazyComponentTypes(): string[];
  getAllComponentTypes(): string[];

  // Validation
  validateProp<V>(componentName, propName, value): boolean;

  // Mutation
  updateRegistry(updatedConfig: RegisterComponentSchema<C>[]): void;
  updateComponents(components: Partial<RegisterComponentSchema<C>>[]): void;
  unregisterComponent(node: Node | string): void;
  setConfig(config: Partial<ComponentRegistryOptions>): void;
}
```

### Registry Types

```typescript
// What type of registry a component belongs to
type Registry = "internal" | "user-defined" | "symbols";

// Input format for registering a component
interface RegisterComponentOptionsInput<C> {
  type: string;               // Unique component ID (e.g., "hero-banner")
  component: C;               // React component reference
  title?: string;             // Display name in component panel
  description?: string;       // Description for AI/user
  icon?: string;              // Icon name
  category?: string;          // Grouping category
  props?: Props;              // Prop definitions (see components-registration.md)
  styles?: StyleSections;     // Style section config
}

// Processed schema stored in registry
interface RegisterComponentSchema<C> extends RegisterComponentOptionsInput<C> {
  // Additional processed fields added by registry
}

// Style section configuration
interface StyleSections {
  [sectionName: string]: StyleSectionOptions;
}

interface StyleSectionOptions {
  title?: string;
  categories?: StyleSectionCategoriesOptions;
}
```

### DesignRegistry

```typescript
class DesignRegistry {
  // Design Tokens
  registerDesignTokens(tokens: DesignTokensInput, options?: DesignTokensOptionsInput): void;
  getDesignTokens(): DesignTokens;
  getDesignTokenOptions(): DesignTokensOptions;
  getDesignTokenCssVariables(): CssVariablesToValue;
  getCssVariablesToDesignTokens(): CssVariablesToDesignTokens;
  updateDesignTokens(tokens, cssVariablesToDesignTokens, options): void;
  clearDesignTokens(): void;
  isDesignTokenCssVariable(value: string): value is DesignTokenCssVariable;
  isValueCssVariable(value: string): boolean;

  // Design Classes
  registerClasses<C>(classes: C): DesignClassesNames<C>;
  getClasses(): DesignClasses[];
  getClass(name: string): DesignClasses | undefined;
  hasClass(name: string): boolean;
  updateClasses(classes: DesignClasses[]): void;
}
```

### BreakpointRegistry

```typescript
class BreakpointRegistry {
  registerBreakpoints(breakpoints: BreakpointInput): void;
  getBreakpoints(): Breakpoint[];
  getBreakpoint(id: string): Breakpoint;
  setBreakpoint(breakpoints: Breakpoint[]): void;
  processBreakpoints(breakpoints: BreakpointInput): Breakpoint[];
}
```

## Package: `studio-internal`

Located at: `packages/studio-internal/src/`

### Editor Interface

The Editor is the central object for manipulating compositions. Created via `createEditor()`.

```typescript
// BaseEditor extends Node with mutation methods
interface BaseEditor extends Node {
  // Node mutations
  moveNodes(options): void;
  removeNodes(options): void;
  insertNodes(nodes, options): void;
  setNodes(props, options): void;
  unwrapNodes(options): void;
  wrapNodes(node, options): void;
  liftNodes(options): void;

  // Style mutations
  setResponsiveStyles(styles, options): void;
  unsetResponsiveStyles(keys, options): void;
  setClasses(classes, options): void;
  unsetClasses(classes, options): void;

  // Prop mutations
  setProp(propName, value, options): void;
  unsetProp(propName, options): void;

  // Slot mutations
  insertSlot(slot, options): void;

  // Selection
  setSelection(selection): void;
  setActiveContextPath(path): void;

  // Normalization
  normalizeNode(entry): void;
  normalize(options?: EditorNormalizeOptions): void;
  withoutNormalizing(fn: () => void): void;
  isNormalizing: boolean;
  setNormalizing(value: boolean): void;
  shouldNormalize: boolean;
  getDirtyPaths(): Path[];

  // State
  hasUnsavedChanges: boolean;
  setHasUnSavedChanges(value: boolean): void;

  // Operations
  operations: Operation[];
  apply(operation: Operation): void;
  onChange(): void;

  // UI
  getUI(): Node;   // Returns composition as Node tree

  // Navigation
  node(path): Node;
  nodes(options?): Generator<NodeEntry>;
  pathRef(path, options?): PathRef;
  pathRefs(): Set<PathRef>;
}
```

### Node Interface

Every element in a composition is a Node.

```typescript
interface Node {
  uid: string;
  type: string;
  children?: Node[];       // Ordered child nodes
  attrs?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  props?: NodeProps;
  styles?: NodeStyles;
}

// Node navigation methods (static)
const NodeInterface = {
  ancestors(root, path, options?): Generator<NodeEntry>;
  create(attrs): Node;
  get(root, path): Node;
  parent(root, path): Ancestor;
  common(root, path, another): NodeEntry;
  isNode(value): value is Node;
  isNodeRecursive(value): value is Node;
  getProp(node, propName): NodeProp;
  unsetProp(node, propName): void;
  getResponsiveStyle(node, breakpointId): NodeStyle;
  getClasses(node): string[];
  hasClass(node, className): boolean;
  has(root, path): boolean;
  hasSlot(node, slotName): boolean;
  getSlotDecendants(node, slotName): Node[];
  nodes(root, options?): Generator<NodeEntry>;
};
```

### Node Props System

```typescript
// Union of all possible prop value types
type NodeProp =
  | BindableNodeProp       // Props that can be bound to data sources
  | NodePropWithBindingMap // Props with binding metadata
  | NodePropsWithSlot      // Slot props (contain child nodes)
  | NodePropsForObject     // Object props (nested key-value)
  | NodePropsForArray      // Array props (list of items)
  | NodePropWithUnknownValue; // Unknown/any type

// Binding-capable prop
interface BindableNodeProp {
  type: BindableNodePropType;
  value: string | number | boolean;
  binding?: BindingMap;
}

// Binding map structure
interface BindingMap {
  type: "template" | "contentstack" | "repeater" | "component_props" | "static_value" | "symbol_props" | "contentstack_queries";
  value: {
    path?: Record<string, {}>;
    uid?: string;
    _content_type_uid?: string;
    repeaterUID?: string;
    [key: string]: unknown;
  };
}

// All prop type identifiers
type NodePropType =
  | "string" | "boolean" | "number"        // Bindable primitives
  | "href" | "imageurl" | "datestring"     // Bindable specialized
  | "choice" | "json_rte"                  // Bindable complex
  | "slot" | "object" | "array" | "any";   // Non-bindable structural

type BindableNodePropType = "string" | "boolean" | "number" | "href" | "imageurl" | "datestring" | "choice" | "json_rte";
type StaticValueNodePropType = "slot" | "object" | "array" | "any";
```

### Styles System

```typescript
// Styles are per-breakpoint
interface NodeStyles {
  [breakpointId: string]: NodeStyle;
}

interface NodeStyle {
  // CSS properties organized by section
  size?: Record<string, string>;
  spacing?: Record<string, string>;
  position?: Record<string, string>;
  visibility?: Record<string, string>;
  layout?: Record<string, string>;
  typography?: Record<string, string>;
  background?: Record<string, string>;
  shadow?: Record<string, string>;
  effects?: Record<string, string>;
  border?: Record<string, string>;
  transform?: Record<string, string>;
  overflow?: Record<string, string>;
}
```

### Operations

Operations are the atomic units of change. Every mutation to the composition produces operations.

```typescript
// All operation types
type Operation = NodeOperation | SelectionOperation;

type NodeOperation =
  | InsertNodeOperation
  | MoveNodeOperation
  | RemoveNodeOperation
  | SetNodeOperation
  | SetPropOperation
  | UnsetPropOperation;

type SelectionOperation = SetSelectionOperation | SetActiveContextPathOperation;

interface InsertNodeOperation {
  type: "insert_node";
  path: Path;
  node: Node;
}

interface RemoveNodeOperation {
  type: "remove_node";
  path: Path;
  node: Node;
}

interface MoveNodeOperation {
  type: "move_node";
  path: Path;
  newPath: Path;
}

interface SetNodeOperation {
  type: "set_node";
  path: Path;
  properties: Partial<Node>;
  newProperties: Partial<Node>;
}

interface SetPropOperation {
  type: "set_prop";
  path: Path;
  propName: string;
  properties: NodeProp;
  newProperties: NodeProp;
}

interface UnsetPropOperation {
  type: "unset_prop";
  path: Path;
  propName: string;
  properties: NodeProp;
}

// Operation utilities
const OperationInterface = {
  isNodeOperation(op): boolean;
  isOperation(value): value is Operation;
  isOperationList(value): value is Operation[];
  isSelectionOperation(op): boolean;
  inverse(op: Operation): Operation;  // Returns the inverse operation (for undo)
};
```

### Transforms

Transforms are the high-level mutation API. They produce operations internally.

```typescript
const NodeTransforms = {
  insertNodes(editor, nodes, options?: NodeInsertNodesOptions): void;
  moveNodes(editor, options): void;
  removeNodes(editor, options): void;
  setNodes(editor, props, options): void;
  unwrapNodes(editor, options): void;
  wrapNodes(editor, element, options): void;
  liftNodes(editor, options): void;
  setResponsiveStyles(editor, styles, options): void;
  unsetResponsiveStyles(editor, keys, options): void;
  setClasses(editor, classes, options): void;
  unsetClasses(editor, classes, options): void;
  setProp(editor, propName, value, options): void;
  unsetProp(editor, propName, options): void;
  setSelection(editor, selection): void;
  insertSlot(editor, slot, options): void;
};

interface NodeInsertNodesOptions<T> {
  at?: Path;          // Where to insert
  match?: NodeMatch;  // Match function for target
  mode?: "highest" | "lowest" | "all";
  voids?: boolean;
}

const GeneralTransforms = {
  transform(editor, op?: Operation): void;  // Apply a raw operation
};

// Combined
const Transforms = { ...GeneralTransforms, ...NodeTransforms };
```

### Path

Paths represent positions in the composition tree.

```typescript
// Path is an array: [slotUid, index, slotUid, index, ...]
type Path = (SlotUid | PathIndex)[];
type SlotUid = string;
type PathIndex = number;

// Example: ["children", 0, "content", 2]
// = root → children slot → first child → content slot → third child

const PathInterface = {
  ancestors(path, options?): Path[];
  parent(path): Path;
  common(path, another): Path;
  compare(path, another): -1 | 0 | 1;
  isPath(value): value is Path;
  previous(path): Path;
  equals(path, another): boolean;
  hasPrevious(path): boolean;
  isSibling(path, another): boolean;
  next(path): Path;
  transform(path, operation, options?): Path | null;
  isAncestor(path, another): boolean;
  endsBefore(path, another): boolean;
  levels(path, options?): Path[];
  isBefore(path, another): boolean;
  isAfter(path, another): boolean;
  isDescendant(path, another): boolean;
  relative(path, ancestor): Path;
};
```

## Data Binder Types

```typescript
// Data sources structure received by SDK from Studio
interface StudioSpecData {
  dataSources: DataSources;
}

interface DataSources {
  component_props?: Record<string, unknown>;
  template?: Record<string, unknown>;
  contentstack?: {
    [content_type_uid: string]: {
      [entry_uid: string]: Record<string, unknown>;
    };
  };
  static_value?: {
    [key_id: string]: string;
  };
  contentstack_queries?: Record<string, unknown>;
}

interface DataSourceItem {
  uid: string;
  _content_type_uid: string;
  [field: string]: unknown;
}
```

## Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `CONTENTSTACK_API_KEY` | Stack API key | `bltxxxxxxxx` |
| `CONTENTSTACK_DELIVERY_TOKEN` | CDA token | `csxxxxxxxx` |
| `CONTENTSTACK_ENVIRONMENT` | Environment name | `production` |
| `CONTENTSTACK_REGION` | Region code | `us`, `eu`, `azure-na` |

## URL Query Parameters (iframe)

When running inside Studio, the iframe URL includes:

| Param | Purpose |
|-------|---------|
| `cs_studio=true` | Activates SDK visual editing mode |
| `cs_composition_uid` | UID of composition being edited |
| `cs_preview=true` | Enable preview mode |

## Key Exports

| Export | Package | Purpose |
|--------|---------|---------|
| `createEditor()` | studio-internal | Creates Editor instance |
| `Node` | studio-internal | Node interface + static methods |
| `Path` | studio-internal | Path interface + static methods |
| `Transforms` | studio-internal | High-level mutation API |
| `Operation` | studio-internal | Operation types + utilities |
| `ComponentRegistry` | studio-registry | Component registration |
| `DesignRegistry` | studio-registry | Design token registration |
| `BreakpointRegistry` | studio-registry | Breakpoint registration |
