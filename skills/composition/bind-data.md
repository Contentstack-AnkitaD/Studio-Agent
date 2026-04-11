---
name: bind-data
description: Bind a component prop to CMS data — template entry, pinned entry, query, or repeater context
type: skill
agent: polaris-assist
triggers: ["bind", "connect", "link data", "cms data", "dynamic", "from entry", "from contentstack"]
---

# Bind Data — Connect Component Props to CMS Content

## When to Use

User wants dynamic content from CMS:
- "Bind the heading to the blog title"
- "Show the author name from the entry"
- "Make the image come from CMS"

## Step 1: Determine the Data Source

| User Says | Binding Type |
|-----------|-------------|
| "from the entry" / "the blog title" | `template` |
| "from this specific entry" | `contentstack` |
| "from query results" | `contentstack_queries` |
| "each item in the list" (inside repeater) | `repeater` |

## Step 2: Build the Binding

**IMPORTANT:** Prop value field is `"staticString"` (the fallback when binding fails to resolve). The `binding` object specifies the data source.

### Template Binding (linked entry)
```json
{
  "operation": "modify",
  "targetUid": "hero-heading-uid",
  "changes": {
    "props": {
      "text": {
        "type": "string",
        "staticString": "Fallback heading",
        "binding": {
          "type": "template",
          "value": {
            "path": { "title": {} }
          }
        }
      },
      "Tag": {
        "type": "choice",
        "staticString": "h1"
      }
    }
  }
}
```

**WARNING: MODIFY replaces the entire `props` object at top level.** Include ALL props of the node (not just the one you're binding), or the other props will be lost.

### Image Binding (Template — MUST use `.url`)
```json
{
  "props": {
    "src": {
      "type": "imageurl",
      "staticString": "",
      "binding": {
        "type": "template",
        "value": {
          "path": { "featured_image.url": {} }
        }
      }
    },
    "alt": {
      "type": "string",
      "staticString": "Hero image",
      "binding": {
        "type": "template",
        "value": {
          "path": { "featured_image.title": {} }
        }
      }
    }
  }
}
```

### Contentstack (Pinned Entry) Binding
```json
{
  "props": {
    "text": {
      "type": "string",
      "staticString": "",
      "binding": {
        "type": "contentstack",
        "value": {
          "uid": "blt1234567890abcdef",
          "_content_type_uid": "author",
          "path": { "name": {} }
        }
      }
    }
  }
}
```

### Repeater Context Binding
```json
{
  "props": {
    "text": {
      "type": "string",
      "staticString": "",
      "binding": {
        "type": "repeater",
        "value": {
          "repeaterUID": "repeater-node-uid",
          "path": { "title": {} }
        }
      }
    }
  }
}
```

### Link Field Binding
```json
{
  "props": {
    "href": {
      "type": "href",
      "staticString": "#",
      "binding": {
        "type": "template",
        "value": {
          "path": { "cta_link.href": {} }
        }
      }
    },
    "label": {
      "type": "string",
      "staticString": "Click here",
      "binding": {
        "type": "template",
        "value": {
          "path": { "cta_link.title": {} }
        }
      }
    }
  }
}
```

## Step 3: Execute

Use `execute_composition_change` with `operation: "modify"`.

## CRITICAL Rules

1. **Image/file fields**: ALWAYS append `.url` to the path — `"featured_image.url"` not `"featured_image"`
2. **Use `staticString`** not `value` for the fallback value
3. **MODIFY replaces top-level keys**: Include ALL props when modifying, not just the bound one
4. **No `entry.` prefix**: Use bare field names — `"title"` not `"entry.title"`
5. **Reference fields**: Just use dot notation — `"author.name"`. The `include[]` is auto-generated
6. **Modular blocks**: Path includes block type — `"sections.hero_section.heading"`

## Type Compatibility

| CMS Field | Compatible Props |
|-----------|-----------------|
| `text` | `string`, `json_rte` |
| `rich_text_editor` | `json_rte`, `string` |
| `number` | `number`, `string` |
| `boolean` | `boolean` |
| `file` + `.url` | `imageurl`, `href`, `string` |
| `link` + `.href` | `href`, `string` |
| `reference` | Resolve via `include[]`, bind sub-fields |
| `blocks` | Use repeater to iterate |
