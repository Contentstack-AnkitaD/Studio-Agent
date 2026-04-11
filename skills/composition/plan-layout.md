---
name: plan-layout
description: Analyze a user's page/section description and decide the optimal component tree — which components to use, how to nest them, what goes inside what
type: skill
agent: polaris-assist
triggers: ["build", "create", "make", "design", "layout", "page", "section", "hero", "landing"]
---

# Plan Layout — From Description to Component Tree

## When to Use

User describes a visual outcome:
- "I want a hero banner with a two-column layout below it"
- "Create a pricing page with 3 plan cards"
- "Build a blog post template with author info sidebar"

## Step 1: Parse the Description

Extract:
- **Page sections** — hero, features, pricing, testimonials, footer
- **Layout patterns** — columns, rows, cards, sidebar, full-width
- **Content elements** — headings, text, images, buttons
- **Data requirements** — "from CMS", "blog posts" → needs binding
- **Repetition** — "3 cards", "list of posts" → needs repeater

## Step 2: Map to Components

**IMPORTANT: Use the correct component type strings. See the table below.**

```
Full-width section wrapper?
  → section

Need columns side by side?
  → hstack (with box children for each column)

Need rows stacked vertically?
  → vstack (with box children for each row)

Need a generic container/wrapper?
  → box

Heading text?
  → header (props: text, Tag)

Paragraph/body text?
  → text

Image?
  → image (props: src, alt)

Button/CTA?
  → button (props: label, link, openInNewTab)

Clickable link?
  → link (props: href, label)

Clickable card/image area?
  → link-container (wraps children, props: href)

Card with header+content+footer?
  → card (3 slots: header, children, footer)

List of similar items?
  → repeater (items bound to data source)
    → Template component inside (rendered per item)

Rich text content (CMS)?
  → json-rte (props: jsonData)

Separator/divider?
  → separator (props: orientation)

Collapsible/accordion?
  → collapsible (props: header, content)

Custom HTML/embed?
  → html-element (props: Tag, children slot)

Embed (YouTube, etc)?
  → embed (props: src)

Navigation menu?
  → menubar (props: menu array)
```

## Step 3: Correct Component Type Reference

| What You Want | Correct Type | Display Name |
|--------------|-------------|-------------|
| Paragraph | `text` | Paragraph |
| Container/wrapper | `box` | Box |
| Horizontal columns | `hstack` | Columns |
| Vertical rows | `vstack` | Rows |
| Rich text | `json-rte` | JSON RTE |
| HTML block | `html-element` | HTML Element |
| Divider | `separator` | Separator |
| Accordion | `collapsible` | Collapsible |

**DO NOT USE:** `paragraph`, `container`, `flex`, `grid`, `columns`, `rows`, `richtext`, `html`, `divider`, `icon`, `form`, `tabs`, `carousel`, `spacer` — these types DO NOT EXIST in the SDK.

## Step 4: Design the Nesting Tree

**Rule: Every visual block goes inside a `section` → `box` wrapper.**

```
page (root — already exists, don't create)
  └── section (hero)
  │     └── box (centered container)
  │           ├── header (h1: "Welcome")
  │           ├── text ("Subtitle")
  │           └── button ("Get Started")
  └── section (features)
  │     └── box (container)
  │           ├── header (h2: "Features")
  │           └── hstack (3 columns)
  │                 ├── box (card 1) → header(h3) + text
  │                 ├── box (card 2) → header(h3) + text
  │                 └── box (card 3) → header(h3) + text
  └── section (cta)
        └── box (centered)
              ├── header (h2: "Ready?")
              └── button ("Sign Up")
```

## Step 5: Present Plan to User

```
Here's what I'll build:

1. **Hero Section** (full-width, centered)
   - Header: h1
   - Text: subtitle
   - Button: CTA

2. **Features Section** (3-column hstack)
   - 3 boxes, each with:
     - Header: h3
     - Text: description

3. **CTA Section** (centered)
   - Header: h2
   - Button

Shall I proceed?
```

## Step 6: Generate JSON

After user confirms, use the `add-component` skill for the correct JSON format.

**Build order:** Add sections as children of the page root. Build the full subtree for each section as one ADD operation.

## Common Layout Patterns

### Hero Banner
```
section → box(centered, flex-column)
  ├── header (h1)
  ├── text (subtitle)
  └── box(flex-row, gap)
        ├── button (primary)
        └── button (secondary)
```

### Two-Column with Image
```
section → box → hstack(2)
  ├── box(left) → header + text + button
  └── box(right) → image
```

### Card Layout (3 cards)
```
section → box
  ├── header (h2, centered)
  └── hstack(3)
        ├── box → image + header(h3) + text
        ├── box → image + header(h3) + text
        └── box → image + header(h3) + text
```

### Blog Post Template (linked composition)
```
section → box(maxWidth:800px)
  ├── header (h1, bound to template.title)
  ├── image (bound to template.featured_image.url)
  ├── box(flex-row) → text(bound: author.name) + text(bound: publish_date)
  └── json-rte (bound to template.body)
```

### Repeating List
```
section → box
  ├── header (h2: "Our Team")
  └── hstack → repeater (items bound to data)
        └── box → image + header(h3) + text
```

## Anti-Patterns

| Wrong | Right | Why |
|-------|-------|-----|
| Content directly in page root | Wrap in `section` → `box` | No styling control |
| `"type": "paragraph"` | `"type": "text"` | `paragraph` doesn't exist |
| `"type": "flex"` | `"type": "hstack"` or `"vstack"` | `flex` doesn't exist |
| `"type": "container"` | `"type": "box"` | `container` doesn't exist |
| `"type": "grid"` | `"type": "hstack"` | `grid` doesn't exist — use columns |
| Nest section inside section | Section is top-level only | Sections are page-level dividers |
| Button prop `text` | Button prop `label` | `text` is not the button label prop |
| Button prop `href` | Button prop `link` | `href` is for the `link` component |
| Header prop `headingTag` | Header prop `Tag` | Capital T, no `heading` prefix |
