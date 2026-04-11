---
name: register-breakpoints
description: Configure responsive breakpoints for Studio — extract from existing media queries or CSS framework config
type: skill
agent: polaris-agent
triggers: ["breakpoints", "responsive", "media queries", "mobile tablet desktop", "register breakpoints"]
---

# Register Breakpoints — Set Up Responsive Editing

## When to Use

- "Set up responsive breakpoints for Studio"
- "I need mobile, tablet, and desktop views"
- "Import my media queries into Studio"
- "Configure breakpoints matching my Tailwind config"

## Step 1: Find Existing Breakpoints

```bash
# Tailwind config
grep -A 10 "screens" tailwind.config* 2>/dev/null

# CSS media queries
grep -r "@media" src/ --include="*.css" --include="*.scss" | head -20

# Styled-components breakpoints
grep -r "breakpoint\|mediaQuery\|screen" src/ --include="*.ts" --include="*.tsx" | head -10
```

## Step 2: Extract & Convert

### From Tailwind

```javascript
// tailwind.config.js
screens: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' }
```

Convert:
```typescript
export const breakpoints = [
  { id: "desktop", title: "Desktop", minWidth: 1280, default: true },
  { id: "laptop", title: "Laptop", minWidth: 1024, maxWidth: 1279 },
  { id: "tablet", title: "Tablet", minWidth: 768, maxWidth: 1023 },
  { id: "mobile", title: "Mobile", maxWidth: 767 },
];
```

### From CSS Media Queries

```css
@media (max-width: 768px) { /* mobile */ }
@media (min-width: 769px) and (max-width: 1024px) { /* tablet */ }
@media (min-width: 1025px) { /* desktop */ }
```

Convert:
```typescript
export const breakpoints = [
  { id: "desktop", title: "Desktop", minWidth: 1025, default: true },
  { id: "tablet", title: "Tablet", minWidth: 769, maxWidth: 1024 },
  { id: "mobile", title: "Mobile", maxWidth: 768 },
];
```

### Default (No Existing Breakpoints)

```typescript
export const breakpoints = [
  { id: "desktop", title: "Desktop", minWidth: 1024, default: true },
  { id: "tablet", title: "Tablet", minWidth: 768, maxWidth: 1023 },
  { id: "mobile", title: "Mobile", maxWidth: 767 },
];
```

## Step 3: Create File & Register

```typescript
// src/studio/breakpoints.ts
export const breakpoints = [
  { id: "desktop", title: "Desktop", minWidth: 1024, default: true, icon: "desktop" },
  { id: "tablet", title: "Tablet", minWidth: 768, maxWidth: 1023, icon: "tablet" },
  { id: "mobile", title: "Mobile", maxWidth: 767, icon: "mobile" },
];
```

Add to SDK config:
```typescript
// src/studio/config.ts
import { breakpoints } from "./breakpoints";

const sdk = new ComposableStudioSDK({
  components: registeredComponents,
  designTokens: designTokens,
  breakpoints: breakpoints,     // ← Add this
});
```

## Rules

1. Exactly ONE breakpoint must have `default: true` (usually desktop)
2. Breakpoint ranges must not overlap and must not have gaps
3. Keep it to 3-4 breakpoints max — more adds complexity without value
4. Match the project's existing responsive behavior
