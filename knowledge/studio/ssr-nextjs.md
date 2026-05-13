# Server-Side Rendering (SSR) with Studio

Studio compositions can be rendered server-side, enabling SEO-friendly pages and frameworks like Next.js. SSR changes how the composition spec is fetched: instead of a client-side React hook, the server explicitly calls `studioClient.fetchCompositionData(...)` with an explicit `searchQuery` (the query-string params the browser would normally provide).

Authoritative reference: <https://www.contentstack.com/docs/studio/set-up-studio-for-a-ssr-project>.

## Key Concepts

- The server cannot read `window.location.search`, so callers must pass `searchQuery` explicitly (e.g. `context.query` in `getServerSideProps`).
- The SDK is initialized **once** at module-load time via `studioSdk.init({ stackSdk })`. The returned `studioClient` exposes `fetchCompositionData(...)` for SSR fetching.
- The CSR-only React hook `useCompositionData(...)` is the wrong tool inside `getServerSideProps` — use `studioClient.fetchCompositionData(...)` there. CSR pages keep using the hook.
- `clientRendererModeUtil.isInsideStudioFrame()` always returns `false` on the server. Use it (in a client component) to gate Visual Builder overlays.
- A composition can be looked up by `compositionUid` (preferred) or by `url`.

## Configuration / Structure

### Real exports used in SSR (from `@contentstack/studio-react`)

| Symbol | Kind | Purpose |
|---|---|---|
| `studioSdk` | singleton object | Has `.init({ stackSdk })` → returns a `studioClient` |
| `studioClient.fetchCompositionData(opts)` | method on the init return | Server-side composition fetch |
| `extractStyles(spec)` | function | Pulls the inline `<style>` block to ship to the client |
| `StudioComponent` | React component | Renders the resolved spec |
| `StudioComponentSpecOptions` | type | Shape of the spec passed to `<StudioComponent>` |
| `clientRendererModeUtil` | object | `.isInsideStudioFrame()` etc. — runtime detection helpers |

### Type: `CompositionQueryForSSR`

```ts
type CompositionQueryForSSR = CompositionQuery & {
  searchQuery: SearchQueryInput;
};

type CompositionQuery =
  | { compositionUid: string; url?: string }
  | { url: string; compositionUid?: string };

type SearchQueryInput = {
  [key: string]: string | string[] | undefined;
};
```

`searchQuery` replaces what the browser SDK would read from `window.location.search`. Forward the page's query string parameters as a plain object.

## How It Works

1. **Create the Delivery stack** (one-time, in a shared `studio.ts`).
2. **Initialize the Studio SDK** via `studioSdk.init({ stackSdk })` — also one-time, at module load. Export the returned client.
3. **Incoming request arrives** at `getServerSideProps` (Pages Router) or a server component (App Router).
4. **Call `studioClient.fetchCompositionData({ compositionUid, searchQuery })`** — `searchQuery` comes from `context.query` (Pages Router) or `searchParams` (App Router).
5. **Extract styles** via `extractStyles(studioProps.spec)` so the rendered HTML carries the inline stylesheet.
6. **Return** `{ studioProps, styleSheet }` as props.
7. **Render** `<StudioComponent specOptions={studioProps} />` in the page. Wrap the styleSheet in a `<style>` inside `<Head>`.

## Examples

### `src/studio.ts` — one-time SDK setup (shared)

```ts
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

export const studioClient = studioSdk.init({ stackSdk: stack });
```

### Next.js Pages Router — `getServerSideProps`

```tsx
// pages/index.tsx
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
  const studioProps = await studioClient.fetchCompositionData({
    searchQuery,
    compositionUid: "page",   // or use `url:` instead
  });
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

### Next.js App Router — server component page

```tsx
// app/[...slug]/page.tsx
import {
  StudioComponent,
  extractStyles,
  type StudioComponentSpecOptions,
} from "@contentstack/studio-react";
import { studioClient } from "@/lib/studio";

type Props = {
  params: { slug: string[] };
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

### Component registration (must happen before any fetch)

Component registration is independent of SSR vs CSR — it's a one-time module-load side effect. Register every custom component your composition references **before** any rendering or fetching happens.

```ts
// src/registry.ts — imported once at app start (in src/studio.ts or _app.tsx)
import { registerComponent, registerComponents } from "@contentstack/studio-react";
import HeroBanner from "@/components/HeroBanner";
import ProductCard from "@/components/ProductCard";

// Single
registerComponent("hero_banner", HeroBanner);
// Bulk
registerComponents({ product_card: ProductCard });
```

If a component isn't registered before `<StudioComponent>` tries to render the spec, the renderer can't map the component UID to a React component and either throws or skips the node.

### Gating Visual Builder overlays to client-only

`clientRendererModeUtil` is a helper object that detects whether the page is currently rendering inside the Visual Builder iframe. Use it in a client component:

```tsx
"use client";
import { clientRendererModeUtil } from "@contentstack/studio-react";

export function EditOverlay({ componentUid }: { componentUid: string }) {
  if (!clientRendererModeUtil.isInsideStudioFrame()) return null;  // no-op in SSR + production
  return <div data-cs-component={componentUid} className="cs-edit-overlay" />;
}
```

## Common Questions

**Should I call `useCompositionData` in `getServerSideProps`?**
No. `useCompositionData` is a React hook — it only works inside a component during render. For SSR fetching, call `studioClient.fetchCompositionData(...)` directly (it's a plain async function on the client returned from `studioSdk.init`).

**Why do I get "component not registered" errors?**
The component registration module was imported after the SDK tried to resolve the spec, or it was lazy-loaded. Import the registry module at the top of `studio.ts` (or wherever you call `studioSdk.init`), before any fetch.

**Do I need `searchQuery` even if I'm not using Live Preview?**
Yes — pass `{}` if there are no relevant query params. The SSR overload of `fetchCompositionData` requires it.

**Can I use both `compositionUid` and `url`?**
Yes — providing both lets the SDK use the UID as primary lookup and fall back to the URL slug, but one is usually sufficient.

**How does SSR work with Live Preview?**
Forward the `live_preview` and any related preview query params from the incoming request into `searchQuery`. The SDK includes them when calling the Delivery API, so the in-progress draft content is returned instead of the published version.

**Does the SSR fetch cache?**
The SDK does not apply HTTP caching by itself — `fetchCompositionData` is a plain fetch call. In Next.js you can wrap your `studio.ts` initialization or use `revalidate` on a wrapping `fetch` if you want to layer caching on top.
