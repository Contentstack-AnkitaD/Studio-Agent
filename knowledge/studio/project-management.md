# Project Management

A Studio project is the top-level container that connects a Contentstack Stack to the Visual Builder canvas. It stores which Stack, content type, and environment authors work against, and it records the Canvas URL where the user's web application is hosted for the iframe preview. Projects are managed through the Composable Studio REST API and require an authenticated `authtoken` and an `organization_uid` header on every call.

## Key Concepts

- Projects live under an Organization — one organization can have many projects.
- A project is linked to exactly one Contentstack Stack via `connectedStackApiKey`.
- The `contentTypeUid` specifies which content type in that Stack stores composition entries.
- The `canvasUrl` is the publicly reachable URL of the user's web application — the Visual Builder loads it in an iframe.
- Project settings (`configuration`) store the active `environment` and `locale` for the canvas session.
- All project API calls require `authtoken` (user or app token) and `organization_uid` headers.

## Configuration / Structure

### Project model

```ts
interface Project {
  uid: string;                    // Auto-generated unique identifier
  name: string;                   // Human-readable project name
  description?: string;           // Optional description
  canvasUrl: string;              // URL of the user's app (Visual Builder iframe src)
  connectedStackApiKey: string;   // API key of the linked Contentstack Stack
  contentTypeUid: string;         // Content type UID where compositions are stored
  organizationUid: string;        // Parent organization UID
  settings: ProjectSettings;
}

interface ProjectSettings {
  configuration: {
    environment: string;   // e.g. "production", "staging", "development"
    locale: string;        // e.g. "en-us", "fr-fr"
  };
}
```

### Required headers for all project API calls

```
authtoken: <user_authtoken_or_app_token>
organization_uid: <organization_uid>
Content-Type: application/json
```

## API Reference

Base path: `/composable-studio-api/v1/projects`

### GET — List all projects

```
GET /composable-studio-api/v1/projects

Headers:
  authtoken: <token>
  organization_uid: <org_uid>

Response 200:
{
  "projects": [
    {
      "uid": "proj_abc123",
      "name": "Marketing Site",
      "canvasUrl": "https://myapp.vercel.app",
      "connectedStackApiKey": "bltXXXXXXXXXXXXXXXX",
      "contentTypeUid": "composition",
      "organizationUid": "org_xyz789",
      "settings": {
        "configuration": {
          "environment": "production",
          "locale": "en-us"
        }
      }
    }
  ]
}
```

### GET — Fetch a single project

```
GET /composable-studio-api/v1/projects/:projectUid

Headers:
  authtoken: <token>
  organization_uid: <org_uid>

Response 200:
{
  "project": { ... }   // full Project object
}
```

### POST — Create a project

```
POST /composable-studio-api/v1/projects

Headers:
  authtoken: <token>
  organization_uid: <org_uid>
  Content-Type: application/json

Body:
{
  "project": {
    "name": "E-commerce Site",
    "description": "Product pages and landing compositions",
    "canvasUrl": "https://ecommerce.example.com",
    "connectedStackApiKey": "bltYYYYYYYYYYYYYYYY",
    "contentTypeUid": "page_composition",
    "settings": {
      "configuration": {
        "environment": "staging",
        "locale": "en-us"
      }
    }
  }
}

Response 201:
{
  "project": {
    "uid": "proj_new456",
    ...
  }
}
```

### PUT — Update a project

```
PUT /composable-studio-api/v1/projects/:projectUid

Headers:
  authtoken: <token>
  organization_uid: <org_uid>
  Content-Type: application/json

Body:
{
  "project": {
    "name": "E-commerce Site (Updated)",
    "canvasUrl": "https://ecommerce-v2.example.com",
    "settings": {
      "configuration": {
        "environment": "production",
        "locale": "en-us"
      }
    }
  }
}

Response 200:
{
  "project": { ... }   // updated Project object
}
```

### DELETE — Remove a project

```
DELETE /composable-studio-api/v1/projects/:projectUid

Headers:
  authtoken: <token>
  organization_uid: <org_uid>

Response 200:
{
  "message": "Project deleted successfully."
}
```

## How It Works

1. **Organization context** — every API call is scoped to an organization via the `organization_uid` header. The `authtoken` must belong to a user with access to that organization.
2. **Stack connection** — `connectedStackApiKey` links the project to a Contentstack Stack. The Visual Builder uses this to query available content types, entries, and assets from that Stack.
3. **Content type** — `contentTypeUid` tells Studio which content type to create composition entries under. Compositions are stored as regular Contentstack entries of this type.
4. **Canvas URL** — the Visual Builder opens `canvasUrl` in an iframe. The app running at this URL must have the Studio SDK initialized and all components registered so the builder can render and inspect the composition.
5. **Settings/configuration** — `environment` and `locale` determine which published content the canvas loads. Changing these in project settings immediately affects what the Visual Builder shows.

## Examples

### Create a project via `fetch`

```ts
async function createProject(authtoken: string, orgUid: string) {
  const response = await fetch(
    "https://app.contentstack.com/composable-studio-api/v1/projects",
    {
      method: "POST",
      headers: {
        authtoken,
        organization_uid: orgUid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: {
          name: "My New Site",
          canvasUrl: "https://my-site.vercel.app",
          connectedStackApiKey: "bltXXXXXXXXXXXXXXXX",
          contentTypeUid: "composition",
          settings: {
            configuration: {
              environment: "production",
              locale: "en-us",
            },
          },
        },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to create project: ${response.status}`);
  }

  const { project } = await response.json();
  return project;
}
```

### Update only the Canvas URL

```ts
async function updateCanvasUrl(
  authtoken: string,
  orgUid: string,
  projectUid: string,
  newUrl: string
) {
  const response = await fetch(
    `https://app.contentstack.com/composable-studio-api/v1/projects/${projectUid}`,
    {
      method: "PUT",
      headers: {
        authtoken,
        organization_uid: orgUid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: { canvasUrl: newUrl },
      }),
    }
  );

  return response.json();
}
```

### Switch the active environment for a project

```ts
async function switchEnvironment(
  authtoken: string,
  orgUid: string,
  projectUid: string,
  newEnvironment: string
) {
  return fetch(
    `https://app.contentstack.com/composable-studio-api/v1/projects/${projectUid}`,
    {
      method: "PUT",
      headers: {
        authtoken,
        organization_uid: orgUid,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: {
          settings: {
            configuration: { environment: newEnvironment },
          },
        },
      }),
    }
  );
}
```

## Common Questions

**What `authtoken` should I use?**
Use the logged-in user's session authtoken from the Contentstack Management API (returned by `/user-session` or the Contentstack dashboard). For server-to-server integrations, use a Management Token scoped to the organization.

**Can one project connect to multiple Stacks?**
No. Each project has exactly one `connectedStackApiKey`. To work with multiple Stacks, create separate projects.

**What content type should I use for `contentTypeUid`?**
Create a dedicated content type in your Stack specifically for Studio compositions (commonly named `composition` or `page`). The Studio SDK expects its fields to follow the composition schema. Do not reuse a general content type that has non-composition entries.

**Does deleting a project delete the composition entries in Contentstack?**
No. Deleting a project removes the Studio project configuration, but composition entries stored in the linked Stack's content type are not affected. They remain in Contentstack and must be deleted separately if needed.

**What happens if the `canvasUrl` is unreachable?**
The Visual Builder iframe will fail to load, showing a blank or error state. The Canvas URL must be publicly accessible (or accessible from the author's network) and must not block iframe embedding via `X-Frame-Options` or `Content-Security-Policy: frame-ancestors`.

**Can I have multiple projects pointing to the same Stack?**
Yes. Multiple projects can share the same `connectedStackApiKey` but with different `contentTypeUid` values or different `canvasUrl` values. This is useful for separating concerns (e.g. a marketing site project vs. a documentation site project on the same Stack).

**How do I find my `organization_uid`?**
It appears in the Contentstack dashboard URL (`app.contentstack.com/#!/org/<org_uid>/...`) and is also returned in the `/organizations` Management API endpoint response.
