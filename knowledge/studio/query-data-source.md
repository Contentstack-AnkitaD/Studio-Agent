# Query Data Source (QDS)

A Query Data Source (QDS) binds a component to a filtered set of CMS entries rather than a single pinned entry. Instead of pointing at one specific entry, a QDS runs a saved query and hands the resulting array of entries to the component — making it the foundation for listing pages, carousels, and any UI that displays multiple entries of the same content type.

## Key Concepts

- A QDS is identified by the constant `DATA_SOURCES.QUERY = "contentstack_queries"`.
- Queries are stored under `spec.dataSources.contentstack_queries.<queryUID>`.
- Each query has a UID (e.g. `query_001`) that ties the stored results to the binding on a component prop.
- Query results are always an array: `{ entries: [...], count: N }`.
- Components access individual items by index (`entries.0.title`) or the full array (`entries`).
- QDS is the right tool when a component needs to iterate over CMS content — use repeaters alongside it.

## Configuration / Structure

### Binding format on a component prop

```json
{
  "type": "contentstack_queries",
  "value": {
    "queryUID": "query_001",
    "path": {
      "entries.title": {}
    }
  }
}
```

- `type` — must be the string `"contentstack_queries"`.
- `queryUID` — references the query stored in `spec.dataSources.contentstack_queries`.
- `path` — maps result fields to the prop. Keys follow the pattern `entries.<index>.<fieldPath>` for a specific item, or `entries` for the full array.

### Query definition stored in the spec

```json
{
  "spec": {
    "dataSources": {
      "contentstack_queries": {
        "query_001": {
          "contentType": "blog_post",
          "query": {
            "tags": { "$in": ["featured"] }
          },
          "params": {
            "limit": 10,
            "skip": 0,
            "desc": "created_at"
          }
        }
      }
    }
  }
}
```

| Field | Type | Description |
|---|---|---|
| `contentType` | `string` | UID of the CMS content type to query |
| `query` | `object` | Contentstack query filter object (same syntax as the Delivery API) |
| `params.limit` | `number` | Maximum number of entries to return |
| `params.skip` | `number` | Offset for pagination |
| `params.desc` | `string` | Field name to sort by, descending |

### Results structure

After the SDK executes the query, results are stored at the path above:

```json
{
  "spec": {
    "dataSources": {
      "contentstack_queries": {
        "query_001": {
          "entries": [
            { "uid": "blt123", "title": "Hello World", "tags": ["featured"] },
            { "uid": "blt456", "title": "Second Post", "tags": ["featured"] }
          ],
          "count": 2
        }
      }
    }
  }
}
```

## How It Works

1. **Author defines a query** in the Studio project with a unique `queryUID`, content type, filters, and params.
2. **Studio SDK resolves the query** at composition render time by calling the Contentstack Delivery API with the configured filters.
3. **Results are stored** inside `spec.dataSources.contentstack_queries.<queryUID>` as `{ entries: [...], count: N }`.
4. **Component props bind** to fields inside those results using the `path` object. The path key selects which part of the results to pass to the prop.
5. **Repeaters iterate** over `entries` — each iteration receives one entry from the array, allowing the same component template to render for every result.

## Path Format Reference

| Path key | What it resolves to |
|---|---|
| `entries` | The full array of entry objects |
| `entries.0` | First entry object |
| `entries.0.title` | `title` field of the first entry |
| `entries.0.hero_image.url` | Nested field on the first entry |
| `count` | Total number of entries returned |

## Examples

### Binding a card list component to a QDS

```json
{
  "componentUID": "card_list",
  "props": {
    "items": {
      "type": "contentstack_queries",
      "value": {
        "queryUID": "featured_posts",
        "path": {
          "entries": {}
        }
      }
    }
  }
}
```

The `items` prop receives the full `entries` array, which the component can iterate over.

### Binding a single field from the first result

```json
{
  "props": {
    "headline": {
      "type": "contentstack_queries",
      "value": {
        "queryUID": "hero_query",
        "path": {
          "entries.0.title": {}
        }
      }
    }
  }
}
```

### Query with multiple filters

```json
{
  "query_002": {
    "contentType": "product",
    "query": {
      "category": "electronics",
      "in_stock": true
    },
    "params": {
      "limit": 20,
      "skip": 0,
      "desc": "price"
    }
  }
}
```

## Common Questions

**What is the difference between a QDS and a pinned entry binding?**
A pinned entry binding (`type: "contentstack_entry"`) points to one specific entry by UID. A QDS runs a filter query and returns all matching entries, making it dynamic — if new entries match the filter, they appear automatically.

**Can I use a QDS without a repeater?**
Yes. You can bind `entries.0.<field>` to pull a single field from the first result, useful for "featured item" patterns where you want the top result only.

**Where is the query actually executed?**
The Studio SDK executes the Delivery API call server-side (or at fetch time) and caches results in the spec's `dataSources` block. Components receive already-resolved data.

**How do I paginate QDS results?**
Use `params.skip` to offset. To implement a "load more" pattern, create multiple query UIDs with different skip values, or update the query params dynamically.

**Can QDS queries reference environment or locale?**
Yes. The SDK injects the active environment and locale into all Delivery API calls, including QDS queries. The query definition itself does not need to specify these.

**What happens if the query returns zero entries?**
The results will be `{ entries: [], count: 0 }`. Components should handle an empty array gracefully to avoid rendering errors.

**Is the `path` object on a binding required?**
Yes. Even if you are binding the entire `entries` array, you must include the path key. Use `{ "entries": {} }` to pass the full array.
