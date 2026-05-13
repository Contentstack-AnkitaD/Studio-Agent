---
name: duplicate-and-rebind
description: Duplicate a node (deep copy with new UIDs) and rebind it to a different data path or entry
type: skill
agent: polaris-assist
triggers: ["duplicate", "copy component", "clone", "rebind", "copy and change", "copy section", "duplicate card", "same layout different data"]
---

# Duplicate and Rebind — Copy a Node and Point It at New Data

## When to Use

User wants the same layout/component structure but driven by different data:
- "Duplicate this hero section and bind it to the second entry"
- "Copy this card and point it to the author data instead"
- "I want the same layout but for a different query result"
- "Clone this section and change the data source"

## Concept

Duplication is a **client-side operation**: deep-copy the node JSON, rotate ALL UIDs (every `uid` field and every slot key), update slot references in `props`, then update bindings to point to new data paths. Finally insert the new node with an ADD operation.

**Why rotate UIDs:** Composition nodes must have globally unique UIDs. If any UID is duplicated in the tree the composition will behave incorrectly.

## Step 1: Deep Copy the Source Node JSON

Read the full JSON subtree of the node to duplicate, including all nested children, slots, styles, and metadata.

## Step 2: Rotate ALL UIDs

Find every `"uid"` field and every slot key throughout the entire copied subtree. Replace each with a new unique ID (use nanoid — 21-character alphanumeric strings, or a similar unique generator).

**What to rotate:**

| Location | Example |
|----------|---------|
| Node `uid` field | `"uid": "hero-section-uid"` → `"uid": "hero-section-copy-abc12"` |
| Slot keys in `slots` object | `"slots": { "hero-slot-xyz": [...] }` → `"slots": { "hero-slot-new123": [...] }` |
| `props.children.slot` references | `"slot": "hero-slot-xyz"` → `"slot": "hero-slot-new123"` |
| Nested node UIDs (all depths) | Every child node `uid` must also be rotated |

**Example — before and after UID rotation:**

Before:
```json
{
  "uid": "hero-section-uid",
  "type": "box",
  "props": {
    "children": { "type": "slot", "slot": "hero-children-slot" }
  },
  "slots": {
    "hero-children-slot": [
      {
        "uid": "hero-heading-uid",
        "type": "header",
        "props": {
          "text": { "type": "string", "staticString": "Title" },
          "Tag": { "type": "choice", "staticString": "h1" }
        },
        "slots": {},
        "styles": {}
      }
    ]
  },
  "styles": {}
}
```

After (UIDs rotated, bindings not yet updated):
```json
{
  "uid": "hero-section-copy-k7mNp",
  "type": "box",
  "props": {
    "children": { "type": "slot", "slot": "hero-children-copy-Lx3Qr" }
  },
  "slots": {
    "hero-children-copy-Lx3Qr": [
      {
        "uid": "hero-heading-copy-Wz9Yt",
        "type": "header",
        "props": {
          "text": { "type": "string", "staticString": "Title" },
          "Tag": { "type": "choice", "staticString": "h1" }
        },
        "slots": {},
        "styles": {}
      }
    ]
  },
  "styles": {}
}
```

## Step 3: Update Bindings to New Data Paths

Walk the copied JSON and update every `binding` object to point at the new data:

**Example — changing from one template field to another:**

Before:
```json
{
  "binding": {
    "type": "template",
    "value": { "path": { "primary_title": {} } }
  }
}
```

After (bound to a different field):
```json
{
  "binding": {
    "type": "template",
    "value": { "path": { "secondary_title": {} } }
  }
}
```

**Example — changing from template binding to a pinned entry (contentstack):**

```json
{
  "binding": {
    "type": "contentstack",
    "value": {
      "uid": "blt9876543210fedcba",
      "_content_type_uid": "author",
      "path": { "name": {} }
    }
  }
}
```

**Example — changing to a different query data source:**

```json
{
  "binding": {
    "type": "contentstack_queries",
    "value": {
      "queryUID": "query_002",
      "path": { "entries.title": {} }
    }
  }
}
```

## Step 4: Insert with ADD Operation

Insert the fully prepared duplicate using an `add` operation:

```json
{
  "operation": "add",
  "parentUid": "page-root-uid",
  "slotId": "main-slot",
  "index": 1,
  "node": {
    "uid": "hero-section-copy-k7mNp",
    "type": "box",
    "props": {
      "children": { "type": "slot", "slot": "hero-children-copy-Lx3Qr" }
    },
    "slots": {
      "hero-children-copy-Lx3Qr": [
        /* rotated and rebound children */
      ]
    },
    "styles": {}
  }
}
```

## Full Checklist

- [ ] Deep copied the entire node subtree (not a shallow copy)
- [ ] Every node `uid` in the copy is new and unique
- [ ] Every slot key in `slots` objects is new and unique
- [ ] Every `props.children.slot` value matches the corresponding new slot key
- [ ] Every `binding.value.repeaterUID` (if any) updated if the repeater UID changed
- [ ] Bindings updated to point to the intended new data path
- [ ] Static fallback values (`staticString`) updated if appropriate
- [ ] ADD operation references the correct parent UID and slot

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Rotating node UIDs but not slot UIDs | Slot keys in `slots` AND `props.children.slot` references must both be rotated |
| Rotating slot keys but not updating `props.children.slot` | The slot reference in `props` must match the new slot key |
| Forgetting nested children UIDs | Every node at every depth needs a new UID |
| Not updating `repeaterUID` references | If a repeater UID changed, all child bindings using `repeaterUID` must be updated |
| Inserting with old `parentUid` from source | Set `parentUid` to the actual intended parent for the duplicate |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Duplicate renders blank / shows fallback only | Binding paths not updated — old paths don't exist in new data context |
| "Duplicate UID" error | At least one UID in the copied subtree was not rotated |
| Slot children don't appear | `props.children.slot` value doesn't match the key in `slots` after rotation |
| Repeater children show wrong data | `repeaterUID` in child bindings still references the original repeater UID |
| Original node also changed appearance | You modified the original instead of the copy — work only on the deep copy |
