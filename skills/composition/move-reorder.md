---
name: move-reorder
description: Move or reorder a node within a slot or between slots using the MOVE operation
type: skill
agent: polaris-assist
triggers: ["move", "reorder", "rearrange", "shift up", "shift down", "bring to top", "send to bottom", "change order", "swap position", "move between slots"]
---

# Move / Reorder — Change Node Position in Composition

## When to Use

User wants to change where a node appears in the layout:
- "Move the hero section to the top"
- "Reorder these cards — put the featured card first"
- "Shift the footer section down"
- "Move this component to a different slot"

## Concept

The `MOVE` operation repositions a node within its current slot or into a different slot entirely. It takes:
- `path` — the slot where the node currently lives
- `nodeUid` — which node to move
- `position` — new 0-based index in the target slot

No copy is made. The node retains all its existing props, bindings, and children.

## Step 1: Identify the Node and Its Current Location

Before issuing a MOVE, determine:
1. The `uid` of the node to move
2. The slot path array where it currently lives
3. The desired new position (0 = first)

If moving to a **different slot**, also identify:
4. The target slot's path array

## Step 2: Reorder Within the Same Slot

Move a node to a new index within the slot it already occupies:

```json
{
  "operation": "MOVE",
  "path": ["page-slot-1"],
  "nodeUid": "section-to-move-uid",
  "position": 0
}
```

**`path` is the slot path array, not the node path.** It identifies the parent slot, not the node itself.

**Example — bring a section to the top of the page:**

```json
{
  "operation": "MOVE",
  "path": ["page-root-uid", "main-slot"],
  "nodeUid": "hero-section-uid",
  "position": 0
}
```

**Example — send a node to the end (position = last index):**

If the slot has 4 children and you want this node last:
```json
{
  "operation": "MOVE",
  "path": ["page-root-uid", "main-slot"],
  "nodeUid": "footer-uid",
  "position": 3
}
```

## Step 3: Move to a Different Slot

Specify the **target** slot path in `path` to move the node into a different container:

```json
{
  "operation": "MOVE",
  "path": ["sidebar-section-uid", "sidebar-slot"],
  "nodeUid": "promo-card-uid",
  "position": 0
}
```

This removes `promo-card-uid` from wherever it currently lives and inserts it at index 0 of `sidebar-slot`.

## Step 4: Reorder Multiple Nodes

To reorder several nodes, issue multiple MOVE operations in sequence. Later operations account for position shifts caused by earlier ones.

**Example — swap first and second cards in a list (slot has [card-a, card-b, card-c]):**

```json
[
  {
    "operation": "MOVE",
    "path": ["grid-uid", "grid-slot"],
    "nodeUid": "card-b-uid",
    "position": 0
  },
  {
    "operation": "MOVE",
    "path": ["grid-uid", "grid-slot"],
    "nodeUid": "card-a-uid",
    "position": 1
  }
]
```

## Path Format Reference

| Slot location | `path` array |
|---------------|-------------|
| Top-level page slot | `["page-root-uid", "page-slot"]` |
| Nested inside a section | `["section-uid", "section-children-slot"]` |
| Inside an hstack column | `["hstack-uid", "col-slot-uid"]` |
| Inside a condition-block | `["condition-block-uid", "cb-slot-uid"]` |
| Inside a repeater template | `["repeater-uid", "rep-slot-uid"]` |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Setting `path` to the node's UID instead of its parent slot | `path` is the **slot** path — the container, not the node itself |
| Using a 1-based position index | Position is 0-based — first = `0`, second = `1` |
| Moving a node to a position beyond the slot length | Max valid position is `(slot.length - 1)` after removal |
| Issuing reorder operations out of sequence | When moving multiple nodes, order matters — earlier moves shift indices |
| Trying to move a node to the slot it already occupies at the same index | No-op, but harmless |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Node disappears from composition | `path` referenced a non-existent slot UID — verify the slot path |
| Node ends up at wrong position | Check if earlier MOVE operations shifted indices before this one ran |
| "Node not found" error | `nodeUid` is incorrect — confirm the UID from the composition JSON |
| Move between slots does nothing | Verify both source slot and target slot paths are correct |
| Node appears at the end instead of specified position | Position exceeded slot length — use `slot.length - 1` as max |
