# Contentstack CMS — Full Reference

## What is Contentstack?

Contentstack is a headless CMS. Content is stored in **Stacks** and delivered via REST APIs. Studio (the visual editor) sits on top of Contentstack to provide WYSIWYG editing.

## Core Concepts

### Stack
A workspace containing content types, entries, assets, environments, locales, and tokens. Identified by an API key (`bltXXXXXXXX`).

### Content Type (CT)
A schema defining content structure. Similar to a database table schema.

```json
{
  "content_type": {
    "uid": "blog_post",
    "title": "Blog Post",
    "description": "Blog articles",
    "schema": [
      {
        "uid": "title",
        "data_type": "text",
        "display_name": "Title",
        "field_metadata": { "_default": true },
        "mandatory": true,
        "unique": true
      },
      {
        "uid": "url",
        "data_type": "text",
        "display_name": "URL",
        "field_metadata": { "_default": true }
      },
      {
        "uid": "body",
        "data_type": "rich_text_editor",
        "display_name": "Body",
        "field_metadata": {
          "allow_rich_text": true,
          "rich_text_type": "advanced"
        }
      },
      {
        "uid": "author",
        "data_type": "reference",
        "display_name": "Author",
        "reference_to": ["author"],
        "field_metadata": { "ref_multiple": false }
      },
      {
        "uid": "featured_image",
        "data_type": "file",
        "display_name": "Featured Image",
        "field_metadata": {
          "image": true,
          "description": "Hero image for the blog post"
        }
      },
      {
        "uid": "tags",
        "data_type": "text",
        "display_name": "Tags",
        "multiple": true,
        "field_metadata": {}
      },
      {
        "uid": "publish_date",
        "data_type": "isodate",
        "display_name": "Publish Date"
      },
      {
        "uid": "is_featured",
        "data_type": "boolean",
        "display_name": "Featured?",
        "field_metadata": { "default_value": false }
      },
      {
        "uid": "category",
        "data_type": "text",
        "display_name": "Category",
        "enum": {
          "advanced": false,
          "choices": [
            { "value": "tech" },
            { "value": "business" },
            { "value": "design" },
            { "value": "culture" }
          ]
        }
      },
      {
        "uid": "related_links",
        "data_type": "link",
        "display_name": "Related Links",
        "multiple": true
      },
      {
        "uid": "sections",
        "data_type": "blocks",
        "display_name": "Page Sections",
        "blocks": [
          {
            "uid": "hero_section",
            "title": "Hero Section",
            "schema": [
              { "uid": "heading", "data_type": "text" },
              { "uid": "subheading", "data_type": "text" },
              { "uid": "background", "data_type": "file" }
            ]
          },
          {
            "uid": "content_section",
            "title": "Content Section",
            "schema": [
              { "uid": "title", "data_type": "text" },
              { "uid": "body", "data_type": "rich_text_editor" }
            ]
          }
        ]
      }
    ]
  }
}
```

### Field Types — Complete Reference

| `data_type` | Description | JSON Value Example | Binding Notes |
|-------------|-------------|-------------------|---------------|
| `text` | Single/multi-line string | `"Hello"` | Binds to `string`, `json_rte` |
| `rich_text_editor` | HTML or JSON RTE content | `"<p>Hello</p>"` or `{...}` | Binds to `json_rte`, `string` |
| `number` | Integer or float | `42`, `3.14` | Binds to `number`, `string` |
| `boolean` | true/false | `true` | Binds to `boolean` |
| `isodate` | ISO 8601 date string | `"2024-01-15T00:00:00.000Z"` | Binds to `datestring`, `string` |
| `file` | Asset reference | `{ "uid": "blt...", "url": "https://...", "filename": "hero.jpg" }` | Bind `.url` to `imageurl`/`href` |
| `reference` | Link to entry in another CT | `[{ "uid": "blt...", "_content_type_uid": "author" }]` | Use `include[]` to resolve, then bind sub-fields |
| `group` | Nested object | `{ "street": "123 Main", "city": "NYC" }` | Access via dot notation: `address.city` |
| `blocks` | Array of typed blocks (modular blocks) | `[{ "_content_type_uid": "hero", ... }]` | Use repeater for iteration |
| `json` | Freeform JSON | `{ "any": "structure" }` | Binds to `any` |
| `link` | URL with title | `{ "title": "Click", "href": "https://..." }` | `.href` → `href`, `.title` → `string` |
| `text` + `enum` | Select dropdown | `"tech"` | Binds to `choice` |

### Entry

An instance of a content type. Example:

```json
{
  "entry": {
    "uid": "blt1234567890abcdef",
    "title": "Getting Started with Studio",
    "url": "/blog/getting-started",
    "body": "<p>Studio is a visual page builder...</p>",
    "author": [
      {
        "uid": "bltauthor123456",
        "_content_type_uid": "author"
      }
    ],
    "featured_image": {
      "uid": "bltasset789",
      "url": "https://images.contentstack.io/v3/assets/bltstack123/bltasset789/hero.jpg",
      "filename": "hero.jpg",
      "content_type": "image/jpeg",
      "file_size": "245678",
      "title": "Hero Image"
    },
    "tags": ["tutorial", "studio", "getting-started"],
    "publish_date": "2024-01-15T00:00:00.000Z",
    "is_featured": true,
    "category": "tech",
    "related_links": [
      { "title": "Documentation", "href": "https://docs.contentstack.com" }
    ],
    "sections": [
      {
        "_content_type_uid": "hero_section",
        "heading": "Welcome to Studio",
        "subheading": "Build beautiful pages",
        "background": { "url": "https://..." }
      },
      {
        "_content_type_uid": "content_section",
        "title": "Features",
        "body": "<p>Drag and drop components...</p>"
      }
    ],
    "locale": "en-us",
    "created_at": "2024-01-10T00:00:00.000Z",
    "updated_at": "2024-01-15T12:00:00.000Z",
    "created_by": "bltuser123",
    "updated_by": "bltuser456"
  }
}
```

### Assets

Files stored in Contentstack (images, PDFs, videos):

```json
{
  "asset": {
    "uid": "bltasset789",
    "url": "https://images.contentstack.io/v3/assets/bltstack123/bltasset789/hero.jpg",
    "filename": "hero.jpg",
    "content_type": "image/jpeg",
    "file_size": "245678",
    "title": "Hero Image",
    "description": "Blog post hero image",
    "tags": ["hero", "blog"],
    "created_at": "2024-01-10T00:00:00.000Z"
  }
}
```

**CRITICAL:** When binding image/file fields to component props, ALWAYS append `.url` to the field path:
- Correct: `"featured_image.url"` → binds to `imageurl` prop
- Wrong: `"featured_image"` → returns the full asset object, not a URL string

## Tokens & Authentication

### API Key
Identifies the stack. Found in Stack Settings → API Credentials.
- Format: `bltXXXXXXXXXXXXXXXX` (starts with `blt`, 24 hex chars)
- Used in: `api_key` header

### Delivery Token
Read-only access to published content via CDA.
- Format: `csXXXXXXXXXXXXXXXXXXXXXXXX` (starts with `cs`)
- Used in: `access_token` header
- Scoped to: specific environment(s)

### Management Token
Read-write access for CMA operations.
- Format: `csXXXXXXXXXXXXXXXXXXXXXXXX` (starts with `cs`)
- Used in: `authorization` header
- Scoped to: specific permissions (read/write/delete per CT)

### Preview Token
Access to draft/unpublished content via Preview API.
- Format: `csXXXXXXXXXXXXXXXXXXXXXXXX`
- Required for: Live Preview in Studio

### Auth Token (user session)
Short-lived token from user login.
- Used in: `authtoken` header
- Obtained via: `/v3/user-session` endpoint

## Environments

Publishing targets. Content is published TO an environment and delivered FROM it.

```json
{
  "environment": {
    "uid": "bltenv123",
    "name": "production",
    "urls": [
      { "locale": "en-us", "url": "https://mysite.com" }
    ]
  }
}
```

Common setup: `development` → `staging` → `production`

CDA requires `environment` parameter:
```
GET /v3/content_types/blog_post/entries?environment=production
```

## Regions

Each region has its own API endpoints and data residency:

| Region | Code | CDA Base URL | CMA Base URL |
|--------|------|-------------|-------------|
| North America (AWS) | `us` | `https://cdn.contentstack.io` | `https://api.contentstack.io` |
| Europe (AWS) | `eu` | `https://eu-cdn.contentstack.com` | `https://eu-api.contentstack.com` |
| Azure North America | `azure-na` | `https://azure-na-cdn.contentstack.com` | `https://azure-na-api.contentstack.com` |
| Azure Europe | `azure-eu` | `https://azure-eu-cdn.contentstack.com` | `https://azure-eu-api.contentstack.com` |
| GCP North America | `gcp-na` | `https://gcp-na-cdn.contentstack.com` | `https://gcp-na-api.contentstack.com` |

## Locales

Content can be localized. Each entry can have locale-specific versions.

- Format: IETF language tags: `en-us`, `fr-fr`, `de-de`, `ja-jp`
- Master locale: The primary locale (usually `en-us`)
- Fallback chain: `fr-fr` → `fr` → `en-us` (master locale)
- Localized fields: Only fields marked "localize" can differ per locale
- Non-localized fields: Inherited from master locale

## Content Delivery API (CDA)

Read-only API for fetching published content.

### Get All Entries
```
GET /v3/content_types/{ct_uid}/entries
Headers: api_key, access_token (delivery token)
Query: environment (required), locale, include[], query
```

### Get Single Entry
```
GET /v3/content_types/{ct_uid}/entries/{entry_uid}
Headers: api_key, access_token
Query: environment (required), locale, include[]
```

### include[] — Resolving References

By default, reference fields return only UIDs. Use `include[]` to resolve:

```
GET /v3/content_types/blog_post/entries/blt123
  ?environment=production
  &include[]=author
  &include[]=sections.hero_section.background
```

This resolves referenced entries inline:
```json
{
  "author": [
    {
      "uid": "bltauthor123",
      "name": "Jane Doe",
      "bio": "...",
      "avatar": { "url": "https://..." }
    }
  ]
}
```

**How Studio auto-generates include[] paths:**
```
Binding path: "author.name"  →  include[] = ["author"]
Binding path: "sections.hero_section.hero_ref.bio"  →  include[] = ["sections.hero_section.hero_ref"]
```

The include path is everything up to (but not including) the final leaf field, stopping at reference boundaries.

### query — MongoDB-style Filtering

```
GET /v3/content_types/blog_post/entries
  ?environment=production
  &query={"is_featured": true, "category": "tech"}
```

Operators:
- `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`
- `$in`, `$nin` — array membership
- `$exists` — field existence
- `$regex` — regex match
- `$and`, `$or`, `$not` — logical

## Content Management API (CMA)

Read-write API for managing content:

```
POST   /v3/content_types/{ct_uid}/entries        — Create entry
PUT    /v3/content_types/{ct_uid}/entries/{uid}   — Update entry
DELETE /v3/content_types/{ct_uid}/entries/{uid}   — Delete entry
POST   /v3/content_types/{ct_uid}/entries/{uid}/publish — Publish
POST   /v3/content_types/{ct_uid}/entries/{uid}/unpublish — Unpublish
```

Headers: `api_key`, `authorization` (management token or authtoken)

## Preview API

Same as CDA but returns draft/unpublished content:

```
GET /v3/content_types/{ct_uid}/entries/{uid}
Headers: api_key, access_token (preview token)
Query: environment, locale, include[]
```

Used by Studio for Live Preview.

## Live Preview

Real-time preview of unpublished content changes in the SDK iframe:

1. User edits entry in Contentstack CMS
2. Contentstack sends preview event via `postMessage` to iframe
3. SDK intercepts event, fetches updated entry from Preview API
4. Page re-renders with draft content

Required:
- Preview token configured in SDK
- SDK initialized with `livePreview: true`
- Preview API base URL set
- Entry must be open in Contentstack editor

## Webhooks

Contentstack can send HTTP callbacks on content events:

- `entry.create`, `entry.update`, `entry.delete`
- `entry.publish`, `entry.unpublish`
- `asset.create`, `asset.update`, `asset.delete`
- `content_type.create`, `content_type.update`, `content_type.delete`

Webhook payload includes the full entry/asset data and event metadata.

## Agent Rules

1. All Contentstack UIDs start with `blt` — entries, assets, content types, environments
2. When binding to image/file fields, ALWAYS append `.url` to the path
3. Reference fields need `include[]` to resolve — binding system handles this automatically
4. Content is environment-specific — always know which environment you're working with
5. Localized content uses fallback chains — check master locale for complete data
6. CDA returns only published content; Preview API returns drafts
7. Modular blocks (`data_type: "blocks"`) contain `_content_type_uid` to identify the block type
8. Link fields have `.href` and `.title` sub-fields
9. Multiple fields (arrays) have `"multiple": true` in the schema
