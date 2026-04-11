# Composition Node Structure (TOON Format)

## Core Structure

Every node in a composition has these fields:

```json
{
  "uid": "any-unique-string",
  "type": "component-type",
  "attrs": {},
  "metadata": {},
  "props": {},
  "slots": {},
  "styles": {}
}
```

- `attrs` and `metadata` are **optional** — the applier adds defaults if missing (`attrs: {}`, `metadata: { visible: true, locked: false }`)
- `props`, `slots`, `styles` should always be present (at minimum as `{}`)
- `uid` and `type` are required

## UID Rules

- Can be **any unique string** — `"hero-section"`, `"btn-1"`, a UUID, etc.
- For **ADD operations**: UIDs are replaced by `nanoid(15)` by the paste worker, so the exact format doesn't matter
- For **MODIFY/REMOVE/MOVE operations**: use the actual UID from the composition (which is a nanoid-15 string)
- NEVER reuse UIDs from existing nodes in the composition

## Slots

Slots are keyed objects. The key in `slots` MUST match the `slot` field in the corresponding prop:

```json
{
  "props": {
    "children": {
      "type": "slot",
      "slot": "my-slot-key"
    }
  },
  "slots": {
    "my-slot-key": [
      { "uid": "child-1", "type": "header", "..." : "..." }
    ]
  }
}
```

- The slot key can be any string — `"children"`, `"my-slot"`, etc.
- The key in `slots` MUST match the `"slot"` field in the prop
- Leaf nodes (header, text, image, button) should have `"slots": {}`
- Multi-slot components (e.g., `card` has `header`, `children`, `footer` slots) have multiple keys

### Multi-Slot Example (Card)
```json
{
  "type": "card",
  "props": {
    "header": { "type": "slot", "slot": "card-header" },
    "children": { "type": "slot", "slot": "card-content" },
    "footer": { "type": "slot", "slot": "card-footer" }
  },
  "slots": {
    "card-header": [ /* header content */ ],
    "card-content": [ /* main content */ ],
    "card-footer": [ /* footer content */ ]
  }
}
```

## Props Format

Use `"staticString"` for the value field (NOT `"value"`):

| Type | Format |
|------|--------|
| String | `{ "type": "string", "staticString": "value" }` |
| Choice | `{ "type": "choice", "staticString": "option" }` |
| Number | `{ "type": "number", "staticString": 42 }` |
| Boolean | `{ "type": "boolean", "staticString": false }` |
| Image URL | `{ "type": "imageurl", "staticString": "https://..." }` |
| Href/Link | `{ "type": "href", "staticString": "https://..." }` |
| Slot | `{ "type": "slot", "slot": "slot-key" }` |
| Array | `{ "type": "array", "staticString": [] }` |
| JSON RTE | `{ "type": "json_rte" }` |

### Bound Props (with CMS data)
```json
{
  "type": "string",
  "staticString": "Fallback text",
  "binding": {
    "type": "template",
    "value": { "path": { "title": {} } }
  }
}
```
The `staticString` serves as fallback when the binding fails to resolve.

## Component Type Quick Reference

| Need | Type | Display Name |
|------|------|-------------|
| Heading (h1-h6) | `header` | Header |
| Body text | `text` | Paragraph |
| Button | `button` | Button |
| Link | `link` | Link |
| Clickable wrapper | `link-container` | Link Container |
| Image | `image` | Image |
| Video | `video` | Video |
| Embed | `embed` | Embed |
| Rich text | `json-rte` | JSON RTE |
| Generic container | `box` | Box |
| Page section | `section` | Section |
| Horizontal columns | `hstack` | Columns |
| Vertical rows | `vstack` | Rows |
| Repeater | `repeater` | Repeater |
| Divider | `separator` | Separator |
| Accordion | `collapsible` | Collapsible |
| HTML tag | `html-element` | HTML Element |

**DO NOT USE:** `paragraph`, `container`, `flex`, `grid`, `columns`, `divider`, `richtext`, `html`, `icon`, `form`, `tabs`, `carousel`, `spacer`

## Styles

Nested format: `styles.<styleGroup>.responsiveStyles.<breakpoint>.<cssProperty>`

```json
{
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": {
          "fontSize": "1.5rem",
          "color": "#333333",
          "padding": "16px"
        },
        "tablet": {
          "padding": "12px"
        },
        "mobile": {
          "fontSize": "1rem",
          "padding": "8px"
        }
      }
    }
  }
}
```

- Style group is typically `"default"`
- Base breakpoint is `"default"` — add `"tablet"`, `"mobile"` for responsive overrides
- Only override what changes per breakpoint
- CSS properties use camelCase: `fontSize`, `backgroundColor`, `flexDirection`, etc.
