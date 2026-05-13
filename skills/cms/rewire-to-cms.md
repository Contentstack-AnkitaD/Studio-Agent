---
name: rewire-to-cms
description: Replace hardcoded data references in the user's components with live fetches from the Contentstack Delivery SDK. Read-and-write skill — modifies project source files.
type: skill
agent: polaris-agent
triggers:
  - "rewire to cms"
  - "replace hardcoded data with contentstack"
  - "fetch this from contentstack instead"
  - "swap mock data for cms data"
  - "connect this component to cms"
handoffs:
  before:
    - setup-cms                # SDK client must exist
    - scaffold-content-types   # target CTs must exist
    - seed-entries             # entries must exist (otherwise components render empty)
---

# Rewire Hardcoded Data to Contentstack CMS

Components in the project import or define hardcoded data (`import features from '@/data/features'`, `const TESTIMONIALS = [...]`). The matching content type and entries now exist in Contentstack. This skill replaces the hardcoded imports with Delivery SDK fetches so the rendered output comes from CMS.

## Prerequisite

All of:
- `setup-cms` ran — `lib/contentstack.ts` exists and exports `stack`
- `scaffold-content-types` ran — target content types exist in the stack
- `seed-entries` ran — entries are published in the target environment

If any of these are missing, stop and hand back to the appropriate skill.

---

## Phase A — Map components to content types

Ask the user **one** consolidated question listing every candidate found:

> "Found these hardcoded data sources still in use. Pick which to rewire (you can skip any):
>
> | Component / file | Hardcoded source | Target content type |
> |---|---|---|
> | `src/components/Features.tsx` | `import features from '@/data/features'` | `feature` |
> | `src/components/Testimonials.tsx` | `import testimonials from '@/data/testimonials.json'` | `testimonial` |
> | `src/app/page.tsx` (inline `HERO_DATA`) | inline const | `hero` (singleton) |"

If a target CT is ambiguous (the field names don't match cleanly), ask the user to pick one.

---

## Phase B — Rewire per component

For each confirmed component, apply the framework-appropriate pattern below. Detect framework the same way `setup-cms` does (parse `package.json`).

### Pattern 1 — Next.js App Router (server components)

Default and preferred when the framework is Next.js with App Router. The fetch happens server-side; no client-side flash.

```tsx
// src/components/Features.tsx (was: import features from '@/data/features')
import { stack } from '@/lib/contentstack';

export default async function Features() {
  const { entries } = await stack.contentType('feature').entry().find();
  // ... existing JSX, now reading from `entries` instead of `features`
}
```

### Pattern 2 — Next.js Pages Router

Use `getStaticProps` (preferred) or `getServerSideProps`. **The complete pattern requires three changes — adding `getStaticProps` alone is not enough.** The page component must (a) accept the data as a prop, and (b) thread it down to whatever child renders it. Forgetting (a) or (b) is the most common bug here — the data is fetched but never reaches the UI.

```tsx
// src/pages/index.tsx — COMPLETE example, not a sketch
import type { InferGetStaticPropsType } from 'next';
import { stack } from '@/lib/contentstack';
import { Features } from '@/components/Features';

interface CmsFeature {
  title: string;
  description?: string;
  // ...other CT fields
}

export async function getStaticProps() {
  const { entries } = await stack.contentType('feature').entry().find<CmsFeature>();
  const features = (entries ?? []).map((e) => ({
    title:       e.title,
    description: e.description ?? '',
    // map CMS field names -> the prop shape Features expects
  }));
  return { props: { features }, revalidate: 60 };
}

// ↓ DESTRUCTURE the props from getStaticProps and THREAD them to the child.
// If you write `export default function Home()` with no params, the data
// you fetched is silently dropped.
export default function Home({ features }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <main>
      <Features features={features} />
      {/* ↑ pass `features`, NOT `[]`. Passing an empty literal is a wiring
          bug — the page will render whatever fallback the component has
          for empty input, NOT the CMS data. */}
    </main>
  );
}
```

The child component (`Features` in this example) must also be updated to accept `features` as a prop instead of declaring its own hardcoded array. See the Anti-patterns section below.

### Pattern 3 — React + Vite (or CRA) — client-side fetch

Use `useEffect` + state, with loading/empty handling. **Do not** introduce React Query, SWR, or another data lib unless one is already in the project.

```tsx
// src/components/Features.tsx
import { useEffect, useState } from 'react';
import { stack } from '@/lib/contentstack';

export default function Features() {
  const [features, setFeatures] = useState<any[] | null>(null);

  useEffect(() => {
    stack.contentType('feature').entry().find().then(r => setFeatures(r.entries));
  }, []);

  if (features === null) return null; // or your existing skeleton
  // ... existing JSX, now reading from `features` (which is `entries`)
}
```

If the project already has React Query or SWR, use that instead — match the existing pattern, don't introduce a second one.

### Pattern 4 — Remix

Use `loader` + `useLoaderData`:

```tsx
// app/routes/_index.tsx
import { useLoaderData } from '@remix-run/react';
import { stack } from '~/lib/contentstack';

export async function loader() {
  const { entries } = await stack.contentType('feature').entry().find();
  return { features: entries };
}

export default function Index() {
  const { features } = useLoaderData<typeof loader>();
  // ...
}
```

### Pattern 5 — React Router 7 (framework mode)

The template uses a server-only factory (`getContentstackStack()` from `app/lib/contentstack.server.ts`) and typegen-generated `Route.ComponentProps`. Idiomatic RR7 doesn't import `useLoaderData` — it destructures `loaderData` from the typed props.

```tsx
// app/routes/home.tsx
import type { Route } from "./+types/home";
import { getContentstackStack } from "../lib/contentstack.server";
import { Projects } from "../components/Projects";

export async function loader() {
  const stack = getContentstackStack();
  const { entries } = await stack.contentType("project").entry().find<{
    title: string;
    description?: string;
    image?: string;
    technologies?: string[];
    live_link?: { title?: string; href?: string };
    code_link?: { title?: string; href?: string };
  }>();
  // Map CMS field names -> JSX prop names at the loader boundary.
  const projects = (entries ?? []).map((e) => ({
    title:        e.title,
    description:  e.description ?? "",
    image:        e.image ?? "",
    technologies: e.technologies ?? [],
    liveLink:     e.live_link?.href ?? "#",
    codeLink:     e.code_link?.href ?? "#",
  }));
  return { projects };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return <Projects projects={loaderData.projects} />;
}
```

### Pattern 6 — Astro

Use the front-matter fence in `.astro` files (server-side):

```astro
---
// src/pages/index.astro
import { stack } from '../lib/contentstack';
import Features from '../components/Features.astro';

const { entries } = await stack.contentType('feature').entry().find();
const features = entries ?? [];
---
<Features features={features} />
```

For React/Vue/Svelte component islands used inside `.astro`, fetch in the parent `.astro` and pass props — don't fetch inside the island (it'd run client-side and ship the delivery token to the browser).

### Pattern 7 — Vue + Vite (SPA, CSR)

Use `<script setup>` with `ref()` + `onMounted()`. Same client-side flash trade-off as the React Vite SPA pattern.

```vue
<!-- src/components/Projects.vue -->
<script setup lang="ts">
import { ref, onMounted } from "vue";
import { stack } from "../lib/contentstack";

interface ProjectItem {
  title: string;
  description: string;
  image: string;
  technologies: string[];
  liveLink: string;
  codeLink: string;
}

const projects = ref<ProjectItem[] | null>(null);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const r = await stack.contentType("project").entry().find<{
      title: string;
      description?: string;
      image?: string;
      technologies?: string[];
      live_link?: { title?: string; href?: string };
      code_link?: { title?: string; href?: string };
    }>();
    projects.value = (r.entries ?? []).map((e) => ({
      title: e.title,
      description: e.description ?? "",
      image: e.image ?? "",
      technologies: e.technologies ?? [],
      liveLink: e.live_link?.href ?? "#",
      codeLink: e.code_link?.href ?? "#",
    }));
  } catch (err) {
    error.value = err instanceof Error ? err.message : String(err);
  }
});
</script>

<template>
  <p v-if="error">Error: {{ error }}</p>
  <p v-else-if="projects === null">Loading…</p>
  <article v-else v-for="(p, i) in projects" :key="i">
    <h3>{{ p.title }}</h3>
    <p>{{ p.description }}</p>
  </article>
</template>
```

### Untested frameworks (Nuxt / SvelteKit / Angular)

These have detection entries in `setup-cms` but no validated rewire pattern here. If the project falls into one of these, complete `setup-cms` (install + env + client), then **stop**, summarize what's left, and ask the user to point at one component file so the rewire pattern can be confirmed against that framework's idiom before applying broadly. Common pitfalls to flag:

- **Nuxt:** server-only fetch must go in `server/api/*.ts` or in `<script setup>` with `useFetch`/`useAsyncData` (NOT a top-level `await` that runs client-side).
- **SvelteKit:** fetch goes in `+page.server.ts` (`load` function); component reads via `export let data`.
- **Angular:** wrap the SDK in an injectable service; component subscribes to a `signal`/`observable`. The standalone-component vs. NgModule split changes the wiring boilerplate.

### When the hardcoded data is in a *child component*, not the route itself

Common case for portfolio / landing templates: `Home` route renders `<Hero />`, `<About />`, `<Skills />`, `<Projects />`, etc., and each child component owns its own `const X = [...]` array. Loaders are route-bound, so:

1. Move the fetch + mapping into the parent route's `loader`.
2. Change the child component to accept the data as a prop instead of declaring the array itself.
3. Pass it down: `<Projects projects={loaderData.projects} />`.

Do **not** try to add a loader to the child component — RR/Remix loaders only work on route modules. Adding `useEffect` in a server-rendered child is a regression (loses SSR streaming).

### Field-name mismatch handling

If the source data used `imageUrl` but the content type field is `image`, you'll need to either:
- (preferred) Rename the JSX references to match the CT field names, **or**
- Map at the fetch boundary: `const features = entries.map(e => ({ ...e, imageUrl: e.image }));`

Pick mapping-at-boundary if the JSX is deep / used in many places. Pick renaming if the JSX is local.

### Singleton entries

If the CT is `options.singleton: true`, there's exactly one entry. Fetch with `.find()` and take `entries[0]`, or query the well-known entry uid if the user provided one.

---

## Phase C — Clean up the hardcoded source

Once the import is replaced and the user-confirmed list is fully rewired:

1. If the original data file is now **unused** (no other importers), ask before deleting:
   > "`src/data/features.ts` is now unused. Delete it?"
2. If still referenced elsewhere, leave it alone and report:
   > "Left `src/data/features.ts` in place — still imported by `src/components/FeaturedPreview.tsx`."

Never silently delete files. Always confirm.

---

## Anti-patterns — these defeat the rewire

These are real bugs observed in live runs. Don't ship any of them:

### 1. Keeping the original hardcoded array as a "fallback" inside the rewired component

```tsx
// ❌ BAD — every value in the original hardcoded array is preserved as
// a `defaultProjects` constant, and the component picks defaultProjects
// when CMS returns nothing. The page renders identical output whether
// CMS is wired or not — masking any wiring bug.
export function Projects({ projects }: { projects: ProjectItem[] }) {
  const defaultProjects = [/* the 3 hardcoded entries — copy/pasted */];
  const rendered = projects && projects.length ? projects : defaultProjects;
  return <>{rendered.map(...)}</>;
}
```

The whole point of the rewire is to **remove** the hardcoded source as the source of truth and replace it with CMS. Keeping a parallel hardcoded copy means there's no signal that the rewire is broken — the page looks fine while the CMS path silently fails.

```tsx
// ✅ GOOD — single source of truth (the prop). If CMS returns nothing,
// the page renders nothing for that section; that's the correct signal.
export function Projects({ projects }: { projects: ProjectItem[] }) {
  if (projects.length === 0) return null; // or a real empty state
  return <>{projects.map(...)}</>;
}
```

### 2. Passing an empty-array literal at the call site

```tsx
// ❌ BAD — getStaticProps fetches data, but the page ignores it.
export default function Home() {  // no props destructured!
  return <Projects projects={[]} />;  // empty literal
}
export async function getStaticProps() {
  const { entries } = await stack.contentType('project').entry().find();
  return { props: { projects: entries }, revalidate: 60 };  // never reaches <Projects>
}
```

```tsx
// ✅ GOOD — page destructures `projects` from getStaticProps props and
// threads it down. Use InferGetStaticPropsType so types stay in sync.
export default function Home({ projects }: InferGetStaticPropsType<typeof getStaticProps>) {
  return <Projects projects={projects} />;
}
```

### 3. Catch-all `try/catch` that returns an empty array

```tsx
// ❌ BAD — silently swallows the real error. The page boots; you have
// no idea why the data is missing. Debugging takes hours.
export async function getStaticProps() {
  try {
    const { entries } = await stack.contentType('project').entry().find();
    return { props: { projects: entries }, revalidate: 60 };
  } catch (err) {
    return { props: { projects: [] }, revalidate: 60 };  // ← hides the bug
  }
}
```

Let CMS errors propagate during integration. If the user wants graceful degradation later, they can add it explicitly — don't bake it in during rewire.

### 4. Self-verification before reporting done

After typecheck passes, grep your own work:

```bash
# Look for the original hardcoded titles or sentinel strings in the
# rewired component. They should NOT appear — they should only live in
# the CMS now. If they're still present, the rewire is incomplete.
grep -n 'E-Commerce Platform\|defaultProjects\|projects={\[\]}' src/components/Projects.tsx src/pages/index.tsx 2>/dev/null
```

If grep finds anything, fix it before reporting "done."

---

## Phase D — Verify

Run the project's typecheck if it has one, and confirm the dev server still boots:

```bash
# pick based on detected tooling
pnpm typecheck        # or npm/yarn/bun
pnpm build            # only if typecheck is missing; never start dev server
```

Do **not** start `next dev` / `vite` — the user runs the dev server themselves. Typecheck/build is enough to catch broken imports and type drift.

If the typecheck fails, the failure was caused by the rewire — read the error, fix the offending file, re-run. Do not roll back without telling the user.

Also re-run the anti-pattern grep from above. A typecheck-clean build that still has a `defaultProjects` array is still broken.

---

## Phase E — Report back

> "Rewired 3 components to Contentstack:
> - `Features.tsx` → fetches `feature` (server component)
> - `Testimonials.tsx` → fetches `testimonial` (server component)
> - `Hero.tsx` → fetches `hero` singleton (`entries[0]`)
>
> Typecheck passed. `src/data/features.ts` deleted; `src/data/testimonials.json` kept (still imported by `FeaturedPreview.tsx`).
>
> Want to add **Live Preview** so edits in Contentstack show instantly in the dev preview? (Runs `setup-live-preview`.)"

---

## Constraints

- Do not modify `lib/contentstack.ts` — that's the client from `setup-cms`. Only the components and any data-file imports change.
- Do not introduce a new data-fetching library (React Query, SWR, Apollo). Match what's already in the project.
- Do not change rendering mode (CSR ↔ SSR) just to enable a fetch pattern — if the page is currently a client component, keep it client. If server, keep it server.
- Do not catch-and-swallow fetch errors. Let them propagate so the user sees real failures during integration. Add error boundaries only if the project already has them.
- Never commit the changes. Leave them staged so the user can review the diff before deciding.
- If a component is bound to a **specific entry** (not "all entries of CT"), ask the user for the entry UID or a `title` to query by — don't guess.
