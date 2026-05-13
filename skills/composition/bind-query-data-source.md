---
name: bind-query-data-source
description: Bind a component or repeater to a Query Data Source (QDS) — filtered CMS entries via a configured query
type: skill
agent: polaris-assist
triggers: ["query data source", "QDS", "bind query", "filtered entries", "query results", "contentstack_queries", "bind to query"]
---

# Bind Query Data Source — Connect Components to Filtered Entries

## When to Use

User wants to drive content from a saved query (filtered set of entries) rather than the page's template entry:
- "Bind this section to the featured posts query"
- "Use the query data source for these cards"
- "Show entries filtered by category from a QDS"
- "Connect this repeater to query results"

## Concept

A Query Data Source (QDS) references a pre-configured query (`queryUID`) that returns `{ entries: [...], count: N }`. You can bind individual props to `entries.<field>` for a single item, or bind a repeater's `items` to the `entries` array to iterate over all results.

## Step 1: Confirm the Query UID

Ask the user (or look up in the composition `dataSources` block) for the `queryUID` of the configured query. It typically looks like `"query_001"`, `"featured_posts_query"`, etc.

## Step 2: Bind a Single Prop to a Query Result Field

Use `"type": "contentstack_queries"` in the binding. Path format is `entries.<field>` to read a field from the first result.

```json
{
  "operation": "modify",
  "targetUid": "hero-heading-uid",
  "changes": {
    "props": {
      "text": {
        "type": "string",
        "staticString": "Fallback Heading",
        "binding": {
          "type": "contentstack_queries",
          "value": {
            "queryUID": "query_001",
            "path": { "entries.title": {} }
          }
        }
      }
    }
  }
}
```

**Path conventions:**

| What you want | Path |
|---------------|------|
| First entry's `title` | `entries.title` |
| First entry's `featured_image.url` | `entries.featured_image.url` |
| First entry's nested ref field | `entries.author.name` |
| The full entries array (for repeater) | `entries` |
| Total count of results | `count` |

## Step 3: Bind a Repeater to the Entries Array

To iterate over all query results, bind the repeater's `items` to the `entries` path. Children then use `"type": "repeater"` bindings as normal.

```json
{
  "uid": "qds-repeater",
  "type": "repeater",
  "props": {
    "items": {
      "type": "array",
      "staticString": [],
      "binding": {
        "type": "contentstack_queries",
        "value": {
          "queryUID": "query_001",
          "path": { "entries": {} }
        }
      }
    },
    "children": { "type": "slot", "slot": "qds-rep-slot" }
  },
  "slots": {
    "qds-rep-slot": [
      {
        "uid": "qds-card",
        "type": "box",
        "props": {
          "children": { "type": "slot", "slot": "qds-card-slot" }
        },
        "slots": {
          "qds-card-slot": [
            {
              "uid": "qds-card-title",
              "type": "header",
              "props": {
                "text": {
                  "type": "string",
                  "staticString": "Post Title",
                  "binding": {
                    "type": "repeater",
                    "value": {
                      "repeaterUID": "qds-repeater",
                      "path": { "title": {} }
                    }
                  }
                },
                "Tag": { "type": "choice", "staticString": "h3" }
              },
              "slots": {},
              "styles": {}
            }
          ]
        },
        "styles": {}
      }
    ]
  },
  "styles": {}
}
```

**Key:** When children bind via repeater, their paths are relative to each entry object — do NOT include the `entries.` prefix inside the repeater binding.

## Step 4: Register the QDS in dataSources

The query must appear in the composition's top-level `dataSources` block. If it is missing, add it:

```json
{
  "dataSources": {
    "query_001": {
      "type": "contentstack_queries",
      "queryUID": "query_001"
    }
  }
}
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Using `"type": "template"` instead of `"type": "contentstack_queries"` | Always use `contentstack_queries` for QDS bindings |
| Path `entries.title` inside a repeater child binding | Inside repeater children use bare `title` — the `entries.` prefix is only for non-repeater direct bindings |
| Forgetting `queryUID` in the binding value | Both `queryUID` and `path` are required in the binding `value` object |
| Binding repeater `items` to `entries.title` instead of `entries` | Repeater `items` must point to the full `entries` array, not a field within it |
| Not including the QDS in `dataSources` | The query UID must be registered in the composition `dataSources` block |

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No content appears, no error | Verify the `queryUID` matches a configured query in the stack |
| Only first entry shows in repeater | Check `items` is bound to `entries` (array), not `entries.<field>` (scalar) |
| "Query not found" error | The `queryUID` in the binding does not match the key in `dataSources` |
| Count field shows `undefined` | Bind to `count` (top-level), not `entries.count` |
| Image fields blank | Append `.url` to the path — `entries.featured_image.url` not `entries.featured_image` |
