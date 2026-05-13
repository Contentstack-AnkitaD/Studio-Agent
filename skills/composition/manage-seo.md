---
name: manage-seo
description: Read, set, or update SEO metadata (page title, description, OG image, meta tags) on a composition page
type: skill
agent: polaris-assist
triggers: ["seo", "meta title", "meta description", "page title", "open graph", "og image", "meta tags", "search engine", "keywords", "page metadata"]
---

# Manage SEO — Set Page Metadata

## When to Use

User wants to configure SEO or meta information for a page:
- "Set the page title for SEO"
- "Add a meta description"
- "Update the Open Graph image"
- "Add a keywords meta tag"
- "The page has no SEO settings"

## Where SEO Lives

SEO data lives on the **root page node** inside `metadata.seo`. It is NOT inside any slot or child node — always target the page root.

```json
{
  "uid": "page-root-uid",
  "type": "page",
  "metadata": {
    "seo": {
      "pageTitle": "My Page Title",
      "pageDescription": "Description shown in search engine results.",
      "openGraphImage": "https://example.com/og-image.jpg",
      "metaProps": [
        {
          "name": "keywords",
          "value": "studio, cms, web",
          "type": "text",
          "defaultValue": "",
          "previewValue": "studio, cms, web"
        }
      ]
    }
  }
}
```

## Step 1: Identify the Page Root UID

The page root is typically the top-level node in the composition. Look for `"type": "page"` in the composition JSON. Its `uid` is the `targetUid` for the MODIFY operation.

## Step 2: Set Core SEO Fields

Use a `modify` operation targeting the page root's `metadata.seo` path:

```json
{
  "operation": "modify",
  "targetUid": "page-root-uid",
  "changes": {
    "metadata": {
      "seo": {
        "pageTitle": "Blog Post | My Site",
        "pageDescription": "Learn about the latest trends in web development.",
        "openGraphImage": "https://cdn.example.com/og-blog.jpg",
        "metaProps": []
      }
    }
  }
}
```

**WARNING: MODIFY at `metadata` level replaces the entire `metadata` object.** Always include the full existing `metadata` content when modifying — add `seo` alongside any other existing metadata keys.

## Step 3: Add Custom Meta Props

`metaProps` is an array of additional `<meta>` tags. Each entry:

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | The meta tag `name` attribute (e.g. `"keywords"`, `"robots"`, `"author"`) |
| `value` | string | The meta tag `content` value |
| `type` | `"text"` or `"number"` | Value type — use `"text"` for most cases |
| `defaultValue` | string | Fallback value when `value` is empty |
| `previewValue` | string | Value shown in Studio preview (typically same as `value`) |

**Example — adding keywords and robots meta tags:**

```json
{
  "operation": "modify",
  "targetUid": "page-root-uid",
  "changes": {
    "metadata": {
      "seo": {
        "pageTitle": "Blog Post | My Site",
        "pageDescription": "Learn about the latest trends.",
        "openGraphImage": "https://cdn.example.com/og-blog.jpg",
        "metaProps": [
          {
            "name": "keywords",
            "value": "web, studio, contentstack",
            "type": "text",
            "defaultValue": "",
            "previewValue": "web, studio, contentstack"
          },
          {
            "name": "robots",
            "value": "index, follow",
            "type": "text",
            "defaultValue": "index, follow",
            "previewValue": "index, follow"
          },
          {
            "name": "author",
            "value": "Jane Doe",
            "type": "text",
            "defaultValue": "",
            "previewValue": "Jane Doe"
          }
        ]
      }
    }
  }
}
```

## Step 4: Bind SEO Fields to CMS Data (Optional)

SEO fields can reference dynamic CMS values. Use the `seo` object with binding notation instead of plain strings:

```json
{
  "metadata": {
    "seo": {
      "pageTitle": {
        "type": "string",
        "staticString": "Fallback Title",
        "binding": {
          "type": "template",
          "value": { "path": { "seo_title": {} } }
        }
      },
      "pageDescription": {
        "type": "string",
        "staticString": "",
        "binding": {
          "type": "template",
          "value": { "path": { "seo_description": {} } }
        }
      },
      "openGraphImage": {
        "type": "string",
        "staticString": "",
        "binding": {
          "type": "template",
          "value": { "path": { "og_image.url": {} } }
        }
      },
      "metaProps": []
    }
  }
}
```

## SEO Fields Reference

| Field | Description | Example Value |
|-------|-------------|---------------|
| `pageTitle` | `<title>` tag and OG title | `"Article Title | Site Name"` |
| `pageDescription` | `<meta name="description">` | `"Short description under 160 chars"` |
| `openGraphImage` | `<meta property="og:image">` — full URL | `"https://example.com/og.jpg"` |
| `metaProps` | Array of additional `<meta>` tags | See Step 3 |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Targeting a child node instead of page root | SEO is always on the `"type": "page"` root node |
| Omitting existing `metadata` keys when modifying | MODIFY replaces the full `metadata` object — preserve other keys |
| Using a relative URL for `openGraphImage` | Must be an absolute URL (starts with `https://`) |
| Setting `metaProps` as an object instead of an array | `metaProps` is always an array, even with a single entry |
| Forgetting `previewValue` in a metaProp | Include `previewValue` — set it to the same as `value` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| SEO changes are lost after save | Check the modify operation targets the correct page root UID |
| `pageTitle` not showing in browser tab | Ensure the frontend renders `metadata.seo.pageTitle` into `<title>` |
| OG image not appearing in social preview | Verify the URL is absolute and publicly accessible |
| Extra metadata keys disappeared | You replaced `metadata` without including existing keys — restore them |
| Bound SEO fields show `undefined` | Check the CMS field path — image fields need `.url` suffix |
