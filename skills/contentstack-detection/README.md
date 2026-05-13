# Contentstack Detection Skills

Read-only detection skills used by the studio-api backend's
`ContentstackScanService` to determine whether a generated Flux project has each
Contentstack product (CMS Delivery SDK, Live Preview, Studio) installed,
initialized, and wired into data flow.

## Skills

| Skill | File | Output block name |
|---|---|---|
| CMS delivery SDK | `cms-check/SKILL.md` | `<skill-result name="cms-check">` |
| Live Preview | `live-preview-check/SKILL.md` | `<skill-result name="live-preview-check">` |
| Studio SDK | `studio-check/SKILL.md` | `<skill-result name="studio-check">` |

## Skill contract (shared)

Every skill in this directory:

1. Runs **read-only** against the project at the current working directory.
2. Does NOT install, modify, build, run, or test anything.
3. Reads `_shared/known-packages.json` for product → npm-package-name mapping.
4. Emits exactly ONE `<skill-result name="<skill-name>">…</skill-result>` block
   at the end of its run, containing JSON that conforms to the
   `ProductDetectionSchema` shape (without the `overall` field — orchestrator
   derives that).

## Orchestrator invocation

The studio-api backend's `ContentstackScanService` (PR 3) sends ONE OpenCode
message that says, in effect:

> Use the three skills in `/opt/agent-files/skills/contentstack-detection/`.
> Run cms-check, then live-preview-check, then studio-check, against the
> project at the current working directory. Emit each result in its own
> `<skill-result>` block. Do not output anything else.

The orchestrator then parses the three `<skill-result>` blocks, validates each
against `ContentstackScanResultSchema` from
`composable-studio-api-studio-api/src/app/studio-ai/dto/contentstack-scan.dto.ts`,
derives `overall` per product, and persists the merged result on the project.

## Updating package names

If Contentstack renames a package (e.g. a Studio package), update only
`_shared/known-packages.json`. Skills read it at runtime — no skill edits
needed.
