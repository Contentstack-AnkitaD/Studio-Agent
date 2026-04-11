---
name: setup-live-preview
description: Configure Live Preview so users see draft CMS content changes in real-time in the Studio iframe
type: skill
agent: polaris-agent
triggers: ["live preview", "preview", "draft content", "real-time preview", "preview token"]
---

# Setup Live Preview

## When to Use

- "Set up live preview in my project"
- "I want to see draft changes in real-time"
- "Connect preview API"
- "Content changes aren't showing in Studio"

## What Live Preview Does

When a user edits a CMS entry in Contentstack, Live Preview pushes the draft changes to the Studio iframe in real-time — without publishing. The page re-renders with updated content as the user types.

## Step 1: Get Preview Credentials

The user needs from their Contentstack stack:
- **Preview Token** — found in Stack Settings → Tokens → Preview Tokens
- **Preview API Host** — depends on region (see table below)

| Region | Preview API Host |
|--------|-----------------|
| US (AWS) | `rest-preview.contentstack.com` |
| EU (AWS) | `eu-rest-preview.contentstack.com` |
| Azure NA | `azure-na-rest-preview.contentstack.com` |
| Azure EU | `azure-eu-rest-preview.contentstack.com` |

## Step 2: Add Environment Variables

Add to `.env` or `.env.local`:

```bash
CONTENTSTACK_API_KEY=bltYOUR_STACK_API_KEY
CONTENTSTACK_PREVIEW_TOKEN=csYOUR_PREVIEW_TOKEN
CONTENTSTACK_PREVIEW_HOST=rest-preview.contentstack.com
CONTENTSTACK_ENVIRONMENT=production
```

## Step 3: Configure SDK

In the Studio config file (from `setup-sdk` skill):

```typescript
import { ComposableStudioSDK } from "@contentstack/composable-studio-sdk";

const sdk = new ComposableStudioSDK({
  components: registeredComponents,
  designTokens: designTokens,
  breakpoints: breakpoints,
  livePreview: {
    enable: true,
    host: process.env.CONTENTSTACK_PREVIEW_HOST,
  },
});

sdk.init();
```

## Step 4: Verify

1. Open the composition in Studio
2. Open the linked CMS entry in another tab
3. Edit a field in the CMS entry (e.g., change the title)
4. The Studio iframe should update in real-time without publishing

### If It Doesn't Work

| Issue | Fix |
|-------|-----|
| No updates appear | Check preview token is correct and matches the environment |
| CORS error | Ensure the preview host allows your app's domain |
| "Preview not available" | Entry must be saved (even as draft) at least once |
| Wrong content shows | Check `environment` matches between preview token and SDK config |
