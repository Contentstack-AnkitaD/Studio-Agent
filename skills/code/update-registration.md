---
name: update-registration
description: Add, modify, or remove props on an existing Studio-registered component
type: skill
agent: polaris-agent
triggers: ["add prop", "change prop", "remove prop", "update component", "modify registration", "add a new field"]
---

# Update Component Registration

## When to Use

- "Add a `subtitle` prop to my HeroBanner"
- "Change the default heading level to h2"
- "Remove the deprecated `color` prop"
- "Make the `image` prop optional"

## Step 1: Find the Registration

```bash
grep -r "registerComponents\|type:\s*['\"]hero" src/ --include="*.ts" --include="*.tsx" -l
```

Read the file to find the component's current registration.

## Step 2: Make the Change

### Add a New Prop

Add the prop to the `props` object in the registration:

```typescript
// BEFORE
props: {
  heading: { type: "string", default: "Welcome" },
}

// AFTER — added subtitle
props: {
  heading: { type: "string", default: "Welcome" },
  subtitle: {
    type: "string",
    title: "Subtitle",
    default: "",
    control: "large",   // multiline textarea
  },
}
```

Then update the React component to accept and render the new prop:

```tsx
// BEFORE
function HeroBanner({ heading }: { heading: string }) {
  return <h1>{heading}</h1>;
}

// AFTER
function HeroBanner({ heading, subtitle }: { heading: string; subtitle?: string }) {
  return (
    <div>
      <h1>{heading}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
```

### Change a Prop's Type or Default

```typescript
// Change heading level default from h1 to h2
Tag: {
  type: "choice",
  title: "Heading Level",
  default: "h2",    // was "h1"
  options: ["h1", "h2", "h3", "h4", "h5", "h6"],
}
```

### Remove a Prop

1. Remove from registration `props` object
2. Remove from the React component's props interface
3. Remove any usage of the prop in JSX
4. **Note:** Existing compositions that use this prop will have orphaned data — it won't crash but the value will be ignored

### Add a Slot (Nestable Area)

```typescript
// BEFORE — no slot
props: {
  heading: { type: "string", default: "" },
}

// AFTER — added content slot
props: {
  heading: { type: "string", default: "" },
  content: { type: "slot", title: "Content Area" },
}
```

Update the component to render the slot:
```tsx
function Card({ heading, content }: { heading: string; content: React.ReactNode }) {
  return (
    <div className="card">
      <h3>{heading}</h3>
      <div>{content}</div>
    </div>
  );
}
```

## Step 3: Verify

```bash
npm run dev
```

1. Open `http://localhost:3000/?cs_studio=true`
2. Select the updated component on canvas
3. Check right panel shows new/changed props
4. Verify the component renders correctly with new defaults

## Prop Type Reference

| TypeScript Prop Type | Studio Registration Type |
|---------------------|------------------------|
| `string` | `"string"` |
| `number` | `"number"` |
| `boolean` | `"boolean"` |
| `string` (image URL) | `"imageurl"` |
| `string` (URL) | `"href"` |
| `"a" \| "b" \| "c"` | `"choice"` with `options` |
| `React.ReactNode` | `"slot"` |
| `object` | `"object"` with nested `props` |
| `array` | `"array"` with `items` |
| `Date \| string` | `"datestring"` |
