---
name: add-component
description: Generate correct TOON JSON for a component node and add it to the composition via execute_composition_change
type: skill
agent: polaris-assist
triggers: ["add", "insert", "place", "put", "drop"]
---

# Add Component — Generate TOON JSON & Insert

## When to Use

User wants to add a specific component to the composition:
- "Add a button below the heading"
- "Put an image in the hero section"
- "Insert a separator between the two sections"

## Step 1: Identify Target Location

1. Read the current composition tree
2. Find the parent node by UID
3. The applier inserts into the parent's first slot automatically
4. Determine the index (position within siblings)

## Step 2: Node JSON Structure

Every node MUST have this structure:

```json
{
  "uid": "any-string-id",
  "type": "component-type",
  "props": {
    "propName": {
      "type": "prop-type",
      "staticString": "value"
    }
  },
  "slots": {},
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "cssProperty": "value" }
      }
    }
  }
}
```

### Rules
- **UIDs**: Any string works — the paste worker replaces them with `nanoid(15)` on insertion
- **Props**: Use `"staticString"` for the value field, NOT `"value"`
- **Slots**: For container components, `props.children` must reference the slot key: `{ "type": "slot", "slot": "my-slot-key" }` and `slots` must have matching key: `{ "my-slot-key": [...] }`
- **Styles**: Nested format: `styles.default.responsiveStyles.default.{cssProperty}`
- **attrs/metadata**: Optional — the applier adds defaults if missing

## Step 3: Component Templates

### Header
```json
{
  "uid": "h1",
  "type": "header",
  "props": {
    "text": { "type": "string", "staticString": "Heading Text" },
    "Tag": { "type": "choice", "staticString": "h2" }
  },
  "slots": {},
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "fontSize": "2.25rem", "fontWeight": "700" }
      }
    }
  }
}
```
**Props:** `text` (string), `Tag` (choice: h1-h6, capital T)

### Text (Paragraph)
```json
{
  "uid": "p1",
  "type": "text",
  "props": {
    "text": { "type": "string", "staticString": "Your paragraph text here." }
  },
  "slots": {},
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "fontSize": "1rem", "lineHeight": "1.6" }
      }
    }
  }
}
```
**Note:** The type is `"text"`, NOT `"paragraph"`. Display name is "Paragraph" but type string is `text`.

### Button
```json
{
  "uid": "btn1",
  "type": "button",
  "props": {
    "label": { "type": "string", "staticString": "Get Started" },
    "link": { "type": "href", "staticString": "/signup" },
    "openInNewTab": { "type": "boolean", "staticString": false }
  },
  "slots": {},
  "styles": {}
}
```
**Props:** `label` (NOT `text`), `link` (NOT `href`), `openInNewTab`

### Link
```json
{
  "uid": "lnk1",
  "type": "link",
  "props": {
    "href": { "type": "href", "staticString": "https://example.com" },
    "label": { "type": "string", "staticString": "Click here" },
    "openInNewTab": { "type": "boolean", "staticString": false }
  },
  "slots": {},
  "styles": {}
}
```

### Image
```json
{
  "uid": "img1",
  "type": "image",
  "props": {
    "src": { "type": "imageurl", "staticString": "" },
    "alt": { "type": "string", "staticString": "Descriptive alt text" }
  },
  "slots": {},
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "width": "100%", "borderRadius": "8px" }
      }
    }
  }
}
```

### Section (top-level wrapper)
```json
{
  "uid": "sec1",
  "type": "section",
  "props": {
    "children": { "type": "slot", "slot": "sec1-slot" }
  },
  "slots": {
    "sec1-slot": []
  },
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "paddingTop": "64px", "paddingBottom": "64px" }
      }
    }
  }
}
```

### Box (generic container)
```json
{
  "uid": "box1",
  "type": "box",
  "props": {
    "children": { "type": "slot", "slot": "box1-slot" }
  },
  "slots": {
    "box1-slot": []
  },
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "maxWidth": "1200px", "marginLeft": "auto", "marginRight": "auto", "paddingLeft": "24px", "paddingRight": "24px" }
      }
    }
  }
}
```

### Columns (hstack — horizontal layout)
```json
{
  "uid": "cols1",
  "type": "hstack",
  "props": {
    "count": { "type": "number", "staticString": 2 },
    "children": { "type": "slot", "slot": "cols1-slot" }
  },
  "slots": {
    "cols1-slot": [
      {
        "uid": "col-left",
        "type": "box",
        "props": { "children": { "type": "slot", "slot": "col-left-slot" } },
        "slots": { "col-left-slot": [] },
        "styles": { "default": { "classes": [], "responsiveStyles": { "default": { "flex": "1" } } } }
      },
      {
        "uid": "col-right",
        "type": "box",
        "props": { "children": { "type": "slot", "slot": "col-right-slot" } },
        "slots": { "col-right-slot": [] },
        "styles": { "default": { "classes": [], "responsiveStyles": { "default": { "flex": "1" } } } }
      }
    ]
  },
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "display": "flex", "flexDirection": "row", "gap": "24px" }
      }
    }
  }
}
```
**Note:** The type is `"hstack"`, NOT `"flex"` or `"columns"`. Each column is a `box` child.

### Rows (vstack — vertical layout)
```json
{
  "uid": "rows1",
  "type": "vstack",
  "props": {
    "count": { "type": "number", "staticString": 2 },
    "children": { "type": "slot", "slot": "rows1-slot" }
  },
  "slots": {
    "rows1-slot": []
  },
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": { "display": "flex", "flexDirection": "column", "gap": "24px" }
      }
    }
  }
}
```

### Separator (divider)
```json
{
  "uid": "sep1",
  "type": "separator",
  "props": {
    "orientation": { "type": "choice", "staticString": "horizontal" }
  },
  "slots": {},
  "styles": {}
}
```
**Note:** The type is `"separator"`, NOT `"divider"`.

### Card (multi-slot: header, children, footer)
```json
{
  "uid": "card1",
  "type": "card",
  "props": {
    "header": { "type": "slot", "slot": "card1-header" },
    "children": { "type": "slot", "slot": "card1-content" },
    "footer": { "type": "slot", "slot": "card1-footer" }
  },
  "slots": {
    "card1-header": [],
    "card1-content": [],
    "card1-footer": []
  },
  "styles": {}
}
```

### Embed
```json
{
  "uid": "embed1",
  "type": "embed",
  "props": {
    "src": { "type": "href", "staticString": "https://www.youtube.com/watch?v=..." }
  },
  "slots": {},
  "styles": {}
}
```

### JSON RTE (Rich Text)
```json
{
  "uid": "rte1",
  "type": "json-rte",
  "props": {
    "jsonData": { "type": "json_rte" }
  },
  "slots": {},
  "styles": {}
}
```
**Note:** The type is `"json-rte"`, NOT `"richtext"`.

## Step 4: Build the JsonChange

```json
{
  "operation": "add",
  "parentUid": "parent-node-uid",
  "index": 0,
  "node": { /* node JSON from step 3 */ }
}
```

For nested structures, build the full subtree as one ADD operation:

**Example — Section with heading + button:**
```json
{
  "operation": "add",
  "parentUid": "page-root-uid",
  "index": 0,
  "node": {
    "uid": "hero-sec",
    "type": "section",
    "props": {
      "children": { "type": "slot", "slot": "hero-slot" }
    },
    "slots": {
      "hero-slot": [
        {
          "uid": "hero-box",
          "type": "box",
          "props": {
            "children": { "type": "slot", "slot": "hero-box-slot" }
          },
          "slots": {
            "hero-box-slot": [
              {
                "uid": "hero-h1",
                "type": "header",
                "props": {
                  "text": { "type": "string", "staticString": "Welcome" },
                  "Tag": { "type": "choice", "staticString": "h1" }
                },
                "slots": {},
                "styles": {
                  "default": {
                    "classes": [],
                    "responsiveStyles": {
                      "default": { "fontSize": "3rem", "fontWeight": "700", "textAlign": "center" }
                    }
                  }
                }
              },
              {
                "uid": "hero-btn",
                "type": "button",
                "props": {
                  "label": { "type": "string", "staticString": "Get Started" },
                  "link": { "type": "href", "staticString": "/signup" }
                },
                "slots": {},
                "styles": {}
              }
            ]
          },
          "styles": {
            "default": {
              "classes": [],
              "responsiveStyles": {
                "default": {
                  "display": "flex",
                  "flexDirection": "column",
                  "alignItems": "center",
                  "gap": "24px",
                  "padding": "96px 24px",
                  "maxWidth": "1200px",
                  "marginLeft": "auto",
                  "marginRight": "auto"
                }
              }
            }
          }
        }
      ]
    },
    "styles": {}
  }
}
```

## Step 5: Execute

Call `execute_composition_change` with the JsonChange.

## Component Type Quick Reference

| What You Want | Correct Type | WRONG Names (don't use) |
|--------------|-------------|------------------------|
| Paragraph text | `text` | ~~paragraph~~ |
| Generic container | `box` | ~~container, div~~ |
| Horizontal layout | `hstack` | ~~flex, columns, grid~~ |
| Vertical layout | `vstack` | ~~rows, stack~~ |
| Rich text editor | `json-rte` | ~~richtext, rte~~ |
| HTML element | `html-element` | ~~html~~ |
| Divider/separator | `separator` | ~~divider, hr~~ |
| Collapsible/accordion | `collapsible` | ~~accordion~~ |
| Button label prop | `label` | ~~text~~ |
| Button URL prop | `link` | ~~href, url~~ |
| Heading level prop | `Tag` (capital T) | ~~tag, headingTag, level~~ |

## Validation Checklist

- [ ] Component `type` exists in the registry (see quick reference above)
- [ ] All props use `"staticString"` not `"value"`
- [ ] Slot props have `{ "type": "slot", "slot": "matching-key" }`
- [ ] `slots` object keys match slot prop references
- [ ] Styles use nested `default.responsiveStyles.default` format
- [ ] `parentUid` exists in the current composition
- [ ] No duplicate UIDs (though paste worker regenerates them)

## Error Recovery

| Error | Fix |
|-------|-----|
| "Unknown component type" | Check the type quick reference table |
| "Parent not found" | Re-read composition to get current UIDs |
| "Slot not found" | The applier uses the first slot key — ensure parent has slots |
| "Checksum mismatch" | Re-read composition and retry |
