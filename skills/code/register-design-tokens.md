---
name: register-design-tokens
description: Extract design tokens from existing theme/design system files and register them with Studio SDK — colors, typography, spacing
type: skill
agent: polaris-agent
triggers: ["register tokens", "design tokens", "register my theme", "colors to studio", "typography to studio", "import theme", "sync design system"]
---

# Register Design Tokens — Import Theme into Studio

## When to Use

User has an existing design system/theme and wants it in Studio:
- "Register all my design tokens"
- "Import my Tailwind theme into Studio"
- "Sync my design system colors to Studio"
- "Make my spacing scale available in the style panel"

## Step 1: Find the Design System Source

Search for theme/token files:

```bash
# Common locations
find src -name "theme*" -o -name "tokens*" -o -name "design*" -o -name "variables*" | grep -E "\.(ts|tsx|js|jsx|css|scss)$"

# Tailwind config
find . -name "tailwind.config*" -maxdepth 2

# CSS custom properties
grep -r "\\-\\-color" src/ --include="*.css" --include="*.scss" -l | head -5

# Styled-components / emotion theme
grep -r "ThemeProvider\|createTheme\|theme =" src/ --include="*.ts" --include="*.tsx" -l | head -5
```

Read the files to understand the current design system structure.

## Step 2: Extract Tokens

### From Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    colors: {
      primary: '#0066CC',
      secondary: '#FF6600',
      gray: { 100: '#F5F5F5', 500: '#666', 900: '#333' },
    },
    spacing: { 1: '4px', 2: '8px', 4: '16px', 8: '32px', 16: '64px' },
    fontSize: { sm: '0.875rem', base: '1rem', lg: '1.25rem', xl: '1.5rem', '3xl': '2rem' },
  }
}
```

Convert to Studio format:
```typescript
export const designTokens = {
  colors: {
    primary: { value: "#0066CC", title: "Primary" },
    secondary: { value: "#FF6600", title: "Secondary" },
    "gray-100": { value: "#F5F5F5", title: "Gray 100" },
    "gray-500": { value: "#666666", title: "Gray 500" },
    "gray-900": { value: "#333333", title: "Gray 900" },
  },
  spacing: {
    xs: { value: "4px", title: "XS (4px)" },
    sm: { value: "8px", title: "SM (8px)" },
    md: { value: "16px", title: "MD (16px)" },
    lg: { value: "32px", title: "LG (32px)" },
    xl: { value: "64px", title: "XL (64px)" },
  },
  typography: {
    sm: { value: "0.875rem", title: "Small" },
    base: { value: "1rem", title: "Base" },
    lg: { value: "1.25rem", title: "Large" },
    xl: { value: "1.5rem", title: "XL" },
    "3xl": { value: "2rem", title: "3XL" },
  },
};
```

### From CSS Custom Properties

```css
:root {
  --color-brand: #0066CC;
  --color-accent: #FF6600;
  --font-heading: 'Inter', sans-serif;
  --font-body: 'Open Sans', sans-serif;
  --space-sm: 8px;
  --space-md: 16px;
}
```

Convert:
```typescript
export const designTokens = {
  colors: {
    brand: { value: "#0066CC", title: "Brand" },
    accent: { value: "#FF6600", title: "Accent" },
  },
  typography: {
    heading: { value: "'Inter', sans-serif", title: "Heading Font" },
    body: { value: "'Open Sans', sans-serif", title: "Body Font" },
  },
  spacing: {
    sm: { value: "8px", title: "Small" },
    md: { value: "16px", title: "Medium" },
  },
};
```

### From JavaScript Theme Object

```typescript
// theme.ts
export const theme = {
  colors: { primary: '#0066CC', success: '#00CC66', error: '#CC0000' },
  fonts: { heading: 'Inter', body: 'Open Sans' },
  radii: { sm: '4px', md: '8px', lg: '16px', full: '9999px' },
};
```

Convert:
```typescript
export const designTokens = {
  colors: {
    primary: { value: "#0066CC", title: "Primary" },
    success: { value: "#00CC66", title: "Success" },
    error: { value: "#CC0000", title: "Error" },
  },
  typography: {
    heading: { value: "Inter, sans-serif", title: "Heading" },
    body: { value: "Open Sans, sans-serif", title: "Body" },
  },
  border: {
    "radius-sm": { value: "4px", title: "Small Radius" },
    "radius-md": { value: "8px", title: "Medium Radius" },
    "radius-lg": { value: "16px", title: "Large Radius" },
    "radius-full": { value: "9999px", title: "Full Radius" },
  },
};
```

## Step 3: Create the Token Registration File

```typescript
// src/studio/design-tokens.ts

import type { DesignTokensInput } from "@contentstack/studio-react";

export const designTokens: DesignTokensInput = {
  colors: {
    // Brand colors
    primary: { value: "#0066CC", title: "Primary" },
    "primary-light": { value: "#3399FF", title: "Primary Light" },
    "primary-dark": { value: "#004499", title: "Primary Dark" },
    secondary: { value: "#FF6600", title: "Secondary" },

    // Neutral colors
    white: { value: "#FFFFFF", title: "White" },
    black: { value: "#000000", title: "Black" },
    "gray-50": { value: "#FAFAFA", title: "Gray 50" },
    "gray-100": { value: "#F5F5F5", title: "Gray 100" },
    "gray-200": { value: "#E5E5E5", title: "Gray 200" },
    "gray-500": { value: "#737373", title: "Gray 500" },
    "gray-700": { value: "#404040", title: "Gray 700" },
    "gray-900": { value: "#171717", title: "Gray 900" },

    // Semantic colors
    success: { value: "#16A34A", title: "Success" },
    warning: { value: "#EAB308", title: "Warning" },
    error: { value: "#DC2626", title: "Error" },
    info: { value: "#2563EB", title: "Info" },
  },

  spacing: {
    "2xs": { value: "2px", title: "2XS (2px)" },
    xs: { value: "4px", title: "XS (4px)" },
    sm: { value: "8px", title: "SM (8px)" },
    md: { value: "16px", title: "MD (16px)" },
    lg: { value: "24px", title: "LG (24px)" },
    xl: { value: "32px", title: "XL (32px)" },
    "2xl": { value: "48px", title: "2XL (48px)" },
    "3xl": { value: "64px", title: "3XL (64px)" },
    "4xl": { value: "96px", title: "4XL (96px)" },
  },

  typography: {
    "display": { value: "4rem/1.1 Inter, sans-serif", title: "Display" },
    "heading-1": { value: "3rem/1.2 Inter, sans-serif", title: "Heading 1" },
    "heading-2": { value: "2.25rem/1.3 Inter, sans-serif", title: "Heading 2" },
    "heading-3": { value: "1.5rem/1.4 Inter, sans-serif", title: "Heading 3" },
    "heading-4": { value: "1.25rem/1.4 Inter, sans-serif", title: "Heading 4" },
    body: { value: "1rem/1.6 Inter, sans-serif", title: "Body" },
    "body-sm": { value: "0.875rem/1.5 Inter, sans-serif", title: "Body Small" },
    caption: { value: "0.75rem/1.4 Inter, sans-serif", title: "Caption" },
  },
};
```

## Step 4: Register via the helper function

Call `registerDesignTokens(...)` at module load — there is no `ComposableStudioSDK` class to construct. The tokens become available to the renderer once registered.

```typescript
// src/studio/design-tokens.ts
import { registerDesignTokens, type DesignTokensInput } from "@contentstack/studio-react";

export const designTokens: DesignTokensInput = {
  colors:     { /* ... */ },
  spacing:    { /* ... */ },
  typography: { /* ... */ },
};

registerDesignTokens(designTokens);
```

Then `import "./design-tokens"` from `src/studio/index.ts` so the registration runs before `studioSdk.init({ stackSdk })`. See the `setup-sdk` skill for the wiring sequence.

## Step 5: Verify

After registering:
1. Open Studio → select a component
2. Open the Style panel
3. Color pickers should show registered color tokens
4. Spacing inputs should show spacing token presets
5. Typography dropdowns should show font presets

## Token Categories Guide

| Category | What Goes In | Examples |
|----------|-------------|---------|
| `colors` | All color values | brand, neutral, semantic, background, text |
| `spacing` | Margin/padding scale | xs through 4xl |
| `typography` | Font families, sizes, line heights | heading, body, caption |
| `border` | Border widths, radii | radius-sm, radius-lg |
| `shadow` | Box shadow values | sm, md, lg |
| `effects` | Opacity, filters | blur values |

## Common Mistakes

1. **Not importing in config** — Token file must be imported and passed to SDK
2. **Using RGB without #** — Values must be valid CSS: `"#0066CC"` not `"0066CC"`
3. **Duplicate token names** — Names must be unique within a category
4. **Missing title** — Always include `title` for human-readable display in Studio
5. **Not matching existing theme** — Tokens should mirror the project's actual theme, not generic values
