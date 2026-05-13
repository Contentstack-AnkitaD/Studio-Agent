---
name: contentstack-live-preview-check
description: Detect whether a project has Contentstack Live Preview installed, initialized, and actively wired (onEntryChange or live_preview config). Reports a structured 3-step pipeline verdict. Pure detection — does not modify any files.
type: skill
agent: polaris
invoked-by: backend-orchestrator
output-contract: <skill-result name="live-preview-check">{...json...}</skill-result>
---

# Live Preview Detection Skill

You are running a **read-only** check at the current working directory. Do NOT install dependencies. Do NOT modify files. Do NOT run build/dev/test commands.

## Scope

| Step | Question |
|---|---|
| `installed` | Is `@contentstack/live-preview-utils` (or alias) in `package.json` AND in a lockfile? |
| `initialized` | Is `ContentstackLivePreview.init(...)` or `livePreview.init(...)` called in source? |
| `wired` | Is `onEntryChange(...)` / `onLiveEdit(...)` registered, OR is `live_preview` config block on the Stack init? |

Plus `framework` and `rendering` (same enums as cms-check).

## Detection procedure

### Step 1: `installed`

Same as cms-check Step 1, but the package list is the `live-preview` entry of `/opt/agent-files/skills/contentstack-detection/_shared/known-packages.json`.

### Step 2: `initialized`

Grep source dirs (`src/`, `app/`, `lib/`, `pages/`) for one of:

```
ContentstackLivePreview.init(
livePreview.init(
import ContentstackLivePreview from '@contentstack/live-preview-utils'
import { ContentstackLivePreview } from '@contentstack/live-preview-utils'
```

If the import exists but `.init(` does not, that's `"missing"` for initialized — the import alone is not enough.

### Step 3: `wired`

Live Preview has two wiring conventions:

**Path A — `onEntryChange` callback (CSR-style):**
Grep for:
```
onEntryChange(
onLiveEdit(
```
If a registered callback exists, the data flow is wired.

**Path B — `live_preview` config on Stack init (SSR-style for Next.js App Router):**
Grep for `Contentstack.Stack({` blocks (or equivalent from cms-check Step 2's pattern). Check if the options object contains a `live_preview:` key with at least `enable: true` and a `preview_token`.

The `wired` status is `"present"` if EITHER path is satisfied. Record evidence for whichever path matched (prefer Path A's evidence if both match).

### Rendering for Live Preview

- `"csr"` — only Path A matched.
- `"ssr"` — only Path B matched.
- `"mixed"` — both paths matched.
- `"unknown"` — neither matched but initialized was `"present"` (rare, possibly user is using a custom callback wrapper).

## Output contract

EXACTLY ONE block at the end:

```
<skill-result name="live-preview-check">
{
  "product": "live-preview",
  "framework": "<react|next|unknown>",
  "rendering": "<csr|ssr|mixed|unknown>",
  "steps": {
    "installed":   { "status": "...", "evidence": "..." },
    "initialized": { "status": "...", "evidence": "..." },
    "wired":       { "status": "...", "evidence": "..." }
  },
  "notes": "<optional, ≤140 chars>"
}
</skill-result>
```

Same JSON rules as cms-check.

## What this skill does NOT do

- Does not install packages.
- Does not modify any files.
- Does not run any commands beyond `cat`, `grep`, `find`.
- Does not call other skills.
- Outputs only the single `<skill-result>` block.
