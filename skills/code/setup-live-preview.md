---
name: setup-live-preview
description: Install and configure Live Preview Utils in a React/Next.js project so content changes appear in real-time in Studio
type: skill
agent: polaris-agent
triggers: ["live preview", "preview", "draft content", "real-time preview", "preview token", "live updates", "setup live preview", "contentstack live preview", "onEntryChange"]
---

# Setup Live Preview — Real-Time Draft Content in Studio

## When to Use

User wants to see CMS draft changes reflected instantly in Studio:
- "Set up live preview in my project"
- "I want to see draft changes in real-time"
- "Content edits aren't updating in the Studio iframe"
- "Configure live preview utils"
- "Add `onEntryChange` callback"

## What Live Preview Does

`@contentstack/live-preview-utils` listens for draft entry changes broadcast from the Contentstack CMS editor and triggers a callback in the project. The callback re-fetches the entry (with the delivery token swapped for preview token) and re-renders the page — without publishing.

## Step 1: Install the Package

```bash
npm install @contentstack/live-preview-utils
```

Verify:
```bash
ls node_modules/@contentstack/live-preview-utils
```

## Step 2: Add Environment Variables

Add to `.env` or `.env.local`:

```bash
NEXT_PUBLIC_CONTENTSTACK_API_KEY=bltYOUR_STACK_API_KEY
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=csYOUR_DELIVERY_TOKEN
NEXT_PUBLIC_CONTENTSTACK_PREVIEW_TOKEN=csYOUR_PREVIEW_TOKEN
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=production
NEXT_PUBLIC_CONTENTSTACK_REGION=us
```

Preview tokens are found in **Stack Settings → Tokens → Preview Tokens**.

| Region | `clientUrlParams.host` |
|--------|----------------------|
| US (AWS) | `rest-preview.contentstack.com` |
| EU (AWS) | `eu-rest-preview.contentstack.com` |
| Azure NA | `azure-na-rest-preview.contentstack.com` |
| Azure EU | `azure-eu-rest-preview.contentstack.com` |

## Step 3: Initialize ContentstackLivePreview in App Root

Create or update a live preview configuration file:

```typescript
// src/lib/live-preview.ts
import ContentstackLivePreview from "@contentstack/live-preview-utils";
import * as contentstack from "contentstack";

// Build the Stack SDK instance
const Stack = contentstack.Stack({
  api_key: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!,
  delivery_token: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!,
  environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!,
});

// Initialize Live Preview
ContentstackLivePreview.init({
  enable: true,
  stackDetails: {
    apiKey: process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!,
    environment: process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!,
  },
  clientUrlParams: {
    host: "rest-preview.contentstack.com", // use correct region host
  },
  stackSdk: Stack,
  ssr: false,
});

export { ContentstackLivePreview, Stack };
```

**Configuration options:**

| Option | Type | Description |
|--------|------|-------------|
| `enable` | boolean | Must be `true` to activate live preview |
| `stackDetails.apiKey` | string | Your stack's API key |
| `stackDetails.environment` | string | Active environment name |
| `clientUrlParams.host` | string | Preview API host for your region |
| `stackSdk` | Stack instance | Contentstack SDK stack instance |
| `ssr` | boolean | Set to `false` for client-side rendering (Next.js pages router or React) |

## Step 4: Call init in App Entry Point

**React (`src/App.tsx`):**
```tsx
import { useEffect } from "react";
import { ContentstackLivePreview } from "./lib/live-preview";

function App() {
  useEffect(() => {
    // ContentstackLivePreview.init() is called in live-preview.ts on import
    // No additional setup needed here
  }, []);

  return (
    <div>{/* your app */}</div>
  );
}
```

**Next.js App Router (`src/app/layout.tsx`):**
```tsx
"use client";
import { useEffect } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Dynamically import to ensure it only runs client-side
    import("../lib/live-preview");
  }, []);

  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Next.js Pages Router (`pages/_app.tsx`):**
```tsx
import type { AppProps } from "next/app";
import { useEffect } from "react";

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    import("../lib/live-preview");
  }, []);

  return <Component {...pageProps} />;
}
```

## Step 5: Set Up onEntryChange Callback

Add the callback on each page that should react to live preview changes. The callback re-fetches the entry and updates state:

```tsx
// src/pages/[slug].tsx  (or equivalent page component)
import { useEffect, useState } from "react";
import { ContentstackLivePreview } from "../lib/live-preview";

interface PageProps {
  entry: Record<string, unknown>;
}

export default function BlogPage({ entry: initialEntry }: PageProps) {
  const [entry, setEntry] = useState(initialEntry);

  useEffect(() => {
    // Register the re-fetch callback — called whenever CMS draft changes
    ContentstackLivePreview.onEntryChange(async () => {
      const updatedEntry = await fetchEntry(); // your existing fetch function
      setEntry(updatedEntry);
    });
  }, []);

  return (
    <article>
      <h1>{entry.title as string}</h1>
      {/* rest of page */}
    </article>
  );
}
```

**`onEntryChange` fires when:**
- User edits a field in the CMS entry editor
- User saves a draft
- Live preview is initialized for the first time on page load

## Step 6: Verify

1. Open the composition in Studio (it loads your app in an iframe)
2. Open the linked CMS entry in a separate tab
3. Edit a text field — the Studio iframe should update within 1–2 seconds without a full page reload

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Initializing on the server (SSR) | Set `ssr: false` and ensure `init()` only runs in `useEffect` or after `typeof window !== "undefined"` check |
| Wrong `clientUrlParams.host` for region | Use the correct region host from the table in Step 2 |
| Using delivery token instead of preview token | Preview token goes in `CONTENTSTACK_PREVIEW_TOKEN`; the SDK swaps it automatically when live preview is active |
| Calling `onEntryChange` outside `useEffect` | Must be inside `useEffect` so it registers after component mounts |
| Not re-fetching on change — only registering callback | The callback must actually call your fetch function and update state |
| `init()` called multiple times | Guard with a singleton check or call init only once in the app entry |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No updates appear when editing CMS | Verify `enable: true` and that `stackDetails.apiKey` is correct |
| CORS error in browser console | The preview host must allowlist your local dev domain |
| "ContentstackLivePreview is not defined" | Package not installed, or import path is wrong |
| `onEntryChange` never fires | Check that the entry in CMS is linked to the same URL the iframe is showing |
| Updates appear once, then stop | The `onEntryChange` callback overwrites previous registration — call it only once per page mount |
| `init()` throws "window is not defined" | You are calling init during SSR — move to a `useEffect` or dynamic import |
