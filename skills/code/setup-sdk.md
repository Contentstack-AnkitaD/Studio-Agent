---
name: setup-sdk
description: Install and configure Composable Studio SDK in a user's web project — install package, create provider, register components, set env vars, verify setup
type: skill
agent: polaris-agent
triggers: ["setup studio", "install sdk", "integrate studio", "set up composable", "connect to studio", "get started with studio"]
---

# Setup SDK — Integrate Studio in a Project

## When to Use

User is new to Studio or setting up a new project:
- "How do I set up Studio SDK in my project?"
- "I need to integrate my React app with Studio"
- "Help me connect my project to Contentstack Studio"
- "I'm stuck, I installed the SDK but nothing works"

## Pre-flight Checklist

Before starting, verify:

1. **Framework** — What framework is the project using? (React, Next.js, Vue, etc.)
2. **Package manager** — npm, yarn, or pnpm?
3. **Existing setup** — Is the SDK already installed? Check `package.json`

```bash
# Check if SDK is already installed
cat package.json | grep composable-studio-sdk
```

## Step 1: Install the SDK

```bash
npm install @contentstack/composable-studio-sdk
```

Verify installation:
```bash
ls node_modules/@contentstack/composable-studio-sdk
```

## Step 2: Find the App Entry Point

Look for the main app file:
- React: `src/App.tsx` or `src/App.jsx`
- Next.js: `src/app/layout.tsx` or `pages/_app.tsx`
- Vue: `src/App.vue` or `src/main.ts`

Read the file to understand the current structure.

## Step 3: Create the Studio Configuration File

Create a dedicated config file for Studio setup:

```typescript
// src/studio/config.ts (or studio-config.ts)

import { ComposableStudioSDK } from "@contentstack/composable-studio-sdk";

// Import your registered components (Step 5)
import { registeredComponents } from "./components";

// Import design tokens (Step 6, optional)
import { designTokens } from "./design-tokens";

// Import breakpoints (Step 7, optional)
import { breakpoints } from "./breakpoints";

export function initStudio() {
  const sdk = new ComposableStudioSDK({
    components: registeredComponents,
    designTokens: designTokens,
    breakpoints: breakpoints,
  });

  sdk.init();
  return sdk;
}
```

## Step 4: Initialize in App Entry

Add Studio initialization to the app entry point.

**React (App.tsx):**
```tsx
import { useEffect } from "react";
import { initStudio } from "./studio/config";
import { StudioProvider } from "@contentstack/composable-studio-sdk";

function App() {
  useEffect(() => {
    // Only init when running inside Studio iframe
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("cs_studio") === "true") {
      initStudio();
    }
  }, []);

  return (
    <StudioProvider>
      {/* Your app content */}
    </StudioProvider>
  );
}
```

**Next.js (layout.tsx):**
```tsx
"use client";
import { useEffect } from "react";
import { initStudio } from "@/studio/config";

export default function RootLayout({ children }) {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("cs_studio") === "true") {
      initStudio();
    }
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

## Step 5: Register Components

Create a components registration file. Read the user's existing components and register them.

```typescript
// src/studio/components.ts

import { registerComponents } from "@contentstack/composable-studio-sdk";

// Import the user's actual React components
import { HeroBanner } from "../components/HeroBanner";
import { Card } from "../components/Card";
import { Footer } from "../components/Footer";

export const registeredComponents = registerComponents([
  {
    type: "hero-banner",
    title: "Hero Banner",
    component: HeroBanner,
    category: "content",
    props: {
      heading: { type: "string", title: "Heading", default: "Welcome" },
      subheading: { type: "string", title: "Subheading", default: "" },
      backgroundImage: { type: "imageurl", title: "Background Image", default: "" },
      ctaText: { type: "string", title: "CTA Text", default: "Learn More" },
      ctaUrl: { type: "href", title: "CTA URL", default: "#" },
    },
  },
  {
    type: "card",
    title: "Card",
    component: Card,
    category: "content",
    props: {
      title: { type: "string", title: "Title", default: "Card Title" },
      description: { type: "string", title: "Description", default: "", control: "large" },
      image: { type: "imageurl", title: "Image", default: "" },
      link: { type: "href", title: "Link", default: "#" },
    },
  },
  // ... more components
]);
```

### How to Map Existing Props to Studio Prop Types

Read the component's TypeScript interface or PropTypes and map:

| Component Prop Type | Studio Prop Type |
|-------------------|-----------------|
| `string` | `"string"` |
| `number` | `"number"` |
| `boolean` | `"boolean"` |
| `string` (URL) | `"href"` |
| `string` (image URL) | `"imageurl"` |
| `string` with options | `"choice"` with `options` |
| `ReactNode` / children | `"slot"` |
| `object` with shape | `"object"` with `props` |
| `array` | `"array"` with `items` |
| `Date` / date string | `"datestring"` |
| Rich text / HTML | `"json_rte"` |

## Step 6: Register Design Tokens (Optional)

If the project has a design system / theme:

```typescript
// src/studio/design-tokens.ts

import { DesignRegistry } from "@contentstack/composable-studio-sdk";

export const designTokens = {
  colors: {
    primary: { value: "#0066CC", title: "Primary" },
    secondary: { value: "#FF6600", title: "Secondary" },
    // ... extract from project's theme
  },
  spacing: {
    sm: { value: "8px", title: "Small" },
    md: { value: "16px", title: "Medium" },
    lg: { value: "32px", title: "Large" },
  },
  // ... more token categories
};
```

See `register-design-tokens` skill for detailed extraction from existing theme files.

## Step 7: Register Breakpoints (Optional)

```typescript
// src/studio/breakpoints.ts

export const breakpoints = [
  { id: "desktop", title: "Desktop", minWidth: 1024, default: true },
  { id: "tablet", title: "Tablet", minWidth: 768, maxWidth: 1023 },
  { id: "mobile", title: "Mobile", maxWidth: 767 },
];
```

## Step 8: Set Environment Variables

Add to `.env` (or `.env.local`):

```bash
CONTENTSTACK_API_KEY=bltYOUR_STACK_API_KEY
CONTENTSTACK_DELIVERY_TOKEN=csYOUR_DELIVERY_TOKEN
CONTENTSTACK_ENVIRONMENT=production
CONTENTSTACK_REGION=us
```

## Step 9: Verify Setup

Run the dev server and check:

```bash
npm run dev
```

1. Open the app with Studio params: `http://localhost:3000/?cs_studio=true`
2. Check browser console for SDK initialization logs
3. Verify no errors about missing components or tokens

### Verification Checklist

- [ ] SDK package installed in `node_modules`
- [ ] `initStudio()` called only when `cs_studio=true`
- [ ] At least one component registered
- [ ] No console errors on load
- [ ] Components render in Studio's component panel
- [ ] Props show in Studio's right panel when component is selected
- [ ] Design tokens appear in style panel (if registered)
- [ ] Breakpoints show in toolbar (if registered)

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "SDK not initialized" | Check `cs_studio=true` in URL params |
| "Component not found" | Verify `type` in registration matches composition JSON |
| Components don't show in panel | Check `registerComponents()` is called before `sdk.init()` |
| Props not editable | Verify prop types match Studio prop type names exactly |
| Styles not applying | Check design tokens are registered before `sdk.init()` |
| "postMessage origin mismatch" | Ensure Studio and iframe are on correct domains |
| Blank iframe in Studio | Check CORS headers, verify app serves on correct port |
| Hot reload breaks Studio | SDK re-initializes — add HMR guard |

## Common Mistakes

1. **Calling `sdk.init()` before registering components** — Register first, init last
2. **Using wrong prop type names** — It's `"imageurl"` not `"image"`, `"href"` not `"url"`, `"choice"` not `"enum"`
3. **Forgetting `StudioProvider`** — Wrap app in provider for React hooks to work
4. **Initializing outside Studio** — Check `cs_studio` param to avoid breaking normal app
5. **Not setting env vars** — SDK needs API key + delivery token for CDA calls
