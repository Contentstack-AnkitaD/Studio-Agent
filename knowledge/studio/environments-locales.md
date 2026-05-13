# Environments and Locales

Environments and locales control which version of content is served to a Studio composition. An environment maps to a Contentstack publishing environment (such as `development`, `staging`, or `production`), while a locale selects the language variant of each entry. Together they are stored in a project's configuration and injected into every CMS API call the Studio SDK makes.

## Key Concepts

- Every Studio project has a `configuration` object with `environment` and `locale` fields.
- The environment matches a publishing environment name defined in the connected Contentstack Stack.
- The locale value is a Contentstack locale code (e.g. `en-us`, `fr-fr`, `de-de`).
- At runtime, the SDK reads these values and passes them as headers or query parameters on all Delivery API requests.
- Live Preview uses a separate preview endpoint and may target a different environment than the delivery endpoint.
- The `CONTENTSTACK_ENVIRONMENT` environment variable is the standard way to configure the SDK when running outside the Studio frame.

## Configuration / Structure

### Project settings model (stored server-side)

```json
{
  "uid": "proj_abc123",
  "name": "My Marketing Site",
  "settings": {
    "configuration": {
      "environment": "production",
      "locale": "en-us"
    }
  }
}
```

### SDK initialization — passing environment

```ts
import Contentstack from "contentstack";

const Stack = Contentstack.Stack({
  api_key: process.env.CONTENTSTACK_API_KEY!,
  delivery_token: process.env.CONTENTSTACK_DELIVERY_TOKEN!,
  environment: process.env.CONTENTSTACK_ENVIRONMENT!,  // e.g. "production"
});
```

The `environment` value in the SDK init must match the name of a published environment in the connected Stack. If it does not match, content calls return 404 or empty results.

### API headers included in delivery requests

| Header | Example Value | Purpose |
|---|---|---|
| `api_key` | `bltXXXXXXXXXXXXXXXX` | Identifies the Stack |
| `access_token` | `csXXXXXXXXXX` | Delivery token for the environment |
| `environment` | `production` | Which published environment to read from |
| `locale` | `en-us` | Which language variant to return |

For the REST API these are passed as query parameters or headers depending on the endpoint:

```
GET /v3/content_types/blog_post/entries
  ?environment=production
  &locale=en-us
```

### Preview vs. delivery endpoint

| Mode | Endpoint | Auth |
|---|---|---|
| Delivery (published) | `cdn.contentstack.io` | Delivery token |
| Preview (draft) | `preview.contentstack.com` | Preview token or Management token |
| Live Preview | `cdn.contentstack.io` + `live_preview` header | Delivery token + preview hash |

## How It Works

1. **Project is created** with a connected Stack API key and a chosen environment (e.g. `staging`).
2. **Locale is configured** in project settings — this determines which locale variant the Studio canvas loads by default.
3. **SDK is initialized** (in the user's app) with `environment` matching the project setting, typically via the `CONTENTSTACK_ENVIRONMENT` env var.
4. **On every content fetch**, the SDK includes the environment and locale in the request so Contentstack returns only published content for that environment in the correct language.
5. **Authors switch environments** (e.g. from `staging` to `production`) in project settings to preview content published to different stacks.
6. **Locale switching** (if implemented in the app) changes the locale query parameter, causing Contentstack to return the translated variant of each entry.

### Environment variable reference

```bash
# .env.local (Next.js example)
CONTENTSTACK_API_KEY=bltXXXXXXXXXXXXXXXX
CONTENTSTACK_DELIVERY_TOKEN=csXXXXXXXXXXXX
CONTENTSTACK_ENVIRONMENT=production          # matches project settings
CONTENTSTACK_LOCALE=en-us                    # default locale

# For preview mode
CONTENTSTACK_PREVIEW_TOKEN=csYYYYYYYYYYYYYY
```

## Examples

### Fetching an entry for a specific environment and locale

```ts
async function getEntry(contentType: string, uid: string, locale: string) {
  const response = await fetch(
    `https://cdn.contentstack.io/v3/content_types/${contentType}/entries/${uid}`,
    {
      headers: {
        api_key: process.env.CONTENTSTACK_API_KEY!,
        access_token: process.env.CONTENTSTACK_DELIVERY_TOKEN!,
      },
      // Environment and locale as query params
    }
  );

  // Or via the JS SDK (handles env/locale from Stack init config)
  const entry = await Stack.ContentType(contentType)
    .Entry(uid)
    .language(locale)   // locale selector
    .fetch();

  return entry;
}
```

### Dynamic locale selection in Next.js

```tsx
// middleware.ts — detect locale from Accept-Language or URL prefix
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SUPPORTED_LOCALES = ["en-us", "fr-fr", "de-de"];

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const locale = SUPPORTED_LOCALES.find((l) => pathname.startsWith(`/${l}`));

  if (!locale) {
    return NextResponse.redirect(new URL(`/en-us${pathname}`, request.url));
  }
}
```

```ts
// lib/contentstack.ts — locale-aware fetch
export function getStack(locale: string) {
  return Contentstack.Stack({
    api_key: process.env.CONTENTSTACK_API_KEY!,
    delivery_token: process.env.CONTENTSTACK_DELIVERY_TOKEN!,
    environment: process.env.CONTENTSTACK_ENVIRONMENT!,
    // locale is passed per-query via .language() rather than at Stack init level
  });
}
```

### Reading environment/locale from project configuration (server-side)

```ts
// When your backend retrieves a Studio project
const project = await getProject("proj_abc123", {
  headers: { authtoken: userAuthToken },
});

const { environment, locale } = project.settings.configuration;
// Use these to initialize the correct Stack instance for content fetching
```

## Common Questions

**What happens if `CONTENTSTACK_ENVIRONMENT` does not match any published environment?**
Delivery API calls will return empty entry lists or 422 errors. Always verify the environment name exactly matches what is configured in the Contentstack Stack dashboard (case-sensitive).

**Can one Studio project serve multiple environments?**
A project's configuration holds one environment at a time. To serve multiple environments (e.g. a staging preview and a production site), create separate projects pointing to the same Stack but configured with different environments.

**How do I switch the locale at runtime without reloading the page?**
Re-initialize the SDK Stack instance with a different locale or call `.language(newLocale)` on each query. In SSR setups, locale is usually determined from the URL and passed server-side — a locale change is typically a navigation event.

**Does the locale need to be configured in both the Studio project and Contentstack?**
Yes. The locale must exist in the connected Stack (under Stack settings > Internationalization) before Studio can use it. Configuring a locale in the project that does not exist in the Stack will result in empty or fallback content.

**What is the difference between the delivery token and the preview token?**
The delivery token grants read access to published content for a specific environment. The preview token grants access to draft/unpublished content. Use the delivery token for production pages and the preview token (or management token) for draft previews.

**Does changing the environment in project settings affect running deployments?**
No. The project's `configuration.environment` is read by the Studio canvas (Visual Builder) to load the correct content in the editor. Your deployed app reads the environment from its own environment variables — they are independent.
