---
name: find-cms-tokens
description: Fallback-only skill. Triggers when runtime env vars from Studio are absent (e.g. local dev outside Studio). Walks the user through finding api_key / delivery_token / environment / region in the Contentstack UI and hands off to setup-cms with the collected values. Read-only — does not modify files.
type: skill
agent: polaris-agent
triggers:
  - "where do i find my contentstack api key"
  - "i don't have a delivery token"
  - "how do i get contentstack credentials"
  - "i need to create a delivery token"
  - "find my stack tokens"
handoffs:
  after:
    - setup-cms
---

# Find Contentstack CMS Tokens (Fallback)

**This skill is a fallback.** The normal flow assumes Studio injected `CONTENTSTACK_API_KEY`, `CONTENTSTACK_REGION`, and `CONTENTSTACK_AUTH_TOKEN` into the runtime — in which case `setup-cms` consumes them and the user is never prompted.

Use this skill **only** when those env vars are absent. Two realistic cases:
1. The runtime was launched outside Studio (e.g. someone running OpenCode locally on their own machine).
2. A Studio-side bug where credentials weren't injected — in which case the right fix is in Studio, not here, but we still need an escape hatch so the user can self-serve.

When this skill triggers, first surface why:
> "I don't see Contentstack credentials in the runtime environment. Either you're running outside Studio, or the project's stack binding hasn't synced. I can fall back to asking you for the values directly — or you can refresh the project from Studio and let it inject them. Which would you like?"

If they pick "refresh from Studio" — stop, point them at the Studio UI. Don't proceed.

If they pick "ask me directly" — continue below.

---

## Scope

### IN scope (fallback path)
- Explain what each credential is
- Point the user to the exact Contentstack UI location for each
- Validate format on paste
- Hand off to `setup-cms` with the collected values

### OUT of scope
| Concern | Where to go |
|---|---|
| Actually wiring the SDK | `setup-cms` |
| Creating a new stack / environment / token | Contentstack web UI — link the user there |
| Management Token | Not collected here; only Delivery Token. CMA-write skills require a Studio-injected auth token. |

---

## Phase A — Diagnose

Single consolidated question:

```yaml
request_type: cms_token_audit
question: "Which do you already have? Check all that apply."
fields:
  has_stack:           { type: boolean, label: "I have a Contentstack stack" }
  has_api_key:         { type: boolean, label: "I have the stack's API Key (starts with `blt…`)" }
  has_delivery_token:  { type: boolean, label: "I have a Delivery Token (starts with `cs…`)" }
  knows_environment:   { type: boolean, label: "I know which environment the token is scoped to" }
  knows_region:        { type: boolean, label: "I know my stack's region" }
```

Branch:
| Answer | Go to |
|---|---|
| `has_stack = false` | Phase B-0 — point to stack creation, stop |
| Missing api_key | Phase B-1 |
| Missing delivery_token | Phase B-2 |
| All four known | Phase C |

---

## Phase B — Guide

### B-0. No stack
> "You need a Contentstack stack first. Go to https://app.contentstack.com (or your regional URL), create one, then come back."
Stop.

### B-1. Find the API Key
> **UI:** your stack → Settings → Stack Settings → "API Key"
Format: `^blt[a-f0-9]{16,}$`. Validate on paste; ask again on mismatch.

### B-2. Find or create a Delivery Token
> **UI:** your stack → Settings → Tokens → Delivery Tokens
If empty, instruct them to click **+ New Token**, scope to read-only, pick the target environment, copy the `cs…` value (shown only once).
Format: `^cs[a-f0-9]{16,}$`.

### B-3. Environment
Ask which environment the token is scoped to. Default `production`.

### B-4. Region
Derive from sign-in URL:
| URL | Region |
|---|---|
| `dev11-app.csnonprod.com` (non-prod dev) | `dev11` |
| `app.contentstack.com` | `us-east` |
| `eu-app.contentstack.com` | `eu-central` |
| `azure-na-app.contentstack.com` | `azure-na` |
| `azure-eu-app.contentstack.com` | `azure-eu` |
| `gcp-na-app.contentstack.com` | `gcp-na` |

---

## Phase C — Validate + hand off

Re-validate formats. Echo a masked summary (last 4 chars of delivery token only):
> "Got it — api key `blt…ef`, delivery token `cs…7a`, environment `production`, region `us-east`. Wiring this up next."

Hand off to `setup-cms`, but **in fallback mode**: setup-cms will skip Phase B (CMA-mint) because we have no `CONTENTSTACK_AUTH_TOKEN`. It writes the user-supplied delivery token directly to `.env.local`. `scaffold-content-types` / `seed-entries` will be unavailable in this session (they require the auth token); tell the user so they're not surprised:

> "Note: since we're not inside Studio, content-type scaffolding and entry seeding aren't available — those need the management token Studio normally injects. Setup and rewire will work fine."

---

## Constraints

- Do not modify files in this skill.
- Do not ask for a Management Token. CMA writes aren't supported in the fallback path.
- Never echo the delivery token in full — mask after first 4 chars.
- If a regex fails twice in a row, stop and explain the format in detail instead of looping a third time.
- Stay quiet about this being "fallback" once the user has picked the path; just collect and hand off.
