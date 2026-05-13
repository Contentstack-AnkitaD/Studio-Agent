---
name: setup-ssr
description: Configure a Next.js project to fetch and render Composable Studio compositions server-side (Pages Router getServerSideProps or App Router server components). Uses studioSdk.init + studioClient.fetchCompositionData.
type: skill
agent: polaris-agent
triggers: ["SSR", "server side rendering", "server-side", "getServerSideProps", "server render", "SSR composition", "fetch composition server", "studio ssr"]
---

# Setup SSR — Server-Side Rendering with Composable Studio

Authoritative reference: <https://www.contentstack.com/docs/studio/set-up-studio-for-a-ssr-project>.

## When to Use

User wants compositions rendered on the server (not just client-side):
- "Set up SSR for my Studio composition"
- "Fetch the composition in getServerSideProps"
- "I need server-side rendering with Studio"
- "Composition should be rendered on the server for SEO"

## Concept

SSR uses the same SDK as CSR, but the fetch path is different:
- **CSR** calls the React hook `useCompositionData(...)` during render.
- **SSR** calls `studioClient.fetchCompositionData(...)` directly inside `getServerSideProps` (or an App Router server component), passing the request's query string as `searchQuery`.

`studioClient` is what `studioSdk.init({ stackSdk })` returns. Both methods live in `@contentstack/studio-react`.

## Step 1: Set Up Environment Variables

Add to `.env.local`:

```bash
CONTENTSTACK_API_KEY=bltYOUR_STACK_API_KEY
CONTENTSTACK_DELIVERY_TOKEN=csYOUR_DELIVERY_TOKEN
CONTENTSTACK_ENVIRONMENT=production
CONTENTSTACK_CDN_HOST=cdn.contentstack.io
CONTENTSTACK_PREVIEW_TOKEN=csPREVIEW_TOKEN
```

## Step 2: Create `src/studio.ts` — Delivery stack + studioSdk.init (one-time)

```ts
// src/studio.ts
import contentstack from "@contentstack/delivery-sdk";
import { studioSdk } from "@contentstack/studio-react";

const stack = contentstack.stack({
  apiKey:        process.env.CONTENTSTACK_API_KEY!,
  deliveryToken: process.env.CONTENTSTACK_DELIVERY_TOKEN!,
  environment:   process.env.CONTENTSTACK_ENVIRONMENT!,
  host:          process.env.CONTENTSTACK_CDN_HOST!,
  live_preview: {
    preview_token: process.env.CONTENTSTACK_PREVIEW_TOKEN!,
    enable: true,
  },
});

// One-time init. The returned client exposes fetchCompositionData(...) for SSR.
export const studioClient = studioSdk.init({ stackSdk: stack });
```

## Step 3: Register Components Before Any Fetch

Component registration is a one-time module-load side effect — register everything your composition references before `<StudioComponent>` runs.

```ts
// src/studio-registry.ts — imported by src/studio.ts (or at app entry)
import { registerComponent, registerComponents } from "@contentstack/studio-react";
import HeroBanner from "./components/HeroBanner";
import Card from "./components/Card";
import Footer from "./components/Footer";

registerComponent("hero_banner", HeroBanner);
registerComponent("card", Card);
registerComponent("footer", Footer);
// or bulk:
// registerComponents({ hero_banner: HeroBanner, card: Card, footer: Footer });
```

Then in `src/studio.ts`, import the registry first:

```ts
import "./studio-registry"; // ensure side-effect registrations run
import contentstack from "@contentstack/delivery-sdk";
// ...rest of step 2
```

**Critical:** if a component type appears in a composition but isn't registered before `<StudioComponent>` tries to render, the renderer can't resolve the UID → React component mapping. Register all components at module load.

## Step 4: Use in `getServerSideProps` (Pages Router)

```tsx
// pages/index.tsx — or pages/[...slug].tsx
import type { GetServerSidePropsContext } from "next";
import Head from "next/head";
import {
  StudioComponent,
  extractStyles,
  type StudioComponentSpecOptions,
} from "@contentstack/studio-react";
import { studioClient } from "../studio";

interface HomeProps {
  studioProps: StudioComponentSpecOptions;
  styleSheet: string;
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { query: searchQuery } = context;

  // For dynamic slug routes, derive the composition path:
  // const url = "/" + (context.params?.slug as string[] | undefined ?? []).join("/");

  const studioProps = await studioClient.fetchCompositionData({
    searchQuery,
    compositionUid: "page", // or use `url:` for slug-based lookup
  });

  // Pull inline styles so the server-rendered HTML carries them
  const styleSheet = extractStyles(studioProps.spec);

  return { props: { studioProps, styleSheet } };
}

export default function Home({ studioProps, styleSheet }: HomeProps) {
  return (
    <>
      <Head>{styleSheet && <style dangerouslySetInnerHTML={{ __html: styleSheet }} />}</Head>
      <StudioComponent specOptions={studioProps} />
    </>
  );
}
```

**`searchQuery` notes:**
- Pass `context.query` directly — Next.js parses URL search params into this object.
- This forwards live-preview tokens, `cs_studio`, and any variant params that compositions rely on.
- Pass `{}` if there are no query params; the SSR signature requires the field.

## Step 5: Or Use in an App Router Server Component

```tsx
// app/[...slug]/page.tsx
import {
  StudioComponent,
  extractStyles,
  type StudioComponentSpecOptions,
} from "@contentstack/studio-react";
import { studioClient } from "@/lib/studio";

type Props = {
  params: { slug?: string[] };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function CompositionPage({ params, searchParams }: Props) {
  const url = "/" + (params.slug ?? []).join("/");

  const studioProps = await studioClient.fetchCompositionData({
    url,
    searchQuery: searchParams,
  });

  const styleSheet = extractStyles(studioProps.spec);

  return (
    <>
      {styleSheet && <style dangerouslySetInnerHTML={{ __html: styleSheet }} />}
      <StudioComponent specOptions={studioProps} />
    </>
  );
}
```

## Step 6: Gating Visual Builder Overlays (Optional)

`clientRendererModeUtil.isInsideStudioFrame()` returns `false` on the server (no `window`). Use it in a client component to mount edit overlays only when inside the Visual Builder iframe:

```tsx
"use client";
import { clientRendererModeUtil } from "@contentstack/studio-react";

export function EditOverlay({ uid }: { uid: string }) {
  if (!clientRendererModeUtil.isInsideStudioFrame()) return null;
  return <div data-cs-component={uid} className="cs-edit-overlay" />;
}
```

## API Quick Reference (real exports from `@contentstack/studio-react`)

| Symbol | Purpose |
|---|---|
| `studioSdk.init({ stackSdk })` | One-time SDK init at module load; returns the SSR/client object |
| `studioClient.fetchCompositionData({ compositionUid \| url, searchQuery })` | SSR composition fetch (the returned object from `init`) |
| `extractStyles(spec)` | Pulls the inline style sheet for server-rendered HTML |
| `<StudioComponent specOptions={...}/>` | Renders the spec |
| `registerComponent(uid, Component)` / `registerComponents(map)` | Component registration |
| `clientRendererModeUtil.isInsideStudioFrame()` | Runtime check, false on server |
| Types: `StudioComponentSpecOptions`, `StudioSpec`, `CompositionQueryForSSR`, `SearchQueryInput` | for typing props + queries |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Calling `useCompositionData` inside `getServerSideProps` | That's a CSR React hook — use `studioClient.fetchCompositionData(...)` for SSR |
| Forgetting to import the registry module before init | Import `./studio-registry` at the top of `src/studio.ts` so registrations run before any fetch |
| Not passing `searchQuery` | The SSR signature requires it (pass `{}` if no params); live preview + variants depend on it |
| Using `context.req.url` instead of `context.query` for search params | `context.query` is already parsed by Next.js |
| Initializing `studioSdk` more than once | `studioSdk.init` should run once at module load; re-importing the file is fine because `studioSdk` is a singleton |
| Putting `CONTENTSTACK_DELIVERY_TOKEN` in a `NEXT_PUBLIC_*` env var | Keep delivery token server-side only — SSR fetches happen on the server, so no client exposure is needed |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `<StudioComponent>` throws "component not found" | A component type in the composition is not registered — add it via `registerComponent(uid, Component)` |
| `studioClient.fetchCompositionData` returns null/empty spec | Check the `compositionUid` or `url` matches a published composition in the target environment |
| Studio features don't work in SSR mode | Verify `searchQuery` is forwarded from `context.query` (Pages) or `searchParams` (App Router) |
| Hydration mismatch errors in Next.js | Ensure client renders the same component tree as server — no conditional rendering on `typeof window` |
| Env var undefined at runtime | Ensure `.env.local` has the var and the dev server was restarted after edits |
| Preview shows published, not draft | Wire Live Preview separately — see the `setup-live-preview` skill |
| Inline styles missing in HTML | Make sure `extractStyles(studioProps.spec)` runs and the result is rendered inside `<Head><style>...</style></Head>` |
