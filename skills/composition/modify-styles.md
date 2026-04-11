---
name: modify-styles
description: Change visual styles on composition nodes — colors, spacing, typography, layout, responsive overrides
type: skill
agent: polaris-assist
triggers: ["style", "change color", "font size", "padding", "margin", "responsive", "mobile", "tablet", "make it bigger", "spacing", "center", "align"]
---

# Modify Styles — Change Visual Appearance

## When to Use

User wants to change how something looks:
- "Make the heading bigger"
- "Add more padding to the hero section"
- "Center the text"
- "Change the background to blue"

## Style Structure

Styles use a **nested format**: `styles.<styleGroup>.responsiveStyles.<breakpoint>.<cssProperty>`

```json
{
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": {
          "fontSize": "2rem",
          "color": "#333333"
        }
      }
    }
  }
}
```

- `"default"` (outer) = the style group (almost always `"default"`)
- `"classes"` = design class names (array of strings)
- `"responsiveStyles"` = breakpoint-keyed CSS properties
- `"default"` (inner) = the base breakpoint

**DO NOT use flat format like `{ "desktop": { "typography": {} } }` — that is WRONG.**

## Applying Style Changes

Use MODIFY operation. **WARNING:** `Transforms.setNodes` merges at the top level but NOT deep. Sending `changes: { styles: {...} }` replaces the entire `styles` object.

**To safely change one CSS property**, include the full styles object:

```json
{
  "operation": "modify",
  "targetUid": "hero-heading-uid",
  "changes": {
    "styles": {
      "default": {
        "classes": [],
        "responsiveStyles": {
          "default": {
            "fontSize": "3rem",
            "fontWeight": "700",
            "textAlign": "center",
            "color": "#333333"
          }
        }
      }
    }
  }
}
```

**Best practice:** Read the node's current styles first, merge your changes, send the full styles object.

## CSS Properties Reference

All properties use camelCase (React style):

```json
{
  "responsiveStyles": {
    "default": {
      "display": "flex",
      "flexDirection": "column",
      "alignItems": "center",
      "justifyContent": "center",
      "gap": "24px",
      "flexWrap": "wrap",

      "width": "100%",
      "height": "400px",
      "maxWidth": "1200px",
      "minHeight": "200px",

      "marginTop": "24px",
      "marginBottom": "24px",
      "marginLeft": "auto",
      "marginRight": "auto",
      "paddingTop": "64px",
      "paddingBottom": "64px",
      "paddingLeft": "24px",
      "paddingRight": "24px",

      "fontSize": "2rem",
      "fontWeight": "700",
      "fontFamily": "Inter, sans-serif",
      "lineHeight": "1.4",
      "letterSpacing": "-0.02em",
      "textAlign": "center",
      "textTransform": "uppercase",
      "textDecoration": "none",
      "color": "#333333",
      "fontStyle": "italic",

      "backgroundColor": "#FFFFFF",
      "backgroundImage": "url(...)",
      "backgroundSize": "cover",
      "backgroundPosition": "center",

      "borderWidth": "1px",
      "borderStyle": "solid",
      "borderColor": "#E0E0E0",
      "borderRadius": "8px",

      "boxShadow": "0 4px 6px rgba(0,0,0,0.1)",
      "opacity": "0.8",

      "position": "relative",
      "top": "0",
      "left": "0",
      "zIndex": "10",

      "overflow": "hidden",
      "transform": "translateY(-50%)",
      "transition": "all 0.3s ease",

      "flex": "1"
    }
  }
}
```

## Responsive Overrides

Add additional breakpoint keys inside `responsiveStyles`:

```json
{
  "styles": {
    "default": {
      "classes": [],
      "responsiveStyles": {
        "default": {
          "fontSize": "3rem",
          "flexDirection": "row",
          "padding": "96px 24px"
        },
        "tablet": {
          "fontSize": "2rem",
          "padding": "48px 16px"
        },
        "mobile": {
          "fontSize": "1.5rem",
          "flexDirection": "column",
          "padding": "32px 16px"
        }
      }
    }
  }
}
```

Only override what CHANGES per breakpoint. Properties not specified inherit from `"default"`.

### Common Responsive Patterns

**Stack columns on mobile:**
```json
"default": { "flexDirection": "row" },
"mobile": { "flexDirection": "column" }
```

**Reduce font size:**
```json
"default": { "fontSize": "3rem" },
"tablet": { "fontSize": "2rem" },
"mobile": { "fontSize": "1.5rem" }
```

**Hide on mobile:**
```json
"mobile": { "display": "none" }
```

**Center on mobile:**
```json
"default": { "textAlign": "left" },
"mobile": { "textAlign": "center" }
```

## Common Requests → Changes

| User Says | CSS Property |
|-----------|-------------|
| "Make it bigger" | `fontSize` increase |
| "Center it" | `textAlign: "center"` or `alignItems: "center"` |
| "Add space" | `padding*` or `margin*` |
| "Make it bold" | `fontWeight: "700"` |
| "Add a border" | `borderWidth` + `borderStyle` + `borderColor` |
| "Round the corners" | `borderRadius` |
| "Add shadow" | `boxShadow` |
| "Full width" | `width: "100%"` |
| "Stack on mobile" | Add mobile breakpoint with `flexDirection: "column"` |
| "Change background" | `backgroundColor` |
