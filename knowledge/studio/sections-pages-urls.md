# Sections, Pages & URL Patterns — Full Reference

## Composition Types

### Page Composition

A full page rendered at a URL. Top-level structure:

```json
{
  "uid": "blt_composition_uid",
  "title": "Home Page",
  "type": "page",
  "status": "draft",
  "locale": "en-us",
  "slug": "/",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T00:00:00.000Z",
  "composition": {
    "uid": "root-uid",
    "type": "page",
    "children": [
      {
        "uid": "section-1-uid",
        "type": "section",
        "props": { },
        "styles": { "desktop": { "spacing": { "paddingTop": "64px", "paddingBottom": "64px" } } },
        "children": [
          {
            "uid": "header-1-uid",
            "type": "header",
            "props": {
              "text": { "type": "string", "value": "Welcome" },
              "headingTag": { "type": "choice", "value": "h1" }
            },
            "styles": { "desktop": { "typography": { "fontSize": "3rem" } } }
          }
        ]
      }
    ]
  },
  "seo": {
    "title": "Home — My Site",
    "description": "Welcome to our website"
  },
  "dataSources": {
    "component_props": {},
    "template": {},
    "contentstack": {},
    "static_value": {}
  }
}
```

### Linked Composition

A composition linked to a Contentstack content type. Content comes from a CMS entry.

```json
{
  "uid": "blt_composition_uid",
  "title": "Blog Post Template",
  "type": "page",
  "connected_content_type": "blog_post",
  "preview_entry_uid": "blt_entry_uid",
  "composition": { /* ... */ },
  "dataSources": {
    "template": {
      "title": "My Blog Post",
      "body": "<p>Content here...</p>",
      "author": [{ "uid": "bltauthor1", "name": "Jane", "_content_type_uid": "author" }],
      "featured_image": { "url": "https://images.contentstack.io/..." }
    }
  }
}
```

Key properties:
- `connected_content_type` — CT uid the composition is linked to
- `preview_entry_uid` — Entry used for preview data in Studio
- `dataSources.template` — Automatically populated from the preview entry
- Bindings use `type: "template"` to reference template entry fields

### Section Composition

Reusable block shared across pages. No `slug` or `seo`.

```json
{
  "uid": "blt_section_uid",
  "title": "Global Header",
  "type": "section",
  "composition": {
    "uid": "root-uid",
    "type": "section",
    "children": [
      {
        "uid": "nav-uid",
        "type": "navigation",
        "props": { /* ... */ }
      }
    ]
  }
}
```

### Standalone Composition

Not linked to any CT. All data is static or from manually pinned entries.

## Composition JSON Node Format (TOON)

Every node in the composition tree follows this structure:

```typescript
interface NodeDto {
  uid: string;                          // Unique identifier
  type: string;                         // Component type (matches registered component)
  attrs?: Record<string, unknown>;      // System attributes
  metadata?: Record<string, unknown>;   // Display metadata (label, locked, hidden)
  props?: Record<string, NodeProp>;     // Component props with types and values
  slots?: Record<string, NodeDto[]>;    // Named slots containing child nodes
  styles?: Record<string, NodeStyle>;   // Breakpoint-keyed styles
}
```

### Props Format

Props in the composition JSON carry type information:

```json
{
  "props": {
    "text": {
      "type": "string",
      "value": "Hello World"
    },
    "showBorder": {
      "type": "boolean",
      "value": true
    },
    "columns": {
      "type": "number",
      "value": 3
    },
    "alignment": {
      "type": "choice",
      "value": "center"
    },
    "heroImage": {
      "type": "imageurl",
      "value": "https://images.contentstack.io/..."
    },
    "ctaUrl": {
      "type": "href",
      "value": "/about"
    }
  }
}
```

### Bound Props Format

When a prop is bound to a data source, it has a `binding` field:

```json
{
  "props": {
    "text": {
      "type": "string",
      "value": "Fallback text",
      "binding": {
        "type": "template",
        "value": {
          "path": { "title": {} }
        }
      }
    },
    "heroImage": {
      "type": "imageurl",
      "value": "",
      "binding": {
        "type": "contentstack",
        "value": {
          "uid": "blt1234567890",
          "_content_type_uid": "blog_post",
          "path": { "featured_image.url": {} }
        }
      }
    }
  }
}
```

### Slots Format

Slots are NAMED arrays of child nodes (not `children`):

```json
{
  "uid": "grid-uid",
  "type": "grid",
  "props": {
    "columns": { "type": "number", "value": 3 }
  },
  "slots": {
    "children": [
      { "uid": "card-1", "type": "card", "props": { } },
      { "uid": "card-2", "type": "card", "props": { } },
      { "uid": "card-3", "type": "card", "props": { } }
    ]
  }
}
```

**Note:** In the SDK internal format, `children` is a flat array (Slate-like). In the DTO/TOON format sent to AI, slots are a `Record<string, NodeDto[]>`. The `vibeChangesApplier` handles conversion between formats.

## URL Patterns

### Studio Editor URLs
```
/studio/{stack_api_key}/compositions/{composition_uid}
/studio/{stack_api_key}/compositions/{composition_uid}?locale=fr-fr
```

### Studio AI URLs (no stack)
```
/studio-ai/canvas?projectUid={project_uid}
```

### Preview URLs (SDK iframe)
```
https://{app-domain}/?cs_studio=true&cs_composition_uid={uid}
https://{app-domain}/{slug}?cs_studio=true&cs_composition_uid={uid}&cs_preview=true
```

### Published Page URLs
```
https://{app-domain}/                    → slug: "/"
https://{app-domain}/about               → slug: "/about"
https://{app-domain}/blog/my-first-post  → slug: "/blog/my-first-post"
```

## Composition Lifecycle

```
Draft → Published → (Updated → Re-published)
                  → (Unpublished → Draft)
```

- **Draft** — Being edited in Studio. Not visible to end users.
- **Published** — Live. Published to a specific environment + locale.
- **Unpublished** — Removed from live site. Still exists as draft in Studio.

## Data Sources Structure

The `dataSources` object in a composition holds resolved data:

```json
{
  "dataSources": {
    "component_props": {
      "node-uid-1": {
        "text": "Default heading",
        "showBorder": false
      }
    },
    "template": {
      "title": "My Blog Post",
      "body": "<p>Content...</p>",
      "author": [{ "uid": "bltauth1", "name": "Jane" }],
      "featured_image": { "url": "https://..." }
    },
    "contentstack": {
      "blog_post": {
        "blt1234567890": {
          "title": "Pinned Entry",
          "body": "..."
        }
      }
    },
    "static_value": {
      "sv_abc123": "Static text value"
    },
    "contentstack_queries": {
      "query_uid_1": {
        "entries": [
          { "uid": "bltentry1", "title": "Result 1" },
          { "uid": "bltentry2", "title": "Result 2" }
        ]
      }
    }
  }
}
```

## Vibe Context (What AI Receives)

The Vibe AI agent receives a `VibeContext` built by `vibeContextBuilder.ts`:

```typescript
interface VibeContext {
  composition: NodeDto;                          // Full composition tree
  components: ComponentDefinitionDto[];          // Available component definitions
  registeredComponents?: RegisteredComponentMetadata[];  // Detailed prop metadata
  templateEntry?: PageDataEntryDto;              // Template entry data (if linked)
  linkedEntries?: PageDataEntryDto[];            // Pinned entries
  designTokens?: DesignTokensDto;                // Registered design tokens
  locator?: LocatorDto;                          // Currently selected component
  compositionUid?: string;
  projectUid?: string;
  stackUid?: string;
  organizationUid?: string;
  userId?: string;
}
```

The context is embedded in the user message as XML blocks:
```xml
<composition>
  { JSON composition tree }
</composition>

<registered_components>
  { component metadata with props }
</registered_components>

<design_tokens>
  { token definitions }
</design_tokens>

<page_data>
  { template entry + linked entries }
</page_data>
```

## Agent Rules

1. Page compositions must have `slug` and `seo` metadata
2. Section compositions don't have `slug` or `seo`
3. Linked compositions use `template` data source for content binding
4. All node UIDs must be unique within a composition
5. Props must include `type` and `value` fields
6. Slots use `Record<string, NodeDto[]>` format (named slots, not flat children)
7. Styles are keyed by breakpoint ID — always include `desktop` at minimum
8. When creating new nodes, always generate unique UIDs
9. System components (`page`) are the root — never create or remove them
