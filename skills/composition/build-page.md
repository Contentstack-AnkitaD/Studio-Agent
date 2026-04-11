---
name: build-page
description: Scaffold a complete page composition from a description — combines plan-layout, add-component, bind-data, and modify-styles into one end-to-end flow
type: skill
agent: polaris-assist
triggers: ["build a page", "create a page", "make a landing page", "full page", "scaffold"]
---

# Build Page — End-to-End Page Composition

## When to Use

User asks for a complete page:
- "Build me a landing page for our product"
- "Create a blog post template"
- "Make a pricing page"

This skill orchestrates: `plan-layout` → `add-component` → `bind-data` → `modify-styles`

## Step 1: Plan Sections (use `plan-layout` skill)

Break the page into sections. Each section is `section` → `box` → content.

## Step 2: Build the Full Tree

**Use correct format:** `staticString` for values, slot linkage in props, nested `responsiveStyles` for styles.

**Example — Product Landing Page (hero + features):**

```json
{
  "changes": [
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
                    "uid": "hero-cols",
                    "type": "hstack",
                    "props": {
                      "count": { "type": "number", "staticString": 2 },
                      "children": { "type": "slot", "slot": "hero-cols-slot" }
                    },
                    "slots": {
                      "hero-cols-slot": [
                        {
                          "uid": "hero-left",
                          "type": "box",
                          "props": {
                            "children": { "type": "slot", "slot": "hero-left-slot" }
                          },
                          "slots": {
                            "hero-left-slot": [
                              {
                                "uid": "hero-h1",
                                "type": "header",
                                "props": {
                                  "text": { "type": "string", "staticString": "Build Better Products" },
                                  "Tag": { "type": "choice", "staticString": "h1" }
                                },
                                "slots": {},
                                "styles": {
                                  "default": {
                                    "classes": [],
                                    "responsiveStyles": {
                                      "default": { "fontSize": "3.5rem", "fontWeight": "800", "lineHeight": "1.1" },
                                      "mobile": { "fontSize": "2rem" }
                                    }
                                  }
                                }
                              },
                              {
                                "uid": "hero-sub",
                                "type": "text",
                                "props": {
                                  "text": { "type": "string", "staticString": "The all-in-one platform for modern teams." }
                                },
                                "slots": {},
                                "styles": {
                                  "default": {
                                    "classes": [],
                                    "responsiveStyles": {
                                      "default": { "fontSize": "1.25rem", "color": "#666666" }
                                    }
                                  }
                                }
                              },
                              {
                                "uid": "hero-btn",
                                "type": "button",
                                "props": {
                                  "label": { "type": "string", "staticString": "Get Started Free" },
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
                                "default": { "display": "flex", "flexDirection": "column", "justifyContent": "center", "gap": "24px", "flex": "1" }
                              }
                            }
                          }
                        },
                        {
                          "uid": "hero-right",
                          "type": "image",
                          "props": {
                            "src": { "type": "imageurl", "staticString": "" },
                            "alt": { "type": "string", "staticString": "Product screenshot" }
                          },
                          "slots": {},
                          "styles": {
                            "default": {
                              "classes": [],
                              "responsiveStyles": {
                                "default": { "width": "100%", "borderRadius": "12px", "flex": "1" }
                              }
                            }
                          }
                        }
                      ]
                    },
                    "styles": {
                      "default": {
                        "classes": [],
                        "responsiveStyles": {
                          "default": { "display": "flex", "flexDirection": "row", "gap": "48px" },
                          "mobile": { "flexDirection": "column" }
                        }
                      }
                    }
                  }
                ]
              },
              "styles": {
                "default": {
                  "classes": [],
                  "responsiveStyles": {
                    "default": { "maxWidth": "1200px", "marginLeft": "auto", "marginRight": "auto", "padding": "96px 24px" },
                    "mobile": { "padding": "48px 16px" }
                  }
                }
              }
            }
          ]
        },
        "styles": {}
      }
    }
  ]
}
```

## Step 3: Apply Data Bindings (if linked composition)

After structure is created, use `bind-data` skill. Remember: MODIFY replaces entire `props`, so include ALL props.

## Step 4: Present Summary

```
Page built:
- Hero Section: header(h1) + text + button, 2-column with image
- Responsive: stacks on mobile
- Components: 8 total

Would you like to adjust anything or add more sections?
```

## Page Templates Quick Reference

### Blog Post (linked to `blog_post` CT)
```
section → box(max-width:800)
  ├── header (h1, bind: template/title)
  ├── image (bind: template/featured_image.url)
  ├── box(flex-row) → text(bind: author.name) + text(bind: publish_date)
  └── json-rte (bind: template/body)
```

### Team Page
```
section → box
  ├── header (h2)
  └── hstack → repeater(bind: team_members)
        └── box → image + header(h3) + text
```

### Simple Landing
```
section(hero) → box(centered) → header(h1) + text + button
section(features) → box → header(h2) + hstack(3) → 3x box[header(h3) + text]
section(cta) → box(centered) → header(h2) + button
```

## Component Type Reminder

| Want | Use | NOT |
|------|-----|-----|
| Paragraph | `text` | ~~paragraph~~ |
| Container | `box` | ~~container~~ |
| Columns | `hstack` | ~~flex, grid, columns~~ |
| Rows | `vstack` | ~~stack, rows~~ |
| Rich text | `json-rte` | ~~richtext~~ |
| Divider | `separator` | ~~divider~~ |
| Button label | prop `label` | ~~text~~ |
| Button URL | prop `link` | ~~href~~ |
| Heading level | prop `Tag` | ~~headingTag, tag~~ |
