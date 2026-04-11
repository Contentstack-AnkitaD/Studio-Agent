---
name: remove-move-component
description: Remove a component from the composition or move it to a different position
type: skill
agent: polaris-assist
triggers: ["remove", "delete", "move", "swap", "reorder", "rearrange"]
---

# Remove / Move Component

## When to Use

- "Remove the second section"
- "Delete that button"
- "Move the header above the image"
- "Swap the two columns"

## Finding the Target Node

User describes nodes by description, not UID. To find the right node:

1. Read the current composition tree
2. Match by **type + position**: "the second button" = second node of type `button`
3. Match by **content**: "the heading that says Welcome" = header with `text.staticString === "Welcome"`
4. Match by **parent context**: "the image in the hero section" = image inside the section labelled/positioned as hero

## REMOVE Operation

```json
{
  "operation": "remove",
  "targetUid": "node-uid-to-remove"
}
```

**That's it.** Just the operation type and the target UID. The applier finds the node and removes it along with all its children.

### Examples

**Remove a single leaf node:**
```json
{ "operation": "remove", "targetUid": "btn-abc123" }
```

**Remove a section (and all its children):**
```json
{ "operation": "remove", "targetUid": "hero-section-uid" }
```
This removes the entire section including all nested boxes, headers, buttons, etc.

### Edge Cases

- **Removing the last child** of a slot is fine — the parent keeps its empty slot
- **Removing a parent** removes all descendants automatically
- **Removing a repeater** removes the repeater and its template children
- **Cannot remove the page root** — the root `page` node is permanent

## MOVE Operation

```json
{
  "operation": "move",
  "targetUid": "node-uid-to-move",
  "toParentUid": "destination-parent-uid",
  "toSlotId": "destination-slot-key",
  "toIndex": 0
}
```

**Note:** The applier currently uses `Object.keys(parentNode.slots)[0]` for the destination slot (first slot), so `toSlotId` may be ignored. But include it for correctness and forward compatibility.

### Move Within Same Parent (Reorder)

Move "the button" from position 2 to position 0 (first):
```json
{
  "operation": "move",
  "targetUid": "btn-uid",
  "toParentUid": "same-parent-uid",
  "toIndex": 0
}
```

### Move to Different Parent

Move a card from one section to another:
```json
{
  "operation": "move",
  "targetUid": "card-uid",
  "toParentUid": "target-section-box-uid",
  "toIndex": 0
}
```

### Swap Two Nodes

Swapping requires two MOVE operations. Move A to B's position, then B to A's old position:

```json
{
  "changes": [
    {
      "operation": "move",
      "targetUid": "node-a-uid",
      "toParentUid": "parent-uid",
      "toIndex": 1
    },
    {
      "operation": "move",
      "targetUid": "node-b-uid",
      "toParentUid": "parent-uid",
      "toIndex": 0
    }
  ]
}
```

**Important:** The applier processes changes in order: REMOVE → MOVE → MODIFY → ADD. Multiple MOVEs in one batch are processed sequentially, so indices shift. Account for this when swapping.

### Edge Cases

- **UIDs are preserved** on MOVE — the node keeps its UID (no regeneration)
- **Children move with parent** — moving a section moves everything inside it
- **Moving across slot types** works but ensure the destination parent has slots

## Combining Remove + Add (Replace)

To replace a component with a different one:
1. REMOVE the old node
2. ADD the new node at the same parent + index

```json
{
  "changes": [
    { "operation": "remove", "targetUid": "old-header-uid" },
    {
      "operation": "add",
      "parentUid": "parent-box-uid",
      "index": 0,
      "node": {
        "uid": "new-image",
        "type": "image",
        "props": {
          "src": { "type": "imageurl", "staticString": "" },
          "alt": { "type": "string", "staticString": "Hero image" }
        },
        "slots": {},
        "styles": {}
      }
    }
  ]
}
```

The applier processes REMOVE before ADD, so the index is correct.

## Rules

1. Always read the composition to get the correct UID before removing/moving
2. REMOVE is irreversible — confirm with user before removing large sections
3. MOVE preserves UIDs — no new IDs generated
4. Swap operations need careful index calculation (indices shift after first move)
5. Cannot remove or move the root `page` node
