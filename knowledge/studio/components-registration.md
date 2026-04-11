# Component Registration — Full Prop Type Reference

## Registration API

```typescript
import { ComponentRegistry } from "@contentstack/composable-studio-sdk";

const registry = new ComponentRegistry();

registry.registerComponents([
  {
    type: "hero-banner",        // Unique ID — used in composition JSON
    component: HeroBanner,      // React component
    title: "Hero Banner",       // Display name
    description: "Full-width hero section with heading, image, CTA",
    category: "content",        // Grouping in component panel
    icon: "hero",               // Icon name
    props: { /* see below */ },
    styles: { /* see below */ },
  },
]);
```

## Prop Type Definitions (from SDK source)

All prop types extend `PropBase<T, V>`:

```typescript
interface PropBase<T extends string, V> {
  type: T;
  title?: string;
  description?: string;
  default?: V;
  required?: boolean;
  hidden?: boolean;
  group?: string;
  validator?: PropValidator<V>;
}

type PropValidator<V> = (value: V) => boolean | string;
```

### StringProp

```typescript
interface StringProp extends PropBase<"string", string> {
  type: "string";
  control?: "default" | "large" | "markdown";
  placeholder?: string;
}
```

**Usage:**
```typescript
heading: {
  type: "string",
  title: "Heading",
  default: "Welcome to our site",
  control: "default",       // single-line input
  placeholder: "Enter heading...",
}
```

- `control: "default"` — single-line text input
- `control: "large"` — multi-line textarea
- `control: "markdown"` — markdown editor

### BooleanProp

```typescript
interface BooleanProp extends PropBase<"boolean", boolean> {
  type: "boolean";
}
```

**Usage:**
```typescript
showBorder: {
  type: "boolean",
  title: "Show Border",
  default: false,
}
```

### NumberProp

```typescript
interface NumberProp extends PropBase<"number", number> {
  type: "number";
  control?: "default" | "slider";
  min?: number;
  max?: number;
  step?: number;
}
```

**Usage:**
```typescript
columns: {
  type: "number",
  title: "Columns",
  default: 3,
  min: 1,
  max: 12,
  step: 1,
  control: "slider",
}
```

### ChoiceProp (Enum/Select)

```typescript
interface ChoiceProp extends PropBase<"choice", string | string[]> {
  type: "choice";
  options: Array<{ value: string; label: string }> | string[];
  multiSelect?: boolean;
  control?: "radio" | "dropdown";
}
```

**Usage:**
```typescript
alignment: {
  type: "choice",
  title: "Alignment",
  default: "center",
  control: "dropdown",
  options: [
    { value: "left", label: "Left" },
    { value: "center", label: "Center" },
    { value: "right", label: "Right" },
  ],
}

// Or simple string array:
variant: {
  type: "choice",
  title: "Variant",
  default: "primary",
  options: ["primary", "secondary", "outline", "ghost"],
}
```

### ImageUrlProp

```typescript
interface ImageUrlProp extends PropBase<"imageurl", string> {
  type: "imageurl";
}
```

**Usage:**
```typescript
backgroundImage: {
  type: "imageurl",
  title: "Background Image",
  default: "",
}
```

**CRITICAL:** When binding to CMS image/file fields, the path MUST end with `.url`:
```json
{ "path": { "hero_image.url": {} } }
```

### HrefProp

```typescript
interface HrefProp extends PropBase<"href", string> {
  type: "href";
}
```

**Usage:**
```typescript
ctaUrl: {
  type: "href",
  title: "CTA Link",
  default: "#",
}
```

### DateStringProp

```typescript
interface DateStringProp extends PropBase<"datestring", string> {
  type: "datestring";
  control?: "date" | "datetime";
}
```

### JsonRTEProp (Rich Text)

```typescript
interface JsonRTEProp extends PropBase<"json_rte", any> {
  type: "json_rte";
}
```

**Usage:**
```typescript
body: {
  type: "json_rte",
  title: "Body Content",
  default: null,
}
```

### ArrayProp

```typescript
interface ArrayProp extends PropBase<"array", any[]> {
  type: "array";
  items: PropInput | { type: "any" };
}
```

**Usage:**
```typescript
features: {
  type: "array",
  title: "Features",
  default: [],
  items: {
    type: "object",
    props: {
      icon: { type: "string", default: "star" },
      title: { type: "string", default: "Feature" },
      description: { type: "string", default: "" },
    },
  },
}
```

Arrays are used with **repeaters** — see `composition/repeaters.md`.

### ObjectProp

```typescript
interface ObjectProp extends PropBase<"object", Record<string, unknown>> {
  type: "object";
  props: Props;    // Nested prop definitions
}
```

**Usage:**
```typescript
cta: {
  type: "object",
  title: "Call to Action",
  props: {
    text: { type: "string", default: "Learn More" },
    url: { type: "href", default: "#" },
    variant: { type: "choice", default: "primary", options: ["primary", "secondary"] },
    openInNewTab: { type: "boolean", default: false },
  },
}
```

### SlotProp

```typescript
interface SlotProp extends PropBase<"slot", undefined> {
  type: "slot";
  countProp?: string;        // Prop name that controls item count
  itemFactory?: () => Node;  // Factory for creating new slot items
  itemTemplate?: Node;       // Template for new slot items
}
```

**Usage:**
```typescript
content: {
  type: "slot",
  title: "Content Area",
}
```

Slots define areas where other components can be nested. In the composition JSON, slots appear as named arrays of child nodes.

### AnyProp

```typescript
interface AnyProp extends PropBase<"any", any> {
  type: "any";
}
```

Accepts any value. Used for dynamic/untyped props.

## Union Type

```typescript
type PropInput =
  | StringProp
  | BooleanProp
  | NumberProp
  | ChoiceProp
  | ImageUrlProp
  | HrefProp
  | DateStringProp
  | JsonRTEProp
  | ArrayProp
  | ObjectProp
  | SlotProp
  | AnyProp;

// Props without options (shorthand registration)
type PropsWithNoOptionsRequired = "string" | "boolean" | "number" | "imageurl" | "href" | "datestring" | "json_rte" | "any";

// Full props record
type Props = Record<string, PropInput | PropsWithNoOptionsRequired>;
```

## Binding Types in Registry

```typescript
// Binding path format
interface CSBindingPath {
  [fieldPath: string]: {};
}

// Template binding (linked entry)
interface TemplateBindingValue {
  path: CSBindingPath;
}

// Contentstack binding (pinned entry)
interface ContentstackBindingValue {
  uid: string;                    // Entry UID (starts with "blt")
  _content_type_uid: string;     // Content type UID
  path: CSBindingPath;
}

// Repeater binding (iteration context)
interface RepeaterBindingValue {
  repeaterUID: string;           // UID of parent repeater node
  path: CSBindingPath;
}
```

## Standard Component Schemas (Verified from SDK alpha branch)

**35 registered components** (21 basic + 14 advanced). Source: `studio-react-components/src/componentDefinitions/`

### Basic Components
| Type | Display Name | Props |
|------|-------------|-------|
| `header` | Header | `text` (string, default: "Title"), **`Tag`** (choice: h1-h6, capital T, default: h1) |
| `text` | Paragraph | `text` (string, default: "Your text here") |
| `number` | Number | `number` (number, default: 0) |
| `button` | Button | **`label`** (string, default: "Button"), **`link`** (href), `openInNewTab` (boolean) |
| `link` | Link | `href` (href), `label` (string), `openInNewTab` (boolean) |
| `link-container` | Link Container | `href` (href), `openInNewTab` (boolean), `children` (slot) |
| `image` | Image | `src` (imageurl), `alt` (string) |
| `video` | Video | `src` (string), `posterSrc` (imageurl) |
| `embed` | Embed | `src` (href, default: "https://example.com") |
| `json-rte` | JSON RTE | `jsonData` (json_rte) |
| `collapsible-text` | Collapsible Text | `text` (string, large), `maxLines` (number), `buttonAction` (choice: expand/redirect), `showMoreText`, `showLessText` |
| `plain-text` | Plain Text | `text` (string) |
| `html-element` | HTML Element | `Tag` (string, default: "div"), `properties` (string), `children` (slot) |
| `style-sheet` | Style Sheet | `styles` (string, large) |

### Container Components
| Type | Display Name | Props |
|------|-------------|-------|
| `section` | Section | `children` (slot) |
| `box` | Box | `children` (slot) |
| `hstack` | Columns | `count` (number, 1-12, default: 3), `children` (slot) |
| `vstack` | Rows | `count` (number, 1-12, default: 3), `children` (slot) |
| `repeater` | Repeater | `items` (array), `children` (slot) |
| `condition-block` | Condition Block | `children` (slot) |
| `fragment` | Fragment | `ui` (slot) |

### Advanced Components
| Type | Display Name | Props |
|------|-------------|-------|
| `alert` | Alert | `title` (string), `message` (string), `src` (imageurl), `alt` (string) |
| `avatar` | Avatar | `src` (imageurl), `fallbackText` (string) |
| `badge` | Badge | `text` (string) |
| `bread-crumb` | Breadcrumb | `breadcrumbItems` (array of label+href+isCurrent) |
| `card` | Card | `header` (slot), `children` (slot), `footer` (slot) — **3 named slots** |
| `collapsible` | Collapsible | `header` (string), `content` (string) |
| `drawer` | Drawer | `label` (string), `children` (slot) |
| `hover-card` | Hover Card | `trigger` (slot), `hoverCardContent` (slot) |
| `menubar` | Menu Bar | `menu` (array of label+href+subMenus) |
| `popover` | Popover | `triggerText` (string), `position` (choice: top/bottom/left/right), `children` (slot) |
| `progress` | Progress | `value` (number, 0-100) |
| `separator` | Separator | `orientation` (choice: horizontal/vertical) |
| `skeleton` | Skeleton | (no props) |
| `tooltip` | Tooltip | `text` (string), `children` (slot) |

### System Components (DO NOT add/modify)
| Type | Display Name | Props |
|------|-------------|-------|
| `page` | Page | `children` (slot) — Root element |
| `symbol` | Symbol | `ui` (slot) — Shared component instance |

### Components That DO NOT EXIST (common mistakes)
| Wrong Name | Use Instead |
|-----------|-------------|
| `paragraph` | `text` |
| `container` | `box` |
| `flex` | `hstack` or `vstack` |
| `grid` | `hstack` |
| `columns` | `hstack` |
| `rows` | `vstack` |
| `richtext` | `json-rte` |
| `html` | `html-element` |
| `divider` | `separator` |
| `accordion` | `collapsible` |
| `icon` | Does not exist |
| `form` | Does not exist |
| `tabs` | Does not exist (commented out in SDK) |
| `carousel` | Does not exist (commented out in SDK) |
| `spacer` | Does not exist |

## Style Sections

Style sections control which CSS properties appear in the style panel:

```typescript
const styleSections: StyleSections = {
  size: { title: "Size" },           // width, height, min/max
  spacing: { title: "Spacing" },     // margin, padding
  position: { title: "Position" },   // position, top, left, z-index
  visibility: { title: "Visibility" }, // display, opacity, visibility
  layout: { title: "Layout" },       // flexbox, grid properties
  typography: { title: "Typography" }, // font, text, color
  background: { title: "Background" }, // background-color, image, gradient
  shadow: { title: "Shadow" },       // box-shadow, text-shadow
  effects: { title: "Effects" },     // filter, backdrop-filter
  border: { title: "Border" },       // border, border-radius
  transform: { title: "Transform" }, // transform, transition
  overflow: { title: "Overflow" },   // overflow-x, overflow-y
};
```

## Agent Rules

1. Use exact `type` values from the schema (e.g., `"header"` not `"heading"`, `"paragraph"` not `"text-block"`)
2. Always set all required props with correct types
3. Image props bound to CMS data MUST use `.url` suffix: `"hero_image.url"` not `"hero_image"`
4. Slots are defined as `type: "slot"` — don't confuse with `children` array
5. System components (`page`, `symbol`) cannot be added by the agent
6. Array props are used with repeater components — see `composition/repeaters.md`
7. When creating nodes, generate unique UIDs (use `crypto.randomUUID()` or similar)
