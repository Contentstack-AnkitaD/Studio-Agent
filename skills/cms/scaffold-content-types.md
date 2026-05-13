---
name: scaffold-content-types
description: Read hardcoded data in the user's components (arrays, JSON files, mock data) and create matching Contentstack content types via CMA. Uses CONTENTSTACK_AUTH_TOKEN from the runtime env — does not prompt. Read-and-write skill — calls Contentstack CMA. Does NOT modify project source.
type: skill
agent: polaris-agent
triggers:
  - "create content types from my data"
  - "scaffold contentstack content types"
  - "turn this hardcoded array into a content type"
  - "generate content types from my mock data"
  - "set up content models in contentstack"
handoffs:
  before:
    - setup-cms                # SDK + .env.local must already exist; the api_key + auth-token env vars must be live
  after:
    - seed-entries             # populate the new CTs with the actual hardcoded values
    - rewire-to-cms            # replace hardcoded refs with CMS fetches
---

# Scaffold Contentstack Content Types from Hardcoded Data

The user's project has hardcoded data and wants those promoted to Contentstack content types. This skill scans for candidates, asks the user to confirm, and creates the CTs via CMA using credentials **already in the runtime env**.

## Phase 0 — Read runtime env vars

Required (injected by Studio backend, same as `setup-cms`):
- `CONTENTSTACK_API_KEY`
- `CONTENTSTACK_CDN_HOST`
- `CONTENTSTACK_AUTH_TOKEN`

If any are missing, the runtime wasn't configured by Studio — stop and report. **Do not** prompt the user for a management token; this flow assumes Studio injection.

CMA host = `CONTENTSTACK_CDN_HOST` with `cdn` rewritten to `api` (e.g. `dev11-cdn.csnonprod.com` → `dev11-api.csnonprod.com`). `CONTENTSTACK_REGION`, if set, is a label — use it in logs but not for CMA routing.

---

## Phase A — Discover hardcoded data

Scan project source, in priority order:

1. `src/data/`, `src/mocks/`, `src/content/`, `src/constants/` directories
2. `*.json` files under `src/` or `app/`
3. Top-level `const X = [...]` / `export const X = [...]` in `.ts/.tsx/.js/.jsx` whose value is an array of objects with consistent shape
4. Inline props (flag only — don't auto-scaffold)

For each candidate capture:
- File path + variable name (or JSON path)
- Shape: array-of-objects vs. single object
- Inferred Contentstack field types per the mapping below

### JS/TS → Contentstack field-type mapping

| Source type | Contentstack field type |
|---|---|
| `string` (short, < 256 chars) | `text` (single line) |
| `string` (long / contains `\n`) | `text` (multi-line); use `rte` if it looks like HTML/markdown |
| `string` matching URL regex | `link` |
| `string` matching ISO date | `isodate` |
| `number` (int or float) | `number` |
| `boolean` | `boolean` |
| `string[]` / `number[]` | `text` / `number` with `multiple: true` |
| Object `{ url, title }` or `{ href, title }` | `link` — note Contentstack stores this as `{ title, href }` at write time (see `seed-entries.md`) |
| Object `{ url, filename }` / image-like | `file` (asset ref) |
| **String** matching `.(jpg|jpeg|png|gif|webp|svg)$` or starting with `/` (relative public-asset path) | `text` (URL) — **NOT `file`**. CMA's `file` data_type requires an uploaded asset uid; if the source is just a path string like `/project1.jpg`, scaffold as `text`, and the rewire skill will render it via `<img src={entry.image}>`. Using `file` here would force `seed-entries` to skip the field (since asset upload is out of scope) and the rendered page would have broken images. |
| Nested object | `group` |
| Array of nested objects | `modular_blocks` if shapes vary, else `group` with `multiple: true` |

---

## Phase B — Present plan, get confirmation

Echo findings **before** any CMA write:

> "Found 3 candidates:
> - `src/data/features.ts` → array of `{ title, description, icon }` → content type **feature** (text, text, file)
> - `src/data/testimonials.json` → array of `{ name, quote, role, avatar }` → content type **testimonial** (text, text, text, file)
> - `src/components/Hero.tsx` inline props — flagged, not auto-scaffolded.
>
> Create both content types in stack `blt…ef`?"

Allow the user to rename, drop candidates, or proceed.

---

## Phase C — Create content types via CMA

For each confirmed candidate:

```
POST https://{cma-host}/v3/content_types
Headers:
  api_key:        $CONTENTSTACK_API_KEY
  authtoken:      $CONTENTSTACK_AUTH_TOKEN
  Content-Type:   application/json
Body:
  {
    "content_type": {
      "title":   "<Title Case Name>",
      "uid":     "<snake_case_uid>",
      "schema":  [ <field defs> ],
      "options": {
        "title":     "title",
        "is_page":   false,
        "singleton": <true if inferred singleton>
      }
    }
  }
```

### Schema construction rules

Always include the system fields at the top, then append inferred fields:
- `title` (text, mandatory, `field_metadata._default: true`)
- `url` (text, optional, `field_metadata._default: true`) — only for non-singleton CTs

Field UIDs are `snake_case`. Display names are humanized originals.

Example for `feature`:
```json
{
  "title": "Feature",
  "uid": "feature",
  "schema": [
    { "display_name": "Title",       "uid": "title",       "data_type": "text", "mandatory": true,  "field_metadata": { "_default": true } },
    { "display_name": "URL",         "uid": "url",         "data_type": "text", "mandatory": false, "field_metadata": { "_default": true } },
    { "display_name": "Description", "uid": "description", "data_type": "text", "mandatory": false, "multiline": true },
    { "display_name": "Icon",        "uid": "icon",        "data_type": "file", "mandatory": false }
  ],
  "options": { "title": "title", "is_page": false, "singleton": false }
}
```

**`options.title` is required.** It tells Contentstack which schema field acts as the entry's "title" (the value shown in the CMA UI's entries list, used for default display, etc.). Set it to the uid of your title field — typically `"title"`. Omitting it returns 422 with a non-obvious error message. Live-validated: gpt-5-mini hit this on first try and had to add the field to succeed.

### Conflict handling

If POST returns 422 "content type already exists" with that UID, **do not overwrite**. Report and ask whether to skip or PUT-merge missing fields onto the existing CT.

If the auth call returns 401/403, this is an env-injection problem — stop and report; don't prompt.

---

## Phase D — Report back

> "Created 2 content types in stack `blt…ef`:
> - `feature` (3 fields)
> - `testimonial` (4 fields)
>
> Next: seed entries from the original data? (Runs `seed-entries`.)"

---

## Constraints

- Use `CONTENTSTACK_AUTH_TOKEN` from env. Never prompt for a management token in this flow.
- Do not delete or overwrite existing content types — only create.
- Do not modify project source in this skill.
- Never log or echo `CONTENTSTACK_AUTH_TOKEN`. Mask if it must appear.
- Reference fields (one CT pointing at another) are out of scope — flag them; user wires references in the web UI.
- Asset uploads are out of scope — `file` fields are created but assets are not uploaded here.
