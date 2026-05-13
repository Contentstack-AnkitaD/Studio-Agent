# Live Preview

Live Preview lets developers see CMS content changes in real-time inside their web application while an author edits an entry in Contentstack. When an author types in the CMS editor, the changes appear in the rendered page without requiring a publish or a manual refresh. It is the primary developer integration point for real-time editorial feedback loops.

## Key Concepts

- Powered by the `@contentstack/live-preview-utils` npm package.
- The CMS editor and the user's app communicate via `postMessage` across an iframe boundary.
- A preview hash ties the in-progress edit session to a delivery API request.
- Works in both Client-Side Rendering (CSR) and Server-Side Rendering (SSR) modes.
- In Studio's Visual Builder mode (`mode: "builder"`), additional frame coordination is required.
- The host page listens for messages from the CMS frame and re-fetches content using the hash as a header.

## Configuration / Structure

### Init config (pass to `ContentstackLivePreview.init()`)

```ts
import ContentstackLivePreview from "@contentstack/live-preview-utils";

ContentstackLivePreview.init({
  enable: true,
  stackDetails: {
    apiKey: "bltXXXXXXXXXXXXXXXX",
    environment: "preview",
  },
  clientUrlParams: {
    host: "cdn.contentstack.io",    // Delivery/preview host
  },
  stackSdk: Stack,                  // Contentstack JS SDK Stack instance
  ssr: false,                       // true if content is fetched server-side
  mode: "builder",                  // "builder" for Visual Builder, omit otherwise
});
```

| Option | Type | Description |
|---|---|---|
| `enable` | `boolean` | Activates live preview; set false to disable without removing config |
| `stackDetails.apiKey` | `string` | The Stack API key |
| `stackDetails.environment` | `string` | The environment to preview against |
| `clientUrlParams.host` | `string` | CMS host for preview API calls |
| `stackSdk` | `Stack` | Initialized JS SDK Stack instance used for content fetching |
| `ssr` | `boolean` | `false` for CSR apps; `true` for SSR where server fetches content |
| `mode` | `"builder"` \| `undefined` | Set to `"builder"` when running inside the Studio Visual Builder frame |

### URL parameters injected by the CMS editor

When an author opens the Live Preview panel, the CMS appends these query params to the Canvas URL:

| Param | Example | Purpose |
|---|---|---|
| `live_preview` | `live_preview=abc123hash` | Signals that live preview is active for this session |
| `hash` | `hash=abc123hash` | The preview session hash used in API requests |

### Request headers for preview API calls

When fetching content during a live preview session, include:

```
api_key: bltXXXXXXXXXXXXXXXX
live_preview: abc123hash
```

The `live_preview` header value is the hash extracted from the URL or postMessage data.

## How It Works

1. **Author opens Live Preview** in the CMS editor. The CMS loads the app's Canvas URL in an iframe, appending `live_preview=<hash>` and `hash=<hash>` as query parameters.
2. **App initializes** `ContentstackLivePreview.init()` once on load. The SDK reads the URL params and registers a `postMessage` listener on the `window`.
3. **Author edits** a field. The CMS editor broadcasts a `postMessage` to the iframe:
   ```json
   {
     "from": "live-preview",
     "type": "content-update",
     "data": { "hash": "abc123hash" }
   }
   ```
4. **SDK intercepts the message** (checks `from: "live-preview"`), extracts the hash, and calls the registered `onLiveEdit` callback or auto-refetches content using the hash as the `live_preview` header.
5. **App re-renders** with the updated content data. The author sees their changes instantly.
6. **App responds** to confirm receipt (builder mode):
   ```json
   {
     "from": "live-preview",
     "type": "client-data-send",
     "data": { "hash": "abc123hash" }
   }
   ```

### postMessage protocol summary

| Direction | `from` | `type` | Payload |
|---|---|---|---|
| CMS → App | `"live-preview"` | `"content-update"` | `{ hash: string }` |
| App → CMS | `"live-preview"` | `"client-data-send"` | `{ hash: string }` |

## Examples

### CSR React setup (Next.js App Router client component)

```tsx
"use client";
import { useEffect } from "react";
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import Stack from "@/lib/contentstack";

export function LivePreviewInit() {
  useEffect(() => {
    ContentstackLivePreview.init({
      enable: true,
      stackDetails: {
        apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!,
        environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!,
      },
      clientUrlParams: { host: "cdn.contentstack.io" },
      stackSdk: Stack,
      ssr: false,
      mode: "builder",
    });
  }, []);

  return null;
}
```

### Fetching content with the live preview hash

```ts
import { getSearchParams } from "@contentstack/live-preview-utils";

async function fetchEntry(uid: string) {
  const { live_preview } = getSearchParams();  // reads from URL

  const headers: Record<string, string> = {
    api_key: process.env.CONTENTSTACK_API_KEY!,
  };

  if (live_preview) {
    headers["live_preview"] = live_preview;
  }

  const response = await fetch(
    `https://cdn.contentstack.io/v3/content_types/blog_post/entries/${uid}`,
    { headers }
  );

  return response.json();
}
```

### SSR — passing the hash server-side

```ts
// app/page.tsx (Next.js server component)
export default async function Page({
  searchParams,
}: {
  searchParams: { live_preview?: string; hash?: string };
}) {
  const hash = searchParams.live_preview ?? searchParams.hash;

  const entry = await fetchEntry("bltXXX", hash);
  return <MyPage entry={entry} />;
}
```

When `ssr: true` is set in the init config, the SDK skips URL-based hash detection and relies on the server passing the hash through its own mechanism.

## Common Questions

**Do I need Live Preview in production?**
No. Set `enable: false` or omit the init call entirely in production builds. The hash params will not be present outside of the CMS editor context.

**What is the difference between `live_preview` and `hash` URL params?**
They carry the same session hash value. Both are appended for compatibility with different SDK versions. Use whichever your SDK version's helper (`getSearchParams`) exposes.

**Why does my preview not update when I type?**
Common causes: (1) `init()` was not called, (2) the `stackSdk` instance is not configured for the preview environment, (3) CORS or CSP headers are blocking the postMessage, (4) the Canvas URL in the project settings does not match the running app URL.

**Can I use Live Preview without the `@contentstack/live-preview-utils` package?**
Technically yes — you can listen for `message` events manually and check `event.data.from === "live-preview"`. But the package handles hash extraction, SDK patching, and the response postMessage automatically, so it is strongly recommended.

**Does Live Preview work with ISR (Incremental Static Regeneration)?**
Live Preview bypasses the static cache by hitting the preview delivery endpoint directly with the hash header. ISR revalidation is not involved — the preview fetch is always live.

**What does `mode: "builder"` do?**
It enables additional Studio Visual Builder coordination: the SDK sends frame-level postMessages so the builder can track component hover/click events for its overlay UI. Omit this option if you are only using Live Preview outside of Studio.
