---
name: unbind-to-static
description: Remove a data binding from a prop and replace it with a hardcoded static value
type: skill
agent: polaris-assist
triggers: ["unbind", "make static", "remove binding", "hardcode", "static value", "stop using cms data", "disconnect from cms", "set fixed value", "remove data connection"]
---

# Unbind to Static — Remove Binding and Set a Fixed Value

## When to Use

User wants to stop pulling a prop value from CMS and use a fixed value instead:
- "Make the heading static — just say 'Welcome'"
- "Remove the binding from the image and hardcode a URL"
- "Stop using CMS data for this button label"
- "I want this text to always say the same thing"

## Concept

A bound prop has a `binding` object that resolves its value from CMS at render time. A static prop has no `binding` — only `staticString` (or the appropriate static field for the type). Unbinding means: remove `binding`, set `staticString` to the desired fixed value.

## Step 1: Understand the Current Bound Prop

Before (bound):
```json
{
  "text": {
    "type": "string",
    "staticString": "Fallback Heading",
    "binding": {
      "type": "template",
      "value": { "path": { "title": {} } }
    }
  }
}
```

## Step 2: Build the Static Replacement

Remove the `binding` key entirely. Set `staticString` to the desired fixed value:

After (static):
```json
{
  "text": {
    "type": "string",
    "staticString": "Welcome to Our Site"
  }
}
```

## Step 3: Apply with MODIFY Operation

Use `modify` on the node. **Include ALL props of the node** — MODIFY replaces the entire `props` object at top level.

```json
{
  "operation": "modify",
  "targetUid": "hero-heading-uid",
  "changes": {
    "props": {
      "text": {
        "type": "string",
        "staticString": "Welcome to Our Site"
      },
      "Tag": {
        "type": "choice",
        "staticString": "h1"
      }
    }
  }
}
```

## Static Field Names by Prop Type

Different prop types use different static field names:

| Prop `type` | Static field | Example |
|-------------|-------------|---------|
| `string` | `staticString` | `"staticString": "Hello"` |
| `number` | `staticString` | `"staticString": 42` |
| `boolean` | `staticString` | `"staticString": true` |
| `choice` | `staticString` | `"staticString": "h2"` |
| `imageurl` | `staticString` | `"staticString": "https://example.com/img.jpg"` |
| `href` | `staticString` | `"staticString": "https://example.com"` |
| `array` | `staticString` | `"staticString": []` |
| `json_rte` | `staticString` | `"staticString": ""` |
| `datestring` | `staticString` | `"staticString": "2025-01-01"` |

All prop types use `staticString` as the static field name. The value type must match the prop type (string value for `string`/`imageurl`/`href`, number for `number`, boolean for `boolean`).

## Step 4: Update dataSources if Needed

If the binding was the only reference to a particular data source entry in the composition, consider cleaning up `dataSources` to remove the now-unused entry. This is optional but keeps the composition tidy:

```json
{
  "operation": "modify",
  "targetUid": "page-root-uid",
  "changes": {
    "dataSources": {
      /* remove or omit the key that was only used by this binding */
    }
  }
}
```

**Only do this if you are certain** no other node references that data source.

## Examples

### Unbind an image to a static URL

Before:
```json
{
  "src": {
    "type": "imageurl",
    "staticString": "",
    "binding": {
      "type": "template",
      "value": { "path": { "featured_image.url": {} } }
    }
  }
}
```

After:
```json
{
  "src": {
    "type": "imageurl",
    "staticString": "https://cdn.example.com/hero-image.jpg"
  }
}
```

### Unbind a boolean toggle to static true

Before:
```json
{
  "isVisible": {
    "type": "boolean",
    "staticString": false,
    "binding": {
      "type": "template",
      "value": { "path": { "show_banner": {} } }
    }
  }
}
```

After:
```json
{
  "isVisible": {
    "type": "boolean",
    "staticString": true
  }
}
```

### Unbind a repeater items array to a static empty list

Before:
```json
{
  "items": {
    "type": "array",
    "staticString": [],
    "binding": {
      "type": "template",
      "value": { "path": { "blog_posts": {} } }
    }
  }
}
```

After:
```json
{
  "items": {
    "type": "array",
    "staticString": []
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Leaving `binding: {}` (empty object) instead of removing it | Delete the `binding` key entirely — an empty binding object may still be processed |
| Only modifying the bound prop without including other props | MODIFY replaces the full `props` object — include ALL existing props of the node |
| Setting `staticString` to the wrong type (e.g., string for a number prop) | Match the value type to the prop's `type` field |
| Removing `binding` but forgetting to set `staticString` | `staticString` must be set — omitting it leaves the prop with no value |
| Confusing `staticString` with `value` | The field is always `staticString`, not `value` or `defaultValue` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Prop still shows CMS data after unbind | The binding was not fully removed — check the saved JSON for leftover `binding` key |
| Prop shows blank after unbind | `staticString` was not set or was set to `""` — provide the actual value |
| Other props disappeared after modify | You only included the unbound prop in `changes.props` — always include ALL props |
| "Type mismatch" in Studio | `staticString` value type does not match the prop `type` — fix the value |
| Can't find the prop in the node JSON | Read the full node JSON first; prop name may differ from the label shown in Studio UI |
