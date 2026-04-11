# Composable Studio — Product Overview

## What is Composable Studio?

Composable Studio is Contentstack's visual page builder. It lets users create web pages by combining components — headings, images, buttons, cards, layouts — either visually (drag-and-drop) or with AI assistance (Polaris).

Pages are stored as **compositions** — JSON trees of nested components. The SDK renders these compositions in the user's web app.

## Two Modes

### Visual Compose Mode

**What it is:** A drag-and-drop canvas where users visually build pages.

**How it works:**
1. User opens a composition in Studio
2. Left panel shows available components (headers, text, buttons, images, etc.)
3. User drags components onto the canvas → they appear as visual elements
4. Right panel shows component properties (text, colors, spacing, data bindings)
5. User configures each component's props, styles, and CMS data bindings
6. Everything is saved as composition JSON (TOON format)

**What Polaris helps with in this mode:**
- "Create a hero section with heading, subtitle, and CTA button" → generates the composition JSON (the equivalent of dragging, dropping, and configuring multiple components manually)
- "Bind the heading to the blog title from CMS" → creates data binding on the prop
- "Make this responsive — stack columns on mobile" → adds breakpoint-specific styles
- "Show a grid of blog post cards from this content type" → sets up a repeater with data binding

**Requires:** A Contentstack stack connected (for CMS data), compositions stored in the stack

### Studio AI Mode

**What it is:** AI-powered code editing. User has a GitHub repo, and Polaris can directly read and edit files in it.

**How it works:**
1. User connects a GitHub repo to Studio AI
2. A runtime environment is provisioned (Railway container with OpenCode)
3. User chats with Polaris in the left panel
4. Polaris reads project files, makes code changes, runs commands
5. Changes appear in a code editor / preview in the center panel

**What Polaris helps with in this mode:**
- "Set up Studio SDK in my Next.js project" → installs package, creates config files, registers components
- "Register my HeroBanner React component with Studio" → adds SDK registration code
- "Register all my Tailwind design tokens" → extracts theme, creates token registration
- "Create a navbar component" → writes React component code
- "Fix this TypeScript error" → reads error, modifies code

**Requires:** A GitHub repo connected, runtime provisioned

### Unified Mode (Future)

Both stack AND repo connected. User gets Visual Compose for page building + Studio AI for code editing in the same project.

## Overall Workflow

```
1. Create Project
   ├── Visual Compose: Connect a Contentstack stack + content type
   ├── Studio AI: Connect a GitHub repo
   └── Unified: Both

2. Build Pages
   ├── Visual Compose: Drag components → configure props → bind CMS data → style
   ├── Studio AI: Write code → register components → configure SDK
   └── Polaris helps in both modes

3. Preview
   ├── Visual Compose: Live preview in iframe with draft CMS data
   └── Studio AI: Code preview with hot reload

4. Publish
   ├── Visual Compose: Publish composition to an environment
   └── Studio AI: Commit + push code
```

## What Polaris Can Do

| Capability | Visual Compose | Studio AI |
|-----------|---------------|-----------|
| Answer questions about Studio/CMS | Yes | Yes |
| Create/modify compositions (JSON) | Yes | No |
| Edit code files | No | Yes |
| Run shell commands | No | Yes |
| Set up SDK | No | Yes |
| Register components | No | Yes |
| Bind CMS data to components | Yes | No |
| Change styles/responsive design | Yes | No |
| Create repeaters/loops | Yes | No |
| Install packages | No | Yes |

## Key Concepts

| Concept | What It Is |
|---------|-----------|
| **Composition** | A JSON tree of components that represents a page |
| **TOON Format** | The JSON structure for composition nodes (uid, type, props, slots, styles) |
| **Component** | A reusable UI element (header, button, image, box, etc.) registered with the SDK |
| **Slot** | An area inside a component where other components can be nested |
| **Data Binding** | Connecting a component's prop to CMS content (so it shows dynamic data) |
| **Design Tokens** | Reusable design values (colors, spacing, typography) registered with the SDK |
| **Breakpoints** | Responsive editing modes (desktop, tablet, mobile) |
| **Repeater** | A component that iterates over an array and renders a template per item |
| **Stack** | A Contentstack workspace containing content types, entries, and assets |
| **Entry** | An instance of a content type (like a blog post, product, team member) |
