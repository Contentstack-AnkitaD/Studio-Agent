---
name: setup-cms
description: Wire Contentstack CMS Delivery SDK into the project. Reads stack credentials from runtime env vars (injected by Studio backend), mints a scoped delivery token via CMA, ensures the target environment exists, scaffolds the singleton client, writes .env.local, and verifies via a live CDN fetch. Read-and-write skill — modifies project files and calls Contentstack CMA.
type: skill
agent: polaris-agent
triggers:
  - "set up contentstack"
  - "wire up contentstack"
  - "install contentstack"
  - "add contentstack cms"
  - "connect to contentstack"
  - "set up cms"
  - "integrate contentstack delivery"
  - "install delivery sdk"
handoffs:
  before:
    - find-cms-tokens          # ONLY when runtime env vars are absent (e.g. local dev outside Studio)
  after:
    - scaffold-content-types
    - seed-entries
    - rewire-to-cms
    - setup-live-preview
---

# Set up Contentstack CMS

Wire Contentstack into the user's project using credentials already injected into the Railway runtime by the Studio backend. **Do not prompt the user for tokens** — the backend pushed everything we need as env vars at provisioning / "wire it up" time.

## Read this first — Scope

### IN scope
- Read stack credentials from runtime env vars
- Ensure the target environment exists in the stack (create if missing)
- Mint a delivery token scoped to that environment via CMA
- Install the Delivery SDK in the user's project
- Scaffold a singleton client at the framework-correct path
- Write `.env.local` with the framework-correct prefix
- Update `.gitignore`
- Verify with a live CDN fetch

### OUT of scope
| Concern | Skill |
|---|---|
| Create content types from hardcoded data | `scaffold-content-types` |
| Seed entries from hardcoded data | `seed-entries` |
| Replace hardcoded data with CMS fetches | `rewire-to-cms` |
| Real-time preview while editing | `setup-live-preview` |
| Runtime env vars are missing (rare — only outside Studio) | `find-cms-tokens` (fallback) |

---

## Phase 0 — Read runtime env vars

The Studio backend injects these into the runtime container at provisioning. Read them first — **before anything else, before any user prompt**:

| Required env var | Purpose |
|---|---|
| `CONTENTSTACK_API_KEY` | Stack identifier (the stack the user connected in Studio Step 1) |
| `CONTENTSTACK_CDN_HOST` | The Delivery CDN hostname for this build's region — e.g. `dev11-cdn.csnonprod.com`, `cdn.contentstack.io`, `eu-cdn.contentstack.com`. Passed to the SDK as the `host` option. **Authoritative signal — never guess this.** |
| `CONTENTSTACK_AUTH_TOKEN` | Org/user auth token. Used for **all CMA writes**: minting delivery token, creating environment, scaffolding/seeding |

Optional:
| Optional env var | Default if absent |
|---|---|
| `CONTENTSTACK_REGION` | Informational label only (`dev11`, `prod`, etc.). Use in logs / verify-step output. Do NOT use for SDK config — `CONTENTSTACK_CDN_HOST` is authoritative. |
| `CONTENTSTACK_TARGET_ENVIRONMENT` | `studio-flux` — a **dedicated environment** Polaris creates and owns. Keeps Studio's auto-wiring sandboxed away from the user's `production` content. |
| `CONTENTSTACK_BRANCH` | `main` (unset = stack default) |

**If any of the three required vars are missing**, the runtime was not configured by Studio. Hand off to `find-cms-tokens` (fallback path) and stop. Do not proceed.

**Deriving the CMA host:** Take `CONTENTSTACK_CDN_HOST` and replace the first `cdn` segment with `api`. Examples:
- `dev11-cdn.csnonprod.com`  → `dev11-api.csnonprod.com`
- `cdn.contentstack.io`       → `api.contentstack.io`
- `eu-cdn.contentstack.com`   → `eu-api.contentstack.com`
- `azure-na-cdn.contentstack.com` → `azure-na-api.contentstack.com`

In shell: `cma_host=$(echo "$CONTENTSTACK_CDN_HOST" | sed 's/cdn/api/')`. In Node: `cmaHost = cdnHost.replace(/cdn/, 'api')`. The replacement targets the first occurrence only.

**Never echo `CONTENTSTACK_AUTH_TOKEN` back in chat.** It's broad-scope. Mask all but the last 4 chars in any log/output.

---

## Required reading — sibling skills

`setup-cms` only handles Phase 1 of a four-phase chain. The other three phases live in **separate skill files** under `.../skills/cms/` — you must read each one before executing the corresponding phase, because the CMA payload shapes (content-type schema, entry shape, publish body) are documented there, not duplicated here:

- **Phase 2 — `scaffold-content-types.md`** — required reading before creating any content type. Includes the **mandatory `options.title` field** for content-type creation (CMA returns 422 if omitted) and the field-type mapping table.
- **Phase 3 — `seed-entries.md`** — required reading before creating entries. Includes the **exact publish payload shape** (`{"entry":{"environments":["<env name>"],"locales":["en-us"]}}` — env NAME as string, NOT uid or object). The CMA returns 422 with cryptic messages otherwise.
- **Phase 4 — `rewire-to-cms.md`** — required reading before modifying components. Includes the framework-specific fetch patterns (Pattern 1-7).

Read all four before starting. Don't try to execute Phase 2/3/4 from memory — the CMA payload details have caused multiple failed runs and the skill docs are the source of truth.

---

## Phase A — Silent detection (read-only, no prompts)

| Detect | How | Used for |
|---|---|---|
| Project root | `package.json` exists at cwd | STOP if missing |
| Framework | See **framework table** below | Picks env-var prefix and client file path |
| Language | `tsconfig.json` or `.ts/.tsx` files | Picks SDK install + client file extension |
| Package manager | Lockfile (`pnpm-lock.yaml` / `yarn.lock` / `bun.lockb` / else npm) | Install command |
| Existing scaffold | grep `package.json` for `@contentstack/delivery-sdk`; look for known client paths (`lib/contentstack.{server.,}{ts,js}`, `app/lib/contentstack.{server.,}{ts,js}`, `src/lib/contentstack.{ts,js}`); grep env files for `CONTENTSTACK_*` keys | See **scaffold detection** below |
| Git status | `git status --porcelain` | Warn if dirty before writing |

### Framework table

Check **in this order**; first match wins:

| Detection signal | Framework | Client path | Env-var prefix | Where to read env in client code |
|---|---|---|---|---|
| `react-router` (≥7) in deps **and** `app/` dir exists **and** `react-router.config.ts` exists | React Router 7 (framework mode, SSR) | `app/lib/contentstack.server.ts` | none — unprefixed `CONTENTSTACK_*` | `process.env.X` (server only) |
| `@remix-run/*` in deps | Remix | `app/lib/contentstack.ts` | none — unprefixed | `process.env.X` (server only) |
| `next` in deps | Next.js | `lib/contentstack.ts` (or `src/lib/...` if `src/` exists) | `NEXT_PUBLIC_CONTENTSTACK_*` | `process.env.X` |
| `astro` in deps | Astro | `src/lib/contentstack.ts` | none — unprefixed | `import.meta.env.X` |
| `react-scripts` in deps | CRA | `src/lib/contentstack.ts` | `REACT_APP_CONTENTSTACK_*` | `process.env.X` |
| `vite` + `react` in deps (no router above) | React + Vite (SPA) | `src/lib/contentstack.ts` | `VITE_CONTENTSTACK_*` | `import.meta.env.X` |
| `vue` + `vite` (no nuxt) | Vue + Vite | `src/lib/contentstack.ts` | `VITE_CONTENTSTACK_*` | `import.meta.env.X` |
| `nuxt` in deps | Nuxt | `composables/useContentstack.ts` | `NUXT_PUBLIC_CONTENTSTACK_*` | `useRuntimeConfig().public.X` |
| `@sveltejs/kit` in deps | SvelteKit | `src/lib/contentstack.server.ts` | none — unprefixed | `process.env.X` (server only) |
| `@angular/core` in deps | Angular | `src/app/contentstack.service.ts` | none — runtime config | `environment.X` from `src/environments/environment.ts` |
| anything else | Plain Node / unknown | `src/lib/contentstack.ts` | none | `process.env.X` |

**Coverage caveat — UNTESTED FRAMEWORKS:** Nuxt, SvelteKit, and Angular rows are inferred from each framework's documented env conventions but have **not** been exercised end-to-end against this skill. If the detected framework falls in this group, do the install + env-write steps but **stop before scaffolding the client**, surface the framework to the user, and ask them to confirm the path + import pattern before writing. Better to ask once than scaffold something idiomatically wrong.

**Validated frameworks** (exercised end-to-end against real Contentstack stacks and live dev servers): React Router 7 (framework mode SSR), Next.js App Router (server components, v16), Next.js Pages Router (`getStaticProps`, v16), React + Vite (CSR), Vue + Vite (CSR).

**React Router 7 ordering matters** — it brings in `vite` as a dep, but the SSR framework mode means env vars are read server-side without a build-time prefix. Detect it before the "Vite SPA" fallback.

### Scaffold detection

After framework detection, classify the existing CS state:

| State | Conditions | Action |
|---|---|---|
| **Green-field** (default for prompt-flow projects) | SDK not in deps **and** no client file at the framework path **and** no `CONTENTSTACK_*` in env files | Full flow: install, scaffold, write env, verify. **This is the primary path.** |
| **Partial / user-modified** | SDK in deps but no client file, OR client file but no env file, OR env file present with a real-looking (non-placeholder) delivery token already set | Summarize what's there and ask the user before overwriting. |

The template repo Studio's prompt flow clones (`sumit10/vite-test` today) ships **bare** — no SDK, no `lib/contentstack*`, no `.env.local`. Every prompt-flow project lands in green-field state. Don't expect a pre-scaffolded "top-up" state — it doesn't exist.

Report a one-line summary back to the user:
> *"Detected: React Router 7, TypeScript, npm. Green-field — installing SDK, scaffolding client, minting delivery token. Stack `blt…07`, env `studio-flux`."*

---

## Phase B — Provision delivery token + environment via CMA

The CMA host is `CONTENTSTACK_CDN_HOST` with `cdn` rewritten to `api` (see Phase 0). The CDN host itself goes to the SDK as the `host` option (see Step C-2).

Use `cmaHost = CONTENTSTACK_CDN_HOST.replace(/cdn/, 'api')` — no region table lookup needed.

Common headers for every CMA call (host = `cmaHost` from Phase 0):
```
api_key:        $CONTENTSTACK_API_KEY
authtoken:      $CONTENTSTACK_AUTH_TOKEN
Content-Type:   application/json
```

**Header name is `authtoken`, NOT `authorization`.** The user-session token Studio injects (the kind that starts with `blt`) is a Contentstack **authtoken** — sent via the `authtoken:` header. CMA returns 401 if you use `authorization:` with this kind of token. The `authorization:` header is reserved for **management tokens** (which we don't use in this flow). Live-validated: gpt-5-mini hit this on first try and had to switch headers to succeed.

### CMA error handling — don't bail on first failure

Every CMA call in Phases B-1, B-2, and the corresponding calls in `scaffold-content-types.md` / `seed-entries.md` will sometimes fail. **The right move is to read the status code, not to conclude "the CMA is unreachable."** Live-observed failure mode: a model successfully created the environment, hit one 422 on content-type creation, then bailed claiming "CMA unreachable" — even though the env existed in the stack as proof CMA worked moments earlier.

Decode CMA responses by status code:

| Status | Meaning | Action |
|---|---|---|
| 2xx | Success | Continue. |
| 401 / 403 | Auth wrong — bad `authtoken` or the token isn't authorized for this stack | Stop. Surface clearly. Don't retry. |
| 404 | Wrong resource path or stack — bad `api_key` or wrong CT/entry uid | Stop. Verify the path; surface. |
| 422 | Payload shape is wrong | Read the `errors` object in the response. **Re-read the relevant sibling skill** (scaffold-content-types.md / seed-entries.md) — the exact shape lives there. Don't guess. Then retry. |
| 429 | Rate-limited | Wait 1s, retry. Up to 3 attempts. |
| 5xx | Server error | Wait 2s, retry. Up to 3 attempts. |
| Network error (DNS, timeout, connection refused) | Genuine unreachability | Surface "CMA unreachable" only here. Don't conflate with the rows above. |

A single 422 means **this one call's payload was wrong**, not that the API is broken. Re-read the skill's exact example, fix the payload, retry. Same stack, same auth.

### Step B-1 — Ensure the dedicated Studio environment exists

Polaris always wires the project to a **dedicated environment** so its auto-generated content never lands in the user's `production` (or other hand-managed) environment. The target is `CONTENTSTACK_TARGET_ENVIRONMENT` if set, otherwise the literal string `studio-flux`.

`GET https://{cma-host}/v3/environments?query={"name":"<target>"}`

- If `environments.length >= 1`: reuse — capture `environments[0].uid`. (A previous `setup-cms` run on this stack already created it.)
- If empty, create:
  ```
  POST /v3/environments
  {
    "environment": {
      "name": "<target>",
      "urls": [{ "locale": "en-us", "url": "https://example.com/" }]
    }
  }
  ```
  Use the returned `environment.uid`. Tell the user briefly: *"Created a dedicated `studio-flux` environment for this project — your `production` env is untouched."*

If creation fails with anything other than 422-duplicate (race), stop and report.

### Step B-2 — Mint a fresh delivery token scoped only to the Studio env

The token is scoped to `<target>` (the env from Step B-1) only — it cannot read from `production` or any other environment. Always mint a fresh one; we do not have the plaintext of any previously-minted token (the API only returns it once at creation).

```
POST /v3/stacks/delivery_tokens
{
  "token": {
    "name":        "polaris-runtime-<short-random>",
    "description": "Auto-minted by Polaris setup-cms — scoped to the studio-flux environment",
    "scope": [
      {
        "module":       "environment",
        "environments": ["<target>"],
        "acl":          { "read": true }
      },
      {
        "module":       "branch",
        "branches":     ["<CONTENTSTACK_BRANCH or 'main'>"],
        "acl":          { "read": true }
      }
    ]
  }
}
```

**The `branch` scope is required.** CMA rejects the request with `422 scope.branch_or_alias is a required field` if omitted. Default branch is `main`; honor `CONTENTSTACK_BRANCH` if set.

The response contains `token.token` — that's the delivery token string (`cs…`). Capture it.

If the call returns 422 because a token with that name already exists, retry with a fresh `<short-random>` suffix.

**If minting fails (401/403):** the auth token isn't authorized for this stack. Surface the error to the user and stop — don't fall back to prompting; that's an env-injection bug, not a user problem. Report:
> *"Couldn't mint a delivery token — auth token isn't authorized for stack `blt…ef`. This usually means the runtime env vars are stale; refresh the project or re-run 'Connect Contentstack' from Studio."*

### Step B-3 — Cache the minted values in process memory

Keep `apiKey`, `deliveryToken`, `environment`, `cdnHost`, `branch` in scope for Phases C and the verify step. They will be written to `.env.local` in Step C-3.

---

## Phase C — Install + initialize + verify

### Step C-1 — Install the delivery SDK

Use the project's package manager:
```bash
npm install @contentstack/delivery-sdk      # npm
pnpm add @contentstack/delivery-sdk         # pnpm
yarn add @contentstack/delivery-sdk         # yarn
bun add @contentstack/delivery-sdk          # bun
```

After install, verify the entry is in `package.json` and the lockfile.

### Step C-2 — Create the singleton client

Path + read pattern come from the **framework table in Phase A**. Both the singleton-constant shape (`export const stack = ...`) and factory shape (`export function getContentstackStack()`) are valid — match the convention if anything similar exists in the codebase, otherwise default to the constant.

Server-only frameworks (React Router 7, Remix, plain Node) should use a `.server.ts` suffix on the client file when the framework's bundler recognizes it (RR7/Remix do — it guarantees the file never leaves the server bundle). Other frameworks use plain `.ts`.

The client passes `host` directly — works uniformly for prod and non-prod, no `Region` enum branching needed.

**Next.js example (TypeScript):**
```ts
// lib/contentstack.ts
import contentstack from '@contentstack/delivery-sdk';

export const stack = contentstack.stack({
  apiKey:        process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY!,
  deliveryToken: process.env.NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN!,
  environment:   process.env.NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT!,
  host:          process.env.NEXT_PUBLIC_CONTENTSTACK_CDN_HOST!,
  branch:        process.env.NEXT_PUBLIC_CONTENTSTACK_BRANCH || undefined,
});
```

**Vite SPA example (TypeScript) — works for both React + Vite and Vue + Vite:**
```ts
// src/lib/contentstack.ts
import contentstack from '@contentstack/delivery-sdk';

export const stack = contentstack.stack({
  apiKey:        import.meta.env.VITE_CONTENTSTACK_API_KEY,
  deliveryToken: import.meta.env.VITE_CONTENTSTACK_DELIVERY_TOKEN,
  environment:   import.meta.env.VITE_CONTENTSTACK_ENVIRONMENT,
  host:          import.meta.env.VITE_CONTENTSTACK_CDN_HOST,
  branch:        import.meta.env.VITE_CONTENTSTACK_BRANCH || undefined,
});
```
The client file is framework-agnostic for Vite SPAs — same code for React, Vue, Svelte (without Kit), or Preact. The framework-specific consumption pattern lives in `rewire-to-cms.md`.

**CRA example (TypeScript):**
```ts
// src/lib/contentstack.ts
import contentstack from '@contentstack/delivery-sdk';

export const stack = contentstack.stack({
  apiKey:        process.env.REACT_APP_CONTENTSTACK_API_KEY!,
  deliveryToken: process.env.REACT_APP_CONTENTSTACK_DELIVERY_TOKEN!,
  environment:   process.env.REACT_APP_CONTENTSTACK_ENVIRONMENT!,
  host:          process.env.REACT_APP_CONTENTSTACK_CDN_HOST!,
  branch:        process.env.REACT_APP_CONTENTSTACK_BRANCH || undefined,
});
```

**Astro example (TypeScript) — server-only (in `.astro` files or API routes):**
```ts
// src/lib/contentstack.ts
import contentstack from '@contentstack/delivery-sdk';

export const stack = contentstack.stack({
  apiKey:        import.meta.env.CONTENTSTACK_API_KEY,
  deliveryToken: import.meta.env.CONTENTSTACK_DELIVERY_TOKEN,
  environment:   import.meta.env.CONTENTSTACK_ENVIRONMENT,
  host:          import.meta.env.CONTENTSTACK_CDN_HOST,
  branch:        import.meta.env.CONTENTSTACK_BRANCH || undefined,
});
```
Astro reads server-side env via `import.meta.env` (server-only by default). No prefix needed unless the value must reach the client — then prefix with `PUBLIC_`.

**React Router 7 / Remix example (TypeScript) — server-only:**
```ts
// app/lib/contentstack.server.ts
//
// `.server.ts` suffix is a hard guarantee from React Router / Remix that this
// file never bundles into the client. Required because the delivery token
// (even though scoped read-only) shouldn't be shipped to the browser.
import contentstack from '@contentstack/delivery-sdk';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required Contentstack env var: ${name}`);
  return v;
}

export function getContentstackStack() {
  return contentstack.stack({
    apiKey:        requireEnv('CONTENTSTACK_API_KEY'),
    deliveryToken: requireEnv('CONTENTSTACK_DELIVERY_TOKEN'),
    environment:   requireEnv('CONTENTSTACK_ENVIRONMENT'),
    host:          requireEnv('CONTENTSTACK_CDN_HOST'),
    branch:        process.env.CONTENTSTACK_BRANCH || undefined,
  });
}
```

The factory shape (vs `export const stack`) is preferred for server-only frameworks — it defers SDK config until the first call, so missing env vars throw at request time with a clear error rather than at module import.

### Step C-3 — Write `.env.local`

Write a fresh `.env.local` with the framework-correct prefix from the Phase A table. Example for Next.js:
```bash
NEXT_PUBLIC_CONTENTSTACK_API_KEY=<apiKey>
NEXT_PUBLIC_CONTENTSTACK_DELIVERY_TOKEN=<deliveryToken from Step B-2>
NEXT_PUBLIC_CONTENTSTACK_ENVIRONMENT=<target>
NEXT_PUBLIC_CONTENTSTACK_CDN_HOST=<cdnHost>
# NEXT_PUBLIC_CONTENTSTACK_BRANCH=main   # uncomment if non-default
```

For React Router 7 / Remix / Astro / plain Node: same shape, no framework prefix (just `CONTENTSTACK_*`).

If `.env.local` already exists with conflicting `CONTENTSTACK_*` lines (this is the "partial / user-modified" state from Phase A's scaffold-detection table — rare for prompt-flow projects), ask the user before overwriting.

**Never** write `CONTENTSTACK_AUTH_TOKEN` to `.env.local`. That value stays in the runtime env only — it's a CMA write credential that the app code must never see.

### Step C-4 — Update `.gitignore`

If `.env.local` (or whichever file holds the tokens) isn't already ignored, append it. Never commit delivery tokens.

### Step C-5 — Verify with a live fetch

Run a one-shot Node script that hits the real CDN with the minted token. **Use Node's native `--env-file=` flag** (Node ≥ 20.6) — never assume `dotenv` is installed in the project (the template doesn't ship it).

```bash
node --env-file=.env.local -e '
import("@contentstack/delivery-sdk").then(({ default: cs }) => {
  const prefix = process.env.NEXT_PUBLIC_CONTENTSTACK_API_KEY ? "NEXT_PUBLIC_" :
                 process.env.VITE_CONTENTSTACK_API_KEY        ? "VITE_"         :
                 process.env.REACT_APP_CONTENTSTACK_API_KEY   ? "REACT_APP_"    : "";
  const stack = cs.stack({
    apiKey:        process.env[prefix + "CONTENTSTACK_API_KEY"],
    deliveryToken: process.env[prefix + "CONTENTSTACK_DELIVERY_TOKEN"],
    environment:   process.env[prefix + "CONTENTSTACK_ENVIRONMENT"],
    host:          process.env[prefix + "CONTENTSTACK_CDN_HOST"],
  });
  return stack.contentType("home").entry().find();
}).then(r => console.log("OK Connected. Entries fetched:", r.entries ? r.entries.length : 0))
  .catch(e => {
    // The SDK throws on a missing content type rather than returning an empty
    // result. That still proves connectivity — auth + host + env all worked,
    // the stack just has no `home` CT yet. Treat as success.
    if (/content type .* not found/i.test(e.message)) {
      console.log("OK Connected. Stack has no `home` content type yet — expected for a freshly wired project.");
      return;
    }
    console.error("FAIL", e.message);
    process.exit(1);
  });
'
```

Interpretation:
- "OK Connected. Entries fetched: N" → connectivity proven, stack has a `home` CT.
- "OK Connected. Stack has no `home` content type yet…" → connectivity proven; stack is empty. Expected after a fresh wire-up.
- 401 → minted delivery token is wrong (shouldn't happen — investigate; possibly the env didn't propagate from Studio).
- 404 → wrong api_key or environment.
- Network error → wrong CDN host.

**Don't try to verify by `curl`-ing the dev server's HTML for CSR apps** (Vite SPA, CRA, Vue+Vite). Their initial HTML is a JS shell — `curl` returns it before the SDK fetch runs, so it won't contain entry titles. Use the Node script above instead. For **SSR** frameworks (Next.js App Router, RR7, Remix, Astro), `curl` of the rendered page IS valid — the fetch runs server-side and titles land in the HTML before it's sent.

### Step C-6 — Report back

Tell the user in 2-3 sentences:
- Stack + region wired (mask api_key after first 4 chars: `blt…ef`)
- Environment used (created or pre-existing)
- Where the client lives + which env file got written
- Verification result

Then offer follow-ups:
> "CMS is wired. Want me to also: scaffold content types from your hardcoded data, seed entries from those, or replace hardcoded data with CMS fetches? (Or set up live preview for real-time editing.)"

---

## Constraints

- Do not prompt the user for tokens when env vars are present. Prompting is a regression — Studio injects everything.
- Do not modify any source files other than the singleton client (`lib/contentstack.{ts,js}`).
- Do not write `CONTENTSTACK_AUTH_TOKEN` to `.env.local` or any committed file. It's CMA-write-broad-scope and stays in the runtime env only.
- Do not edit `package.json` manually — use the package manager.
- Do not write to `.env.example` — it's a committed template.
- Do not start the dev server (`npm run dev`) — verification uses a one-shot script.
- On Vite: `process.env.X` does NOT work at runtime. Always use `import.meta.env.VITE_X` in the client file.
- Mask the auth token in all output. Mask the delivery token after the first creation moment.
