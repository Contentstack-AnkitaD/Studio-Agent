---
name: setup-repeater
description: Create a repeater component that iterates over an array data source and renders a template for each item
type: skill
agent: polaris-assist
triggers: ["repeat", "iterate", "list of", "for each", "loop", "dynamic list", "multiple items", "cards from"]
---

# Setup Repeater — Iterate Over Array Data

## When to Use

User wants to display a list of items from CMS data:
- "Show a grid of blog post cards"
- "List all team members"
- "Display product features from the entry"

## Concept

A repeater takes an array data source and renders a child template for each item. Children bind to the **repeater context** (current iteration item).

## Step 1: Create the Repeater Node

```json
{
  "uid": "blog-repeater",
  "type": "repeater",
  "props": {
    "items": {
      "type": "array",
      "staticString": [],
      "binding": {
        "type": "template",
        "value": { "path": { "blog_posts": {} } }
      }
    },
    "children": { "type": "slot", "slot": "rep-slot" }
  },
  "slots": {
    "rep-slot": [
      /* template child goes here */
    ]
  },
  "styles": {}
}
```

## Step 2: Create the Template Child

Children bind via `"type": "repeater"` with the repeater's UID:

```json
{
  "uid": "blog-card",
  "type": "box",
  "props": {
    "children": { "type": "slot", "slot": "card-slot" }
  },
  "slots": {
    "card-slot": [
      {
        "uid": "card-img",
        "type": "image",
        "props": {
          "src": {
            "type": "imageurl",
            "staticString": "",
            "binding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "blog-repeater",
                "path": { "featured_image.url": {} }
              }
            }
          },
          "alt": {
            "type": "string",
            "staticString": "",
            "binding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "blog-repeater",
                "path": { "title": {} }
              }
            }
          }
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
      },
      {
        "uid": "card-title",
        "type": "header",
        "props": {
          "text": {
            "type": "string",
            "staticString": "Post Title",
            "binding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "blog-repeater",
                "path": { "title": {} }
              }
            }
          },
          "Tag": { "type": "choice", "staticString": "h3" }
        },
        "slots": {},
        "styles": {}
      },
      {
        "uid": "card-excerpt",
        "type": "text",
        "props": {
          "text": {
            "type": "string",
            "staticString": "Excerpt...",
            "binding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "blog-repeater",
                "path": { "excerpt": {} }
              }
            }
          }
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
        "default": { "display": "flex", "flexDirection": "column", "gap": "12px" }
      }
    }
  }
}
```

## Step 3: Wrap in Layout

Place the repeater inside an `hstack` for a grid-like layout:

```json
{
  "operation": "add",
  "parentUid": "content-section-uid",
  "index": 0,
  "node": {
    "uid": "posts-cols",
    "type": "hstack",
    "props": {
      "count": { "type": "number", "staticString": 3 },
      "children": { "type": "slot", "slot": "cols-slot" }
    },
    "slots": {
      "cols-slot": [
        {
          "uid": "blog-repeater",
          "type": "repeater",
          "props": {
            "items": {
              "type": "array",
              "staticString": [],
              "binding": {
                "type": "template",
                "value": { "path": { "blog_posts": {} } }
              }
            },
            "children": { "type": "slot", "slot": "rep-slot" }
          },
          "slots": {
            "rep-slot": [
              /* blog card template from step 2 */
            ]
          },
          "styles": {}
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
}
```

## Modular Block Repeaters — CRITICAL

When iterating over **modular blocks** (CMS `blocks` field type), you MUST add `condition-block` nodes inside the repeater — one per block type. See `knowledge/composition/constraints.md` Section 2 for the full JSON structure.

**Why:** Modular blocks can have different schemas per block type. Each type needs its own template wrapped in a condition-block that checks `_content_type_uid`.

```json
{
  "uid": "sections-repeater",
  "type": "repeater",
  "props": {
    "items": {
      "type": "array",
      "staticString": [],
      "binding": { "type": "template", "value": { "path": { "sections": {} } } }
    },
    "children": { "type": "slot", "slot": "rep-slot" }
  },
  "slots": {
    "rep-slot": [
      {
        "uid": "cb-hero",
        "type": "condition-block",
        "metadata": {
          "condition": {
            "type": "modular_block",
            "operator": "eq",
            "value": "hero_section",
            "conditionBinding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "sections-repeater",
                "path": { "_content_type_uid": {} }
              }
            },
            "dataBinding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "sections-repeater",
                "path": { "hero_section": {} }
              }
            }
          }
        },
        "props": {
          "children": { "type": "slot", "slot": "cb-hero-slot" }
        },
        "slots": {
          "cb-hero-slot": [
            {
              "uid": "cb-hero-box",
              "type": "box",
              "props": { "children": { "type": "slot", "slot": "cb-hero-box-slot" } },
              "slots": {
                "cb-hero-box-slot": [
                  {
                    "uid": "hero-h",
                    "type": "header",
                    "props": {
                      "text": {
                        "type": "string",
                        "staticString": "",
                        "binding": {
                          "type": "repeater",
                          "value": {
                            "repeaterUID": "sections-repeater",
                            "path": { "hero_section.heading": {} }
                          }
                        }
                      },
                      "Tag": { "type": "choice", "staticString": "h1" }
                    },
                    "slots": {},
                    "styles": {}
                  }
                ]
              },
              "styles": {}
            }
          ]
        },
        "styles": {}
      }
    ]
  },
  "styles": {}
}
```

**Key rules for condition-blocks:**
- One `condition-block` per block type
- `condition.type` = `"modular_block"`, `condition.operator` = `"eq"`
- `conditionBinding` checks `_content_type_uid` via repeater
- `dataBinding` points to the block type UID via repeater
- **Each condition-block MUST contain a `box` node** inside it
- Child bindings use path prefixed by block type: `"hero_section.heading"`

## Rules

1. **`repeaterUID` must match** — child bindings reference the repeater's UID exactly
2. **Use `staticString`** not `value` for prop values
3. **Slot linkage required** — `props.children.slot` must match the `slots` key
4. **Image fields need `.url`** suffix
5. **Modular blocks → condition-blocks** (see above)
6. **Nested repeaters** need a `box` wrapper with `metadata: { repeaterWrapper: true }`
