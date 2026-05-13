---
name: add-conditions
description: Add conditional visibility to a composition node — show or hide based on a CMS field value
type: skill
agent: polaris-assist
triggers: ["condition", "conditional", "show if", "hide if", "visibility", "condition-block", "only show when", "toggle based on", "if field equals"]
---

# Add Conditions — Conditional Visibility for Composition Nodes

## When to Use

User wants to show or hide content based on a CMS field value:
- "Only show the banner if the article is featured"
- "Hide this section when the category is 'draft'"
- "Show the sale badge if the discount is greater than 0"
- "Display this block only when the boolean field is true"

## Concept

Wrap any node in a `condition-block`. The block checks a `conditionBinding` (the field to compare against) and a `dataBinding` (the data context to expose to children when the condition is true). Children live inside the condition-block's slot and render only when the condition passes.

## Step 1: Choose Condition Type and Operator

| CMS Field Type | `condition.type` | Available Operators |
|----------------|-----------------|---------------------|
| Single-line / Multi-line Text | `string` | `eq`, `neq`, `contains`, `startsWith`, `endsWith`, `isEmpty`, `isNotEmpty` |
| Number | `number` | `eq`, `neq`, `gt`, `gte`, `lt`, `lte` |
| Boolean | `boolean` | `is`, `eq` |
| Select (dropdown) | `select` | `eq`, `neq`, `contains`, `isEmpty`, `isNotEmpty` |
| Array / Multi-select | `array` | `eq`, `neq`, `contains`, `isEmpty`, `isNotEmpty` |
| Modular Blocks | `modular_block` | `is`, `eq`, `lengthIs` |
| Reference | `reference` | `contentTypeIs`, `eq`, `lengthIs` |
| Date | `date` | `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `isEmpty`, `isNotEmpty` |
| File / Image | `image` | `isEmpty`, `isNotEmpty` |

## Step 2: Build the condition-block Node

The condition-block wraps children in its slot. The `conditionBinding` points to the field being tested; the `dataBinding` points to the data exposed to children when true.

```json
{
  "uid": "condition-block-123",
  "type": "condition-block",
  "metadata": {
    "condition": {
      "type": "string",
      "operator": "eq",
      "value": "featured",
      "conditionBinding": {
        "type": "template",
        "value": { "path": { "category": {} } }
      },
      "dataBinding": {
        "type": "template",
        "value": { "path": { "featured_content": {} } }
      }
    }
  },
  "props": {
    "children": { "type": "slot", "slot": "cb-slot-abc" }
  },
  "slots": {
    "cb-slot-abc": [
      /* child nodes rendered when condition is true */
    ]
  },
  "styles": {}
}
```

**Important:** `props.children.slot` and the key in `slots` must match exactly.

## Step 3: Apply the ADD Operation

Use the `add` operation to insert the condition-block into the target parent slot:

```json
{
  "operation": "add",
  "parentUid": "section-uid",
  "slotId": "section-slot",
  "index": 0,
  "node": {
    "uid": "condition-block-123",
    "type": "condition-block",
    "metadata": {
      "condition": {
        "type": "string",
        "operator": "eq",
        "value": "featured",
        "conditionBinding": {
          "type": "template",
          "value": { "path": { "category": {} } }
        },
        "dataBinding": {
          "type": "template",
          "value": { "path": { "featured_content": {} } }
        }
      }
    },
    "props": {
      "children": { "type": "slot", "slot": "cb-slot-abc" }
    },
    "slots": {
      "cb-slot-abc": [ /* child nodes */ ]
    },
    "styles": {}
  }
}
```

## Examples by Condition Type

### Boolean — Show if `is_published` is true
```json
{
  "condition": {
    "type": "boolean",
    "operator": "is",
    "value": true,
    "conditionBinding": {
      "type": "template",
      "value": { "path": { "is_published": {} } }
    },
    "dataBinding": {
      "type": "template",
      "value": { "path": { "is_published": {} } }
    }
  }
}
```

### Number — Show sale badge if discount > 0
```json
{
  "condition": {
    "type": "number",
    "operator": "gt",
    "value": 0,
    "conditionBinding": {
      "type": "template",
      "value": { "path": { "discount_percent": {} } }
    },
    "dataBinding": {
      "type": "template",
      "value": { "path": { "discount_percent": {} } }
    }
  }
}
```

### Modular Block — Inside a repeater, match block type
```json
{
  "condition": {
    "type": "modular_block",
    "operator": "eq",
    "value": "hero_section",
    "conditionBinding": {
      "type": "repeater",
      "value": {
        "repeaterUID": "sections-repeater",
        "path": { "_content_type_uid": {} }
      }
    },
    "dataBinding": {
      "type": "repeater",
      "value": {
        "repeaterUID": "sections-repeater",
        "path": { "hero_section": {} }
      }
    }
  }
}
```

### Reference — Show only if reference is of a specific content type
```json
{
  "condition": {
    "type": "reference",
    "operator": "contentTypeIs",
    "value": "author",
    "conditionBinding": {
      "type": "template",
      "value": { "path": { "linked_entry": {} } }
    },
    "dataBinding": {
      "type": "template",
      "value": { "path": { "linked_entry": {} } }
    }
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Mismatched slot UID between `props.children.slot` and `slots` key | They must be identical strings |
| Using `"type": "boolean"` with operator `"eq"` for a true/false check | Use `"operator": "is"` for boolean fields |
| Omitting `dataBinding` | Both `conditionBinding` and `dataBinding` are required |
| Putting children directly in `props` instead of in the slot | Children belong in `slots["<slot-id>"]` array |
| Using wrong operator for the field type | See type/operator table in Step 1 |
| Forgetting `"type": "modular_block"` for blocks fields | Blocks must use `modular_block` type, not `string` |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Children never render | Verify `conditionBinding` path resolves to an actual field — check for typos |
| Children always render regardless of condition | `conditionBinding` path may be returning `undefined` — condition evaluates loosely |
| "Slot not found" error | The slot UID in `props.children.slot` does not match the key in `slots` |
| Condition works but wrong data shows in children | Check `dataBinding` path — it controls what data context the children see |
| Modular block condition never matches | Ensure `value` matches the exact block type UID, and `conditionBinding` path is `_content_type_uid` |
