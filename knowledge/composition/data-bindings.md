# Data Bindings in Compositions

## Priority Rule

When a prop has BOTH `staticString` AND `binding`: **binding wins**. staticString is ignored.

**Before modifying any prop:** Check for `binding` key first.

## Binding Types

### 1. Static String (no CMS data)

```json
{ "type": "string", "staticString": "Hello World" }
```

Use when no CMS data is available.

### 2. Template Binding (main page entry)

```json
{
  "type": "string",
  "staticString": "fallback",
  "binding": {
    "type": "template",
    "value": {
      "path": { "entry.title": {} }
    }
  }
}
```

Use for fields from the template/preview entry.

### 3. Contentstack Binding (linked entries)

```json
{
  "type": "string",
  "staticString": "fallback",
  "binding": {
    "type": "contentstack",
    "value": {
      "uid": "blt...",
      "_content_type_uid": "blog_post",
      "path": { "title": {} }
    }
  }
}
```

Required fields: `uid` (starts with "blt"), `_content_type_uid`, `path`.

### 4. Repeater Binding (inside repeater slots)

```json
{
  "binding": {
    "type": "repeater",
    "value": {
      "repeaterUID": "repeater-node-uid",
      "path": { "product_name": {} }
    }
  }
}
```

Children inside a repeater MUST use `binding.type: "repeater"` with matching `repeaterUID`.

### 5. Static Value (auto-generated)

**NEVER add manually.** The paste worker handles this for slots, tags, and variant defaults.

## Path Format Rules

Paths are single flat keys with dots:
- `{ "title": {} }` — simple field
- `{ "group.field": {} }` — nested group field  
- `{ "items.0.title": {} }` — array index
- `{ "hero_image.url": {} }` — image/file (MUST end with `.url`)

WRONG: `{ "items": { "0": {} } }` (nested objects)
CORRECT: `{ "items.0.title": {} }` (flat key)

## Image/File Paths

ALWAYS append `.url` to image/file fields:

- `"hero_image.url"` ✅
- `"hero_image"` ❌ (missing .url)
- `"card_image.url"` ✅
- `"reference.0.card_image.url"` ✅

## Validation Rules

- Use paths from PAGE DATA section ONLY (don't guess)
- Check PAGE DATA to verify path exists
- Check field TYPE (don't infer from name — "count" might be text, not number)
- If path doesn't exist → use staticString instead or ask user
- DO NOT use paths from conversation memory — always check current context
