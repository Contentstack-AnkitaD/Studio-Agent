---
name: contentstack-cms-check
description: Detect whether a project has Contentstack CMS Delivery SDK installed, initialized, and actively wired into data fetching. Reports a structured 3-step pipeline verdict. Pure detection — does not modify any files.
type: skill
agent: polaris
invoked-by: backend-orchestrator
output-contract: <skill-result name="cms-check">{...json...}</skill-result>
---

# CMS Detection Skill

You are running a **read-only** check on the project at the current working directory. Do NOT install dependencies. Do NOT modify any files. Do NOT run any build, dev, or test commands. Your only outputs are file reads, greps, and one structured JSON block at the end.

## Scope

You determine three boolean-ish facts about Contentstack CMS:

| Step | Question |
|---|---|
| `installed` | Is the CMS SDK declared in `package.json` AND resolved in a lockfile? |
| `initialized` | Is the SDK called somewhere in source — `Contentstack.Stack(...)`, `createClient(...)`, etc.? |
| `wired` | Is the initialized client actually used to fetch content — `.Entry(...)`, `.fetch(...)`, `.getEntries(...)`? |

You also detect:
- `framework`: `"react"` | `"next"` | `"unknown"`
- `rendering`: `"csr"` | `"ssr"` | `"mixed"` | `"unknown"`

## Detection procedure

### Step 1: `installed`

1. Read `package.json` at the project root.
2. Look in `dependencies` and `devDependencies` for any package in the CMS `primary` or `secondary` lists from `/opt/agent-files/skills/contentstack-detection/_shared/known-packages.json`.
3. If found, verify it also appears in whichever lockfile is present (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json`, `bun.lockb`).
4. Record:
   - `status: "present"` with `evidence` = `"package.json:<line> — <pkg>@<version>"` (line numbers required)
   - `status: "missing"` if no CMS package found in package.json
   - `status: "unknown"` if package found in package.json but lockfile inconclusive (rare)

### Step 2: `initialized`

Grep the source tree (default: `src/`, `app/`, `lib/`, `pages/` — whichever exist) for one of these patterns:

```
Contentstack.Stack(
contentstack.stack(
new contentstack.Client(
createClient({       (only when the file ALSO imports from `@contentstack/delivery-sdk`)
```

Stop at the first hit. Record:
- `status: "present"` with `evidence` = `"<filepath>:<line> — <matched fragment, ≤80 chars>"`
- `status: "missing"` if no matches found in any source dir
- `status: "unknown"` if a match exists but it's clearly commented-out or inside a string literal (look at the surrounding context)

### Step 3: `wired`

From the file identified in Step 2, find the variable name the init result is assigned to (e.g. `const stack = Contentstack.Stack(...)` → variable is `stack`).

Then grep for usages of that variable across the same source dirs:

```
<varname>.ContentType(
<varname>.Entry(
<varname>.fetch(
<varname>.query(
<varname>.getEntries(
<varname>.getEntry(
```

If the init was exported, also grep for usages of the **export name** in other files.

Record:
- `status: "present"` with `evidence` showing the first usage site
- `status: "missing"` if no usages found anywhere
- `status: "unknown"` if you can't reliably identify the variable name (e.g. it's destructured in a complex way)

### Framework + Rendering detection

- **Framework:** `"next"` if `next` is in package.json deps; else `"react"` if `react` is in deps; else `"unknown"`.
- **Rendering** (for Next.js only — non-Next projects emit `"csr"` or `"unknown"`):
  - Look at the file from Step 3. If it's in `app/**` and has NO `"use client"` directive → `"ssr"`.
  - If it has `"use client"` at the top, or it's in `components/**` imported by a client tree → `"csr"`.
  - If you found usages in both server and client files → `"mixed"`.
  - If you can't determine → `"unknown"`.

## Output contract

After all three steps, emit EXACTLY ONE block, nothing else after it:

```
<skill-result name="cms-check">
{
  "product": "cms",
  "framework": "<react|next|unknown>",
  "rendering": "<csr|ssr|mixed|unknown>",
  "steps": {
    "installed":   { "status": "<missing|present|unknown>", "evidence": "<file:line — fragment>" },
    "initialized": { "status": "<missing|present|unknown>", "evidence": "<file:line — fragment>" },
    "wired":       { "status": "<missing|present|unknown>", "evidence": "<file:line — fragment>" }
  },
  "notes": "<≤140 chars, optional, surface edge cases>"
}
</skill-result>
```

Rules for the JSON:
- All four required keys must be present (`product`, `framework`, `rendering`, `steps`) even if status values are `"missing"` or `"unknown"`.
- `evidence` field is OPTIONAL when `status` is `"missing"` or `"unknown"` — omit it then. Required when `status === "present"`.
- `notes` is OPTIONAL. Use it for one short observation (e.g. *"Initialized in two places — only the lib/cs.ts copy is used"*). Hard 140-char cap.
- Emit valid JSON. No comments, no trailing commas, no surrounding text.
- Do NOT compute the `overall` field — the orchestrator derives it.

## What this skill does NOT do

- Does not install packages.
- Does not modify any files.
- Does not run `npm install`, `npm run build`, `npm test`, or any other command beyond `cat`, `grep`, `find`.
- Does not call out to other skills.
- Does not output anything except the single `<skill-result>` block at the end.
