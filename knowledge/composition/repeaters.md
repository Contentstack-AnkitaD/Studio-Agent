# Repeater Components

## What Is a Repeater?

A repeater renders a list of items from CMS data. ONE template in the slot, auto-repeated for each data item.

## Structure

```json
{
  "uid": "rep-uuid",
  "type": "repeater",
  "props": {
    "items": {
      "type": "array",
      "binding": {
        "type": "template",
        "value": { "path": { "entry.products": {} } }
      }
    },
    "children": {
      "type": "slot",
      "slot": "slot-uuid"
    }
  },
  "slots": {
    "slot-uuid": [
      {
        "uid": "template-uuid",
        "type": "box",
        "props": {
          "title": {
            "type": "string",
            "binding": {
              "type": "repeater",
              "value": {
                "repeaterUID": "rep-uuid",
                "path": { "product_name": {} }
              }
            }
          }
        }
      }
    ]
  }
}
```

## Rules

1. Parent repeater's `items` prop uses `binding.type: "template"` pointing to array data
2. Children inside the slot MUST use `binding.type: "repeater"` with matching `repeaterUID`
3. Only ONE template in the repeater slot — it auto-repeats
4. NO `"item."` prefix in repeater paths — just the field name directly
5. `repeaterUID` MUST match the repeater node's `uid`
6. Slots is OBJECT format: `{ "slot-id": [...] }`

## Converting Static Sections to Repeaters

When user asks to "convert [section] to repeater":

1. Find the target section in composition JSON
2. Identify the template pattern (usually the first item)
3. REMOVE the original section
4. ADD new repeater at same location with:
   - `items` prop binding to the data array
   - ONE template item in the slot with repeater bindings
   - ALL children use `binding.type: "repeater"`

## Common Mistakes

- Creating new repeater when one already exists (add to existing instead)
- Nesting repeater inside repeater
- Creating repeater for static one-off items
- Using `"item.field"` prefix in paths (just use `"field"`)
- Mismatching `repeaterUID` with the repeater node's `uid`
