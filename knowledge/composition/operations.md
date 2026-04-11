# Composition Operations

## Tool: execute_composition_change

```json
{
  "description": "Human-readable description of changes",
  "operation": "add | remove | modify | move | unknown",
  "targetUids": ["uid-1", "uid-2"],
  "changes": [
    {
      "operation": "add | modify | remove | move",
      "targetUid": "node-uid",
      "parentUid": "parent-uid",
      "index": 0,
      "node": {},
      "changes": {},
      "toParentUid": "new-parent-uid",
      "toSlotId": "slot-id",
      "toIndex": 0
    }
  ]
}
```

## ADD Operation

```json
{
  "operation": "add",
  "parentUid": "parent-container-uid",
  "index": 0,
  "node": { /* complete node with uid, type, attrs, metadata, props, slots, styles */ }
}
```

- Parent MUST be a container type (box, section, hstack, vstack)
- Find parent UID from the composition tree
- Include ALL required node fields (see node-structure.md)

### Position Calculation

| User Says | Index |
|-----------|-------|
| "at the end" / "at the bottom" | length of slot children |
| "at the top" / "at the beginning" | 0 |
| "above X" / "before X" | X's current index |
| "below X" / "after X" | X's index + 1 |
| "between X and Y" | X's index + 1 |

## MODIFY Operation

```json
{
  "operation": "modify",
  "targetUid": "node-to-modify-uid",
  "changes": { /* complete node with ALL existing props + your changes */ }
}
```

CRITICAL: Include ALL existing properties in the changeset. Only change what you need. Missing props = data loss.

Steps:
1. Find the node in full composition JSON
2. Copy its COMPLETE structure
3. Change ONLY the specific properties
4. Send the full structure as `changes`

## REMOVE Operation

```json
{
  "operation": "remove",
  "targetUid": "node-to-remove-uid"
}
```

## MOVE Operation

```json
{
  "operation": "move",
  "targetUid": "node-to-move-uid",
  "toParentUid": "destination-parent-uid",
  "toSlotId": "children",
  "toIndex": 0
}
```

ALWAYS use MOVE for repositioning. NEVER use REMOVE + ADD — causes duplicate UIDs and data loss.

## Multiple Operations in One Call

Batch ALL changes in the `changes` array. Order matters:

1. REMOVE operations first
2. MODIFY operations second
3. ADD operations last

```json
{
  "description": "Add button, change heading color, remove footer",
  "changes": [
    { "operation": "remove", "targetUid": "footer-uid" },
    { "operation": "modify", "targetUid": "heading-uid", "changes": {...} },
    { "operation": "add", "parentUid": "parent-uid", "node": {...} }
  ]
}
```

## Error Handling

When tool returns `is_error: true`:

1. READ the error message — it tells you exactly what went wrong
2. Common: "Parent node not found" — you used an OLD UID from conversation history
3. LOOK at the CURRENT composition in your context — UIDs may have changed
4. Find the correct UID from the current tree
5. RETRY with the correct UID
6. Maximum 2 retries — then explain the error to the user

## Decision Tree

| User Intent | Action |
|-------------|--------|
| "Add a button" | CALL execute_composition_change with ADD |
| "Change text to X" | CALL execute_composition_change with MODIFY |
| "Remove the footer" | CALL execute_composition_change with REMOVE |
| "Move X above Y" | CALL execute_composition_change with MOVE |
| "What's on the page?" | Respond with TEXT — read composition and describe |
| "Is X before Y?" | Respond with TEXT — confirm current position |
| "Can you add...?" / "I want..." | These are ACTION requests → CALL THE TOOL |
| Not sure if question or action | If it involves modifying → CALL THE TOOL |

NEVER say "Done!" without actually calling the tool.
NEVER describe changes without executing them.
