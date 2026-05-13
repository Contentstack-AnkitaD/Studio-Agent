---
name: seed-entries
description: Create Contentstack entries from hardcoded data in the user's project via CMA, then publish to the target environment. Uses CONTENTSTACK_AUTH_TOKEN from the runtime env — does not prompt. Read-and-write skill — calls Contentstack CMA. Does NOT modify project source.
type: skill
agent: polaris-agent
triggers:
  - "seed contentstack entries"
  - "import my mock data into contentstack"
  - "populate content types with my data"
  - "push hardcoded data to contentstack"
handoffs:
  before:
    - scaffold-content-types   # target CTs must exist first
  after:
    - rewire-to-cms            # swap component imports to CMS fetches
---

# Seed Contentstack Entries from Hardcoded Data

Hardcoded data exists in the project, matching content types exist in the stack, and now the data needs to live as entries. This skill creates one entry per row of source data, publishes them, and uses runtime env vars — **no token prompting**.

## Phase 0 — Read runtime env vars

Required:
- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_CDN_HOST`
- `CONTENTSTACK_AUTH_TOKEN`
- target environment = `CONTENTSTACK_TARGET_ENVIRONMENT` or `production`

If anything is missing, stop and report — don't prompt.

CMA host = `CONTENTSTACK_CDN_HOST` with `cdn` rewritten to `api` (e.g. `dev11-cdn.csnonprod.com` → `dev11-api.csnonprod.com`). `CONTENTSTACK_REGION`, if set, is a label only.

---

## Phase A — Confirm seed plan

Echo before any writes:

> "About to create entries:
> - Content type `feature` ← 4 rows from `src/data/features.ts`
> - Content type `testimonial` ← 6 rows from `src/data/testimonials.json`
>
> Each entry created in draft, then published to `production`. Continue?"

Allow the user to:
- Skip rows
- Override the derived `title` per row
- Choose not to publish (leave drafts)

---

## Phase B — Create entries

For each row in each source array:

```
POST https://{cma-host}/v3/content_types/{ct_uid}/entries
Headers:
  api_key:        $CONTENTSTACK_API_KEY
  authtoken:      $CONTENTSTACK_AUTH_TOKEN
  Content-Type:   application/json
Body:
  {
    "entry": {
      "title": "<derived>",
      <...mapped field values...>
    }
  }
```

### Title derivation rule (in order)

1. `title` field on the row
2. `name` field
3. `heading` or `label` field
4. `<ContentTypeName> <index+1>` (e.g. `Testimonial 1`)

User can override before writes begin.

### Field-value mapping

For each CT schema field, look up the matching `snake_case` key in the source row:
- `text` → string as-is
- `number` → numeric as-is
- `boolean` → boolean as-is
- `isodate` → if `Date` or ISO string, pass through; else `new Date(v).toISOString()`
- `link` → Contentstack's link field shape is `{ title, href }` (NOT `url`). If source is `{ url, title }`, remap to `{ title, href: url }`. If source is a plain URL string, wrap as `{ "title": "<url>", "href": "<url>" }`. CMA returns `119 link.href is not text` if you send `url` instead of `href`.
- `file` (asset) → **skip and warn** — auto-upload is out of scope. Optionally accept a fallback asset UID from the user to apply to all rows.
- `group` → recurse
- `modular_blocks` → map each array element to its block by shape; skip + report if ambiguous

### Rate-limit safety

Insert a 200ms delay between writes when batching >10. On HTTP 429, exponential backoff (1s, 2s, 4s) up to 3 retries.

### Idempotency

Before creating, query for an existing entry with the same title:

```
GET /v3/content_types/{ct_uid}/entries?query={"title":"<title>"}&limit=1
```

If a match exists, skip and report:
> "Skipped row 2 (`Fast performance`) — entry with that title already exists (uid `bltabc…ef`)."

If auth fails (401/403), stop and report — env-injection issue.

---

## Phase C — Publish

For each successfully created entry:

```
POST /v3/content_types/{ct_uid}/entries/{entry_uid}/publish
Headers:
  api_key:        $CONTENTSTACK_API_KEY
  authtoken:      $CONTENTSTACK_AUTH_TOKEN
  Content-Type:   application/json
Body:
  {
    "entry": {
      "environments": ["<target environment NAME, e.g. 'studio-flux'>"],
      "locales":      ["en-us"]
    }
  }
```

**The `environments` array takes the env NAME as a string** (e.g. `"studio-flux"`), NOT the environment uid. Passing uids returns 400. Live-validated: the gpt-5-mini run had to try multiple shapes before this one stuck. Same for `locales`: the locale code (`"en-us"`), not the locale uid.

Skip if user opted out of publishing in Phase A.

---

## Phase D — Report back

> "Seeded 10 entries (4 features + 6 testimonials), published to `production`. 2 fields skipped (`feature.icon` × 4 — asset uploads done manually).
>
> Next: update components to fetch this from Contentstack instead of the hardcoded source? (Runs `rewire-to-cms`.)"

---

## Constraints

- Use `CONTENTSTACK_AUTH_TOKEN` from env. Never prompt.
- Do not modify project source — hardcoded data stays until `rewire-to-cms` replaces it.
- Do not overwrite existing entries — only create. Conflicts skipped.
- Asset/file fields skipped with a warning. Auto-upload is out of scope.
- Localization out of scope — `en-us` master locale only.
- On publish failure, leave the entry as draft and report. Do not retry indefinitely.
- Never log or echo the auth token.
