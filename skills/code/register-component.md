---
name: register-component
description: Convert an existing React component into a Studio-registered component — analyze props, map types, add registration, handle slots
type: skill
agent: polaris-agent
triggers: ["register component", "make this a studio component", "add to studio", "make it reusable", "drag and drop this", "add to component panel"]
---

# Register Component — Make Existing Code a Studio Component

## When to Use

User has an existing React component and wants it available in Studio:
- "Register my HeroBanner component with Studio"
- "I want to be able to drag this component onto the canvas"
- "Make this card component editable in Studio"
- "Add this to the component panel"

## Step 1: Read the Component

Read the component file to understand:
- Props interface/type
- Default values
- Children/slot usage
- Any internal state or side effects

```bash
# Find the component
find src -name "HeroBanner*" -o -name "hero-banner*"
```

Read the file completely. Look for:
```typescript
// The props interface
interface HeroBannerProps {
  heading: string;
  subheading?: string;
  backgroundImage?: string;
  ctaText?: string;
  ctaUrl?: string;
  children?: React.ReactNode;
  variant?: "light" | "dark";
  fullWidth?: boolean;
}
```

## Step 2: Map Props to Studio Types

For each prop in the interface:

```typescript
// Component prop → Studio registration
{
  // string → "string"
  heading: { type: "string", title: "Heading", default: "" },

  // string (optional) → "string" with empty default
  subheading: { type: "string", title: "Subheading", default: "" },

  // string (image URL) → "imageurl"
  backgroundImage: { type: "imageurl", title: "Background Image", default: "" },

  // string (URL) → "href"
  ctaUrl: { type: "href", title: "CTA URL", default: "#" },

  // ReactNode / children → "slot"
  children: { type: "slot", title: "Content" },

  // union string literal → "choice"
  variant: {
    type: "choice",
    title: "Variant",
    default: "light",
    options: [
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" },
    ],
  },

  // boolean → "boolean"
  fullWidth: { type: "boolean", title: "Full Width", default: false },
}
```

### Complete Mapping Table

| TypeScript Type | Studio Prop Type | Notes |
|----------------|-----------------|-------|
| `string` | `"string"` | Default single-line input |
| `string` (multiline content) | `"string"` + `control: "large"` | Textarea |
| `string` (markdown) | `"string"` + `control: "markdown"` | Markdown editor |
| `number` | `"number"` | Add `min`, `max`, `step` if bounded |
| `boolean` | `"boolean"` | Toggle |
| `"a" \| "b" \| "c"` | `"choice"` + `options` | Dropdown or radio |
| `string` (URL) | `"href"` | URL input with validation |
| `string` (image URL) | `"imageurl"` | Image picker |
| `React.ReactNode` | `"slot"` | Nestable area |
| `{ key: value }` | `"object"` + nested `props` | Grouped sub-props |
| `Array<T>` | `"array"` + `items` | For repeaters |
| `Date \| string` (date) | `"datestring"` | Date picker |
| `any` (rich text) | `"json_rte"` | Rich text editor |
| `any` (unknown) | `"any"` | Accepts anything |

## Step 3: Find or Create the Registration File

Check if a registration file already exists:

```bash
# Look for existing component registration
grep -r "registerComponents" src/ --include="*.ts" --include="*.tsx" -l
```

If found, add to it. If not, create one:

```typescript
// src/studio/components.ts
import { registerComponents } from "@contentstack/composable-studio-sdk";
```

## Step 4: Write the Registration

```typescript
// In src/studio/components.ts

import { HeroBanner } from "../components/HeroBanner";

// Add to the registerComponents array:
{
  type: "hero-banner",                    // Unique ID — lowercase, hyphenated
  title: "Hero Banner",                   // Display name in component panel
  description: "Full-width hero section with heading, image, and CTA",
  component: HeroBanner,                  // The actual React component
  category: "content",                    // Panel grouping
  icon: "hero",                           // Icon name
  props: {
    heading: {
      type: "string",
      title: "Heading",
      default: "Welcome to our site",
      placeholder: "Enter heading...",
    },
    subheading: {
      type: "string",
      title: "Subheading",
      default: "",
      control: "large",
    },
    backgroundImage: {
      type: "imageurl",
      title: "Background Image",
      default: "",
    },
    ctaText: {
      type: "string",
      title: "CTA Text",
      default: "Learn More",
    },
    ctaUrl: {
      type: "href",
      title: "CTA URL",
      default: "#",
    },
    variant: {
      type: "choice",
      title: "Variant",
      default: "light",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    fullWidth: {
      type: "boolean",
      title: "Full Width",
      default: false,
    },
  },
}
```

## Step 5: Handle Special Cases

### Component with Children (Slots)

If the component renders `children`:

```tsx
// Component
function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <div className="card-body">{children}</div>
    </div>
  );
}
```

Register with slot:
```typescript
{
  type: "card",
  component: Card,
  props: {
    title: { type: "string", default: "Card Title" },
    children: { type: "slot", title: "Card Content" },
  },
}
```

### Component with Named Slots (Multiple Children Areas)

```tsx
function Layout({ header, sidebar, main }: {
  header: React.ReactNode;
  sidebar: React.ReactNode;
  main: React.ReactNode;
}) {
  return (
    <div>
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{main}</main>
    </div>
  );
}
```

Register with named slots:
```typescript
{
  type: "layout",
  component: Layout,
  props: {
    header: { type: "slot", title: "Header" },
    sidebar: { type: "slot", title: "Sidebar" },
    main: { type: "slot", title: "Main Content" },
  },
}
```

### Component with Array Prop (for Repeaters)

```tsx
function FeatureList({ features }: { features: { icon: string; title: string; desc: string }[] }) {
  return features.map(f => <div key={f.title}>{f.icon} {f.title}: {f.desc}</div>);
}
```

Register with array:
```typescript
{
  type: "feature-list",
  component: FeatureList,
  props: {
    features: {
      type: "array",
      title: "Features",
      default: [],
      items: {
        type: "object",
        props: {
          icon: { type: "string", default: "star" },
          title: { type: "string", default: "Feature" },
          desc: { type: "string", default: "", control: "large" },
        },
      },
    },
  },
}
```

### Component with Complex Object Prop

```tsx
function CTA({ action }: { action: { text: string; url: string; variant: string } }) {
  return <a href={action.url} className={action.variant}>{action.text}</a>;
}
```

Register with object:
```typescript
{
  type: "cta",
  component: CTA,
  props: {
    action: {
      type: "object",
      title: "Action",
      props: {
        text: { type: "string", default: "Click Here" },
        url: { type: "href", default: "#" },
        variant: {
          type: "choice",
          default: "primary",
          options: ["primary", "secondary", "outline"],
        },
      },
    },
  },
}
```

## Step 6: Verify Registration

```bash
npm run dev
```

Open `http://localhost:3000/?cs_studio=true` and check:
- [ ] Component appears in the component panel
- [ ] Can drag it onto the canvas
- [ ] Props show in the right panel
- [ ] Editing props updates the preview
- [ ] Slots accept dropped components (if applicable)
- [ ] Default values render correctly

## Common Mistakes

1. **`type` ID already exists** — Each component needs a unique `type` string
2. **Component not imported** — Registration file must import the actual React component
3. **Missing `default` on props** — Studio needs defaults to render initial state
4. **Wrong prop type name** — `"imageurl"` not `"image"`, `"href"` not `"url"`
5. **Children not as slot** — Use `type: "slot"` not `type: "any"` for nestable areas
6. **Not re-exporting from registration file** — Make sure the registration file is imported in the SDK init
