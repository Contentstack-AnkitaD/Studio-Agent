---
name: contentstack-studio-check
description: Detect whether a project has Contentstack Studio SDK installed, initialized, and actively wired. Distinguishes CSR vs SSR integration. Pure detection — does not modify any files.
type: skill
agent: polaris
invoked-by: backend-orchestrator
output-contract: <skill-result name="studio-check">{...json...}</skill-result>
---

# Studio Detection Skill

You are running a **read-only** check at the current working directory. Do NOT install dependencies. Do NOT modify files. Do NOT run build/dev/test commands.

Studio integration patterns evolve with the official docs at https://www.contentstack.com/docs/studio. This skill leans on the `/opt/agent-files/skills/contentstack-detection/_shared/known-packages.json` `studio` entry for current package names — if a name changes, update that file (not this skill).

## Scope

| Step | Question |
|---|---|
| `installed` | Is a Studio SDK package present in `package.json` AND lockfile? |
| `initialized` | Is a Studio init call / provider mounted in source? |
| `wired` | Are Studio-tagged components or `data-cs-*` attributes / `useStudio()` / `<StudioProvider/>` present in the JSX tree? |

Plus `framework` (same as cms-check) and `rendering` (with Studio-specific semantics, below).

## Detection procedure

### Step 1: `installed`

Same as cms-check Step 1, using the `studio` entry of `_shared/known-packages.json`. Studio has multiple acceptable package names (primary + secondary); any one in `package.json` + lockfile makes this `"present"`.

### Step 2: `initialized`

Grep source for one of:

```
studioSdk                            (entry helper exported from @contentstack/studio-react)
extractStyles                        (used to inline SSR styles, also from @contentstack/studio-react)
StudioComponentSpec                  (component spec type / helper)
StudioProvider                       (JSX provider, when present)
useStudio(                           (React hook, when present)
import .* from '@contentstack/studio-react'
import .* from '@contentstack/studio-client'
```

Initialized is `"present"` if a call to `studioSdk(...)`/`extractStyles(...)` or a `<StudioProvider>` mount is found. Mere imports without usage count as `"unknown"` (not `"present"`).

### Step 3: `wired`

Studio is "wired" when content in the JSX tree is Studio-aware. Look for:

```
data-cs-                              (data attributes like data-cs-field, data-cs-entry)
useStudio(                            (hook called inside a component body)
<StudioField                          (Studio-specific JSX components)
<StudioSection
csTag(                                (helper from @contentstack/studio-react that emits data-cs- attributes)
```

If any of these are found in non-trivial JSX (i.e. a component that's actually rendered, not just exported and unused), wired is `"present"`. Otherwise `"missing"`.

### Rendering for Studio — important

Studio CSR vs SSR is determined by **where the init lives**, not by where the wired components live.

- `"csr"`: init is inside a `"use client"` boundary, or the project is plain React (CRA, Vite, no SSR).
- `"ssr"`: init is in `app/layout.tsx` server component, in middleware, in an RSC, or otherwise on the server tree.
- `"mixed"`: init found in BOTH server tree AND client boundary.
- `"unknown"`: init not found, OR found but boundary cannot be determined.

If `initialized` is `"missing"`, `rendering` MUST be `"unknown"` (you can't classify nothing).

## Output contract

EXACTLY ONE block at the end:

```
<skill-result name="studio-check">
{
  "product": "studio",
  "framework": "<react|next|unknown>",
  "rendering": "<csr|ssr|mixed|unknown>",
  "steps": {
    "installed":   { "status": "...", "evidence": "..." },
    "initialized": { "status": "...", "evidence": "..." },
    "wired":       { "status": "...", "evidence": "..." }
  },
  "notes": "<optional, ≤140 chars — e.g. 'CSR init detected but no <StudioProvider> in app tree'>"
}
</skill-result>
```

Same JSON rules as the other check skills.

## What this skill does NOT do

- Does not install packages.
- Does not modify any files.
- Does not run any commands beyond `cat`, `grep`, `find`.
- Does not call other skills.
- Outputs only the single `<skill-result>` block.
