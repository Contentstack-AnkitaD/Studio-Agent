---
name: setup-sdk
description: Install and configure the Contentstack Studio SDK in a web project — install @contentstack/studio-react, initialize via studioSdk.init({stackSdk}), register components, set env vars, verify setup. For SSR setup see setup-ssr.
type: skill
agent: polaris-agent
triggers: ["setup studio", "install sdk", "integrate studio", "set up composable", "connect to studio", "get started with studio"]
---

# Setup SDK — Integrate Studio in a Project (CSR)

Authoritative reference: <https://www.contentstack.com/docs/studio/set-up-studio-for-a-csr-project>. This skill covers the **CSR (client-side rendering)** flow — for SSR with Next.js, use the `setup-ssr` skill instead. Most of the steps (install, stack creation, registration) are identical.

## When to Use

User is new to Studio or setting up a new project:
- "How do I set up Studio SDK in my project?"
- "I need to integrate my React app with Studio"
- "Help me connect my project to Contentstack Studio"
- "I installed the SDK but nothing renders"

## Pre-flight Checklist

1. **Framework** — React (Vite/CRA) for CSR; Next.js + use `setup-ssr` for SSR.
2. **Package manager** — npm, yarn, or pnpm.
3. **Existing setup** — Is the SDK already installed? Check `package.json` for `@contentstack/studio-react`.

```bash
cat package.json | grep -E "studio-react|delivery-sdk"
```

## Step 1: Install the SDK

```bash
npm install @contentstack/studio-react @contentstack/delivery-sdk
```

Verify:

```bash
ls node_modules/@contentstack/studio-react
```

Both packages come from npm:
- `@contentstack/studio-react` — the Studio renderer + SDK init helpers
- `@contentstack/delivery-sdk` — Contentstack's content delivery SDK (Studio uses it for CDA calls)

## Step 2: Create the Delivery Stack + initialize the Studio SDK

This is a **one-time module-load** side effect. Create a shared file (e.g. `src/studio/index.ts`) that both creates the Contentstack delivery stack AND calls `studioSdk.init(...)`.

```ts
// src/studio/index.ts
import contentstack from "@contentstack/delivery-sdk";
import { studioSdk } from "@contentstack/studio-react";

const stack = contentstack.stack({
  apiKey:        process.env.REACT_APP_CONTENTSTACK_API_KEY!,        // CRA — adjust prefix for your framework
  deliveryToken: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
  environment:   process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
  host:          process.env.REACT_APP_CONTENTSTACK_CDN_HOST!,
  live_preview: {
    preview_token: process.env.REACT_APP_CONTENTSTACK_PREVIEW_TOKEN!,
    enable: true,
  },
});

studioSdk.init({ stackSdk: stack });
```

For Vite use `import.meta.env.VITE_*`; for Next.js use `process.env.NEXT_PUBLIC_*` (in the CSR case). Pick the prefix matching your framework's runtime-env convention.

## Step 3: Import the studio module from the app entry

The init must run **before any component tries to render a composition**. The simplest way: import the module from the app entry so its top-level `studioSdk.init(...)` call fires once on app boot.

```ts
// src/index.ts (or src/main.tsx for Vite)
import "./studio";  // ← side-effect import; this runs studioSdk.init() once
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")!).render(<App />);
```

There is **no `<StudioProvider>` wrapper** — the SDK uses a singleton (`studioSdk`) not React context, so providing it via a JSX provider is unnecessary.

## Step 4: Register your components

Components must be registered **before** any composition renders. Do this in a registry module that's imported alongside the SDK init.

```ts
// src/studio/registry.ts
import { registerComponent, registerComponents } from "@contentstack/studio-react";
import HeroBanner from "../components/HeroBanner";
import Card from "../components/Card";
import Footer from "../components/Footer";

// Option 1 — one at a time
registerComponent("hero_banner", HeroBanner);
registerComponent("card", Card);

// Option 2 — bulk
registerComponents({
  hero_banner: HeroBanner,
  card:        Card,
  footer:      Footer,
});
```

Then make sure `studio/index.ts` imports it before init runs:

```ts
// src/studio/index.ts
import "./registry";   // ← registers all components first
import contentstack from "@contentstack/delivery-sdk";
import { studioSdk } from "@contentstack/studio-react";
// ...stack creation + studioSdk.init as in Step 2
```

The SDK also offers `registerLazyComponent(uid, () => import("./Heavy"))` for code-split components.

## Step 5: Fetch and render a composition (CSR)

In your page or app component, use the React hook `useCompositionData(...)` and the `<StudioComponent>` renderer:

```tsx
// src/App.tsx (Vite/CRA) or any page
import { useCompositionData, StudioComponent } from "@contentstack/studio-react";

export default function App() {
  const { specOptions, isLoading, error, hasSpec } = useCompositionData({
    compositionUid: "page",
  });

  if (isLoading) return <p>Loading…</p>;
  if (error) return <p>Failed to load composition.</p>;
  if (!hasSpec) return <p>Composition not found.</p>;

  return <StudioComponent specOptions={specOptions} />;
}
```

**Important:** `useCompositionData` is for CSR only. For SSR (Next.js `getServerSideProps` or App Router server component) use `studioClient.fetchCompositionData(...)` instead — see `setup-ssr`.

## Step 6: Register Design Tokens (Optional)

If the project has a design system / theme:

```ts
// src/studio/design-tokens.ts
import { registerDesignTokens, registerDesignClasses, type DesignTokensInput } from "@contentstack/studio-react";

const tokens: DesignTokensInput = {
  colors: {
    primary:   { value: "#0066CC", title: "Primary" },
    secondary: { value: "#FF6600", title: "Secondary" },
  },
  spacing: {
    sm: { value: "8px",  title: "Small"  },
    md: { value: "16px", title: "Medium" },
    lg: { value: "32px", title: "Large"  },
  },
};

registerDesignTokens(tokens);

// Optional — register reusable CSS class presets
registerDesignClasses({
  "btn-primary": { background: "primary", color: "#fff", padding: "md" },
});
```

Then import this file from `src/studio/index.ts` alongside the registry. See `register-design-tokens` skill for detailed extraction from existing theme files.

## Step 7: Register Breakpoints (Optional)

```ts
// src/studio/breakpoints.ts
import { registerBreakpoints } from "@contentstack/studio-react";

registerBreakpoints({
  desktop: { minWidth: 1024, title: "Desktop", default: true },
  tablet:  { minWidth: 768,  maxWidth: 1023, title: "Tablet" },
  mobile:  { maxWidth: 767, title: "Mobile" },
});
```

## Step 8: Set Environment Variables

Pick the prefix matching your framework:

```bash
# Vite
VITE_CONTENTSTACK_API_KEY=bltYOUR_STACK_API_KEY
VITE_CONTENTSTACK_DELIVERY_TOKEN=csYOUR_DELIVERY_TOKEN
VITE_CONTENTSTACK_ENVIRONMENT=production
VITE_CONTENTSTACK_CDN_HOST=cdn.contentstack.io
VITE_CONTENTSTACK_PREVIEW_TOKEN=csYOUR_PREVIEW_TOKEN

# CRA
REACT_APP_CONTENTSTACK_API_KEY=...
REACT_APP_CONTENTSTACK_DELIVERY_TOKEN=...
# ...

# Next.js (server-only — CSR pages can use NEXT_PUBLIC_*; SSR uses unprefixed)
CONTENTSTACK_API_KEY=...
CONTENTSTACK_DELIVERY_TOKEN=...
```

The delivery token is read-only and used by the Delivery SDK at runtime. The preview token enables Live Preview when needed.

## Step 9: Verify Setup

```bash
npm run dev
```

1. Open the app — the `useCompositionData` hook fires immediately and fetches the composition.
2. Check browser network tab: a request to `*.cdn.contentstack.io/v3/...` (or the regional equivalent) should return 200 with the composition spec.
3. Confirm `<StudioComponent>` renders the resolved components.
4. To preview inside the Visual Builder, open `http://localhost:3000/?cs_studio=true` — `clientRendererModeUtil.isInsideStudioFrame()` flips to true and Studio overlays appear.

### Verification Checklist

- [ ] `@contentstack/studio-react` and `@contentstack/delivery-sdk` are in `node_modules`
- [ ] `src/studio/index.ts` runs at module load (imported from the app entry)
- [ ] `studioSdk.init({ stackSdk })` is called exactly once
- [ ] At least one component is registered via `registerComponent(...)` or `registerComponents(...)`
- [ ] No console errors on app boot
- [ ] `useCompositionData(...)` returns a `specOptions` value
- [ ] `<StudioComponent specOptions={specOptions} />` renders the composition
- [ ] Design tokens / breakpoints registered (if used)

## API Quick Reference (real exports from `@contentstack/studio-react`)

| Symbol | Purpose |
|---|---|
| `studioSdk.init({ stackSdk })` | One-time SDK initialization at module load |
| `useCompositionData({ compositionUid })` | CSR hook — returns `{ specOptions, isLoading, error, hasSpec }` |
| `<StudioComponent specOptions={...}/>` | Renders the resolved composition spec |
| `registerComponent(uid, Component)` / `registerComponents(map)` / `registerLazyComponent(uid, () => import(...))` | Component registration |
| `registerDesignTokens(tokens)` / `registerDesignClasses(classes)` / `getDesignTokens()` | Design system registration |
| `registerBreakpoints(map)` | Breakpoint registration |
| `registerJSONRTE(...)` | Custom rich-text node registration |
| `clientRendererModeUtil.isInsideStudioFrame()` | Detect Visual Builder iframe (returns false on server) |
| Types: `DesignTokensInput`, `RegisterComponentOptionsInput`, `StudioComponentSpecOptions`, `StudioSpec` | for typing |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `useCompositionData` returns `hasSpec: false` | Verify the `compositionUid` matches a published composition in the target env; check the network tab for the CDA response |
| "component not found" / blank component | The composition references a UID that wasn't registered — add it via `registerComponent(uid, Component)` |
| Studio panel doesn't recognize component props | Use the `register-component` skill to add the proper props schema |
| Hot reload breaks Studio | `studioSdk` is a singleton — module-level `init` reruns can cause double-init warnings. Guard with `if (!alreadyInited)` if needed. |
| Env var undefined at runtime | Check the prefix matches the framework (`VITE_` / `REACT_APP_` / `NEXT_PUBLIC_`) and restart the dev server after `.env*` edits |
| "postMessage origin mismatch" | Ensure the Visual Builder origin is configured to allow this app's URL |

## Common Mistakes

1. **Expecting a `<StudioProvider>` JSX wrapper** — The Studio SDK is a singleton initialized via `studioSdk.init(...)`, not a context provider. Don't wrap your app in a provider.
2. **Calling `studioSdk.init()` after components render** — Init must run before `<StudioComponent>` resolves any spec. Put it in a module that's imported from the app entry.
3. **Using `useCompositionData` inside `getServerSideProps`** — That's a React hook; it only works during render. Use `studioClient.fetchCompositionData(...)` for SSR (see `setup-ssr`).
4. **Forgetting to register a component** — Any UID in the composition that isn't registered won't render. Always register all components in a module loaded before init.
5. **Setting Contentstack creds in a public env var when not needed** — On SSR the delivery token stays server-side. Only CSR builds need `NEXT_PUBLIC_*` / `VITE_*` exposure.
