# Binding System — Full Type Reference

## Overview

The binding system connects CMS content to component props. The SDK resolves bindings at render time, replacing bound props with values from the appropriate data source. This file covers everything: data source types, binding types, field compatibility, repeater adapters, JSON change operations, and the execution contract.

## DATA_SOURCES Constant (from frontend source)

```typescript
const DATA_SOURCES = {
  CONTENTSTACK: "contentstack",        // Pinned entries
  COMPONENT_PROPS: "component_props",  // Default prop values
  TEMPLATE: "template",               // Linked entry
  STATIC_VALUE: "static_value",       // Paste worker generated
  REPEATER: "repeater",               // Repeater iteration context
  SYMBOL_PROPS: "symbol_props",       // Symbol component bindings
  QUERY: "contentstack_queries",      // Query-based data source
} as const;
```

## Binding Map Type (from SDK source)

Every bound prop carries a `BindingMap`:

```typescript
interface BindingMap {
  type: "template" | "contentstack" | "repeater" | "component_props" | "static_value" | "symbol_props" | "contentstack_queries";
  value: {
    path?: Record<string, {}>;           // Field path as nested object
    uid?: string;                        // Entry UID (contentstack type)
    _content_type_uid?: string;          // Content type UID (contentstack type)
    repeaterUID?: string;                // Parent repeater node UID (repeater type)
    [key: string]: unknown;
  };
}
```

### Path Format

Paths are represented as nested objects where the key is the dot-notation path:

```typescript
// Simple field
{ "path": { "title": {} } }

// Nested reference field
{ "path": { "author.name": {} } }

// Image/file field (MUST end with .url)
{ "path": { "featured_image.url": {} } }

// Modular block field
{ "path": { "sections.hero_section.heading": {} } }

// Deep nested
{ "path": { "sections.content_section.author_ref.avatar.url": {} } }
```

## Data Source Types — Complete Reference

### 1. Template (`template`)

Data from the linked entry — the CMS entry connected to the composition via `connected_content_type`.

```json
{
  "props": {
    "heading": {
      "type": "string",
      "value": "Fallback heading",
      "binding": {
        "type": "template",
        "value": {
          "path": { "title": {} }
        }
      }
    }
  }
}
```

**When available:** Composition has `connected_content_type` set and a preview entry configured.

**How it works:**
1. Composition is created as "Linked Composition" with a CT selected
2. Studio fetches preview entry using CDA with auto-generated `include[]`
3. Data flows: CDA → Studio → `UPDATE_DATA_SOURCE` message → SDK
4. SDK populates `dataSources.template` with resolved entry data

**Path examples:**
```json
{ "path": { "title": {} } }                         // Top-level text field
{ "path": { "author.name": {} } }                   // Reference → resolved field
{ "path": { "hero_image.url": {} } }                // File/image field URL
{ "path": { "sections.0.heading": {} } }             // Modular block by index
{ "path": { "sections.hero_section.heading": {} } }  // Modular block by type
{ "path": { "tags": {} } }                           // Multiple field (array)
```

### 2. Contentstack (`contentstack`)

Manually pinned entries from any content type.

```json
{
  "props": {
    "authorName": {
      "type": "string",
      "value": "",
      "binding": {
        "type": "contentstack",
        "value": {
          "uid": "blt1234567890abcdef",
          "_content_type_uid": "author",
          "path": { "name": {} }
        }
      }
    }
  }
}
```

**Required fields:** `uid` (starts with `blt`), `_content_type_uid`, `path`

**When available:** Always — user adds entries via Page Data tab → "Link Entry"

**How it works:**
1. User selects entry in Data Picker UI
2. Studio stores entry reference in composition
3. Studio fetches entry with CDA + `include[]`
4. Data available in `dataSources.contentstack[ct_uid][entry_uid]`

### 3. Contentstack Query (`contentstack_queries`)

Query-based data — results from a configured query (CT + filters).

```json
{
  "props": {
    "items": {
      "type": "array",
      "value": [],
      "binding": {
        "type": "contentstack_queries",
        "value": {
          "queryUID": "query_abc123",
          "path": { "entries": {} }
        }
      }
    }
  }
}
```

**When available:** SDK supports `PAGE_DATA_QUERIES` feature flag

**How it works:**
1. User configures query in Page Data tab (selects CT + filters)
2. Studio executes query against CDA
3. Results available in `dataSources.contentstack_queries[queryUID]`
4. `include[]` is user-configured in query spec (NOT auto-detected)

### 4. Component Props (`component_props`)

Default prop values from component registration. Fallback when no CMS data bound.

```json
{
  "props": {
    "buttonText": {
      "type": "string",
      "value": "Click Me",
      "binding": {
        "type": "component_props",
        "value": {
          "path": { "buttonText": {} }
        }
      }
    }
  }
}
```

**When available:** Always — component registration includes defaults

### 5. Repeater (`repeater`)

Contextual data when a component is inside a repeater iterating over an array.

```json
{
  "props": {
    "itemTitle": {
      "type": "string",
      "value": "",
      "binding": {
        "type": "repeater",
        "value": {
          "repeaterUID": "repeater-node-uid-abc",
          "path": { "title": {} }
        }
      }
    }
  }
}
```

**Required fields:** `repeaterUID` (UID of the parent repeater node), `path`

**When available:** Component is a child (direct or nested) of a repeater component

**How it works:**
1. Parent repeater iterates over an array (from template, contentstack, or component_props)
2. Each iteration provides current item as context
3. Child components bind to repeater context using `repeaterUID`
4. SDK resolves the binding for each iteration independently

### 6. Static Value (`static_value`)

Internal — auto-generated by the paste worker when components are added to the canvas. Not user-facing.

```json
{
  "props": {
    "text": {
      "type": "string",
      "value": "Welcome",
      "binding": {
        "type": "static_value",
        "value": {
          "uid": "sv_abc123def456"
        }
      }
    }
  }
}
```

Stored in `dataSources.static_value[uid]`.

### 7. Symbol Props (`symbol_props`)

Internal — for symbol (shared component) bindings. Not user-facing.

## CMS Field → Prop Type Compatibility

Not all CMS field types can bind to all prop types:

| CMS Field (`data_type`) | Compatible Prop Types | Notes |
|-------------------------|----------------------|-------|
| `text` | `string`, `json_rte` | Direct text mapping |
| `text` + `enum` | `choice`, `string` | Select dropdown |
| `rich_text_editor` | `json_rte`, `string` | RTE content |
| `number` | `number`, `string` | Numeric values |
| `boolean` | `boolean` | True/false |
| `isodate` | `datestring`, `string` | Date values |
| `file` + `.url` | `imageurl`, `href`, `string` | MUST use `.url` suffix |
| `file` + `.filename` | `string` | File name only |
| `link` + `.href` | `href`, `string` | Link URL |
| `link` + `.title` | `string` | Link display text |
| `reference` | N/A — resolve via `include[]` | Then bind sub-fields |
| `group` | N/A — use dot notation | Access nested fields: `address.city` |
| `blocks` | `array` (with repeater) | Iterate via repeater component |
| `json` | `any` | Freeform JSON |

## CMS Field Path Syntax

Paths use dot notation to traverse nested CMS structures:

| CMS Structure | Path Example | Resolves To |
|---------------|-------------|-------------|
| Top-level field | `title` | Entry's `title` value |
| Reference field child | `author.name` | Resolved author entry's `name` |
| File/image URL | `hero_image.url` | Asset CDN URL string |
| File/image filename | `hero_image.filename` | Original filename |
| Link href | `cta_link.href` | URL string |
| Link title | `cta_link.title` | Display text |
| Group field child | `address.city` | Nested group value |
| Modular block by type | `sections.hero_section.heading` | Block's field value |
| Modular block by index | `sections.0.heading` | First block's field value |
| Multiple (array) field | `tags` | Array of values |
| Deep nested | `sections.content.author_ref.avatar.url` | Deeply resolved value |

## include[] Auto-Generation

When binding to template or contentstack entries, Studio auto-generates `include[]` paths for the CDA request:

```
Binding path: "title"
→ include[] = []  (no reference to resolve)

Binding path: "author.name"
→ include[] = ["author"]  (resolve "author" reference)

Binding path: "sections.hero_section.hero_ref.bio"
→ include[] = ["sections.hero_section.hero_ref"]

Binding path: "featured_image.url"
→ include[] = []  (file fields don't need include)
```

**Rule:** `include[]` contains the path up to each reference field boundary. The CDA resolves those referenced entries inline.

## Binding Flow in Studio UI

```
1. User clicks a component prop in the right panel
2. Data Picker opens showing available data sources:
   - Template Entry (if linked composition)
   - Additional Entries (pinned)
   - Queries (if enabled)
   - Component Defaults
3. User browses field tree from selected source
4. User clicks a compatible field (checked against matrix above)
5. Studio creates BindingMap on the prop
6. SDK receives updated composition via postMessage
7. SDK resolves binding → component receives CMS value
```

## Repeater Adapter System

The frontend uses adapters to handle data source-specific repeater logic:

```typescript
interface RepeaterAdapter {
  // Get data tree for browsing
  getDataTreeFromBinding(editor, binding): DataTreeNode | null;

  // Convert binding to display string
  getBindingString(binding): string;

  // Navigate to specific field in tree
  getTreeNodeForPath(dataTree, path): DataTreeNode | null;

  // Get bindable fields in repeater context
  getRepeaterContextData(params): RepeaterTreeNode[];

  // Check if adapter supports repeaters for this binding
  supportsRepeaters(binding): boolean;

  // Get binding details for active node
  getRepeaterBindingDetails?(editor, activeNode, dataTabState?, canvasState?): RepeaterBindingDetails;

  // Create binding from user selection
  getBinding?(params): { type: string; value: any };

  // Get display label for binding
  getBindingDisplay?(params): { text: string; icon?: string } | null;

  // Parse binding path string to PathItem array
  parseBindingPath?(params): PathItem[];
}

interface RepeaterBindingDetails {
  fieldPath: string;
  fieldPathRaw?: string;
  bindedField: DataTreeNode | null;
  repeaterUID: string;
  activeBlockUid?: string;
  isNestedInReference?: boolean;
}

interface RepeaterTreeNode {
  type: "object" | "basic";
  key: string;
  data: DataTreeNode & {
    type: string;
    active?: boolean;
    disabled?: boolean;
  };
}
```

Three adapters exist:
- `ContentstackRepeaterAdapter` — for `template` and `contentstack` bindings
- `ComponentPropsRepeaterAdapter` — for `component_props` bindings
- `QueryRepeaterAdapter` — for `contentstack_queries` bindings

## JSON Change Operations (for AI agent)

When the AI agent modifies compositions, it uses `JsonChange` operations:

```typescript
enum ChangeOperationType {
  ADD = "add",
  MODIFY = "modify",
  REMOVE = "remove",
  MOVE = "move",
}

interface JsonChange {
  operation: ChangeOperationType;
  targetUid?: string;              // Node to modify/remove/move
  parentUid?: string;              // Parent for ADD
  slotId?: string;                 // Slot name for ADD
  index?: number;                  // Position for ADD
  node?: NodeDto;                  // New node for ADD
  changes?: Record<string, unknown>; // Partial update for MODIFY
  toParentUid?: string;            // Destination parent for MOVE
  toSlotId?: string;               // Destination slot for MOVE
  toIndex?: number;                // Destination position for MOVE
  expectedNodeChecksum?: string;   // Checksum validation
  expectedParentSlotChecksum?: string;
  actualNodeChecksum?: string;
  afterNodeChecksum?: string;
}
```

### ADD Operation
```json
{
  "operation": "add",
  "parentUid": "section-uid-123",
  "slotId": "children",
  "index": 0,
  "node": {
    "uid": "new-header-uid",
    "type": "header",
    "props": {
      "text": { "type": "string", "value": "Hello World" },
      "headingTag": { "type": "choice", "value": "h1" }
    },
    "styles": {
      "desktop": {
        "typography": { "fontSize": "3rem", "fontWeight": "700" }
      }
    }
  }
}
```

### MODIFY Operation
```json
{
  "operation": "modify",
  "targetUid": "header-uid-123",
  "changes": {
    "props": {
      "text": { "type": "string", "value": "Updated heading" }
    },
    "styles": {
      "desktop": {
        "typography": { "fontSize": "2.5rem" }
      }
    }
  }
}
```

### REMOVE Operation
```json
{
  "operation": "remove",
  "targetUid": "header-uid-123"
}
```

### MOVE Operation
```json
{
  "operation": "move",
  "targetUid": "card-uid-123",
  "toParentUid": "grid-uid-456",
  "toSlotId": "children",
  "toIndex": 2
}
```

## Execution Contract

For composition changes, the AI agent uses an execution contract with the frontend:

```typescript
// Request sent to frontend
interface FrontendExecutionRequest {
  requestId: string;
  changes: { changes: JsonChange[]; explanation?: string };
  expectedBeforeChecksum: string;
  compositionBefore: NodeDto;
}

// AUTHORITATIVE result from frontend
interface FrontendExecutionResult {
  requestId: string;
  success: boolean;
  actualBeforeChecksum: string;
  actualAfterChecksum: string;
  afterVersion: number;
  appliedOperations: AppliedOperation[];
  errors?: Array<{
    code: string;
    message: string;
    operation?: string;
    recoverable?: boolean;
  }>;
}

interface AppliedOperation {
  type: "node_added" | "node_modified" | "node_removed" | "node_moved";
  nodeUid: string;
  nodePath: any[];
  before: { exists: boolean; nodeType?: string };
  after: { exists: boolean; nodeType?: string };
}
```

**Flow:**
1. Agent sends changes via tool call
2. Frontend receives via execution callback
3. Frontend applies changes atomically (sort order: REMOVE → MOVE → MODIFY → ADD)
4. Frontend computes AUTHORITATIVE before/after checksums (no cache — fresh computation)
5. Frontend sends `FrontendExecutionResult` back to agent
6. Agent verifies checksums match expectations
7. On mismatch: agent re-reads composition and retries

**Key principle:** The frontend is the source of truth for composition state. The agent NEVER modifies the composition directly — it proposes changes, and the frontend applies them.

## Agent Rules

1. **Verify field paths exist** in page data context before creating bindings
2. **Prefer `template`** for main page content (linked compositions)
3. **Use `contentstack`** when user references a specific entry by name/UID
4. **Use `repeater`** for components inside repeaters iterating over arrays
5. **Use `component_props`** (static) when no CMS data is relevant
6. **Image/file `.url`** — ALWAYS append `.url` when binding to file/image fields
7. **Generate unique UIDs** for new nodes — never reuse existing UIDs
8. **Checksum validation** — always include expected checksums in execution requests
9. **Operation order** — frontend sorts: REMOVE → MOVE → MODIFY → ADD
10. **Atomic application** — all changes in a request succeed or all fail
