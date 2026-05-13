# Design Tokens, Breakpoints & SEO — Full Type Reference

## Design Token Types (from SDK source)

### Input Format

```typescript
// What you pass to registerDesignTokens()
interface DesignTokensInput {
  [category: string]: {
    [tokenName: string]: {
      value: string;
      title?: string;
      description?: string;
    };
  };
}

// Keys for all design token input categories
type DesignTokensInputKeys = string;
```

### Processed Format

```typescript
// What getDesignTokens() returns
interface DesignTokens<T = string> {
  [category: string]: {
    [tokenName: string]: T;
  };
}

// CSS variable format: "var(--cs-{category}-{tokenName})"
type DesignTokenCssVariable = `var(--cs-${string})`;

// Maps CSS variables to their values
type CssVariablesToValue = Record<DesignTokenCssVariable, string>;

// Maps CSS variables back to token references
type CssVariablesToDesignTokens = Record<string, { category: string; name: string }>;
```

### Design Token Options

```typescript
interface DesignTokensOptionsInput {
  allowedDesignValues?: AllowedDesignValuesLevel;
}

type AllowedDesignValuesLevel = "all" | "none" | "tokens-only";

interface DesignTokensOptions {
  allowedDesignValues: AllowedDesignValues;
}

interface AllowedDesignValues {
  level: AllowedDesignValuesLevel;
}
```

### Section Design Tokens

These are the style sections that can use design tokens:

```typescript
interface SectionDesignTokens {
  size?: Record<string, LengthToken>;
  spacing?: Record<string, LengthToken>;
  position?: Record<string, string>;
  visibility?: Record<string, string>;
  layout?: Record<string, string>;
  typography?: Record<string, string>;
  background?: Record<string, string>;
  shadow?: Record<string, string>;
  effects?: Record<string, string>;
  border?: Record<string, string>;
  transform?: Record<string, string>;
  overflow?: OverflowTokens;
}

interface LengthToken {
  value: number;
  unit: CssLengthUnit;
}

type CssLengthUnit = "px" | "em" | "rem" | "%" | "vw" | "vh" | "vmin" | "vmax" | "ch" | "ex";

interface OverflowTokens {
  overflowX?: string;
  overflowY?: string;
}
```

### Design Classes

```typescript
interface DesignClassValue {
  name: string;
  description?: string;
  styles: Record<string, string>;  // CSS properties
}

interface DesignClasses {
  name: string;
  title?: string;
  description?: string;
  values: DesignClassValue[];
}

interface DesignClassesInput {
  [className: string]: {
    title?: string;
    description?: string;
    values: DesignClassValue[];
  };
}

// Utility type for extracting class names
type DesignClassesNames<T> = {
  [K in keyof T]: string;
};
```

### Registration Example

Use the helper functions exported from `@contentstack/studio-react`. The `DesignRegistry` class is internal and should not be imported.

```typescript
import { registerDesignTokens, registerDesignClasses } from "@contentstack/studio-react";

// Register tokens
registerDesignTokens({
  colors: {
    primary: { value: "#0066CC", title: "Primary" },
    secondary: { value: "#FF6600", title: "Secondary" },
    accent: { value: "#00CC66", title: "Accent" },
    background: { value: "#FFFFFF", title: "Background" },
    surface: { value: "#F5F5F5", title: "Surface" },
    text: { value: "#333333", title: "Text" },
    textLight: { value: "#666666", title: "Text Light" },
    border: { value: "#E0E0E0", title: "Border" },
    error: { value: "#CC0000", title: "Error" },
    success: { value: "#00CC00", title: "Success" },
  },
  typography: {
    heading1: { value: "3rem/1.2 Inter, sans-serif", title: "Heading 1" },
    heading2: { value: "2.25rem/1.3 Inter, sans-serif", title: "Heading 2" },
    heading3: { value: "1.5rem/1.4 Inter, sans-serif", title: "Heading 3" },
    body: { value: "1rem/1.6 Inter, sans-serif", title: "Body" },
    caption: { value: "0.875rem/1.5 Inter, sans-serif", title: "Caption" },
  },
  spacing: {
    xs: { value: "4px", title: "XS" },
    sm: { value: "8px", title: "SM" },
    md: { value: "16px", title: "MD" },
    lg: { value: "24px", title: "LG" },
    xl: { value: "32px", title: "XL" },
    xxl: { value: "48px", title: "XXL" },
    xxxl: { value: "64px", title: "XXXL" },
  },
}, { allowedDesignValues: "all" });

// Register classes
const classNames = registerDesignClasses({
  "card-shadow": {
    title: "Card Shadow",
    values: [
      { name: "none", styles: { boxShadow: "none" } },
      { name: "sm", styles: { boxShadow: "0 1px 2px rgba(0,0,0,0.1)" } },
      { name: "md", styles: { boxShadow: "0 4px 6px rgba(0,0,0,0.1)" } },
      { name: "lg", styles: { boxShadow: "0 10px 15px rgba(0,0,0,0.1)" } },
    ],
  },
});
```

### CSS Variable Generation

The SDK converts tokens to CSS custom properties:

```css
:root {
  --cs-colors-primary: #0066CC;
  --cs-colors-secondary: #FF6600;
  --cs-spacing-md: 16px;
  --cs-typography-heading1: 3rem/1.2 Inter, sans-serif;
}
```

Components can reference them:
```css
.hero { color: var(--cs-colors-primary); padding: var(--cs-spacing-xl); }
```

## Breakpoint Types (from SDK source)

```typescript
// Input format for registration
type BreakpointInput = PreProcessedBreakpoint[];

interface PreProcessedBreakpoint {
  id: string;
  title: string;
  minWidth?: number;
  maxWidth?: number;
  default?: boolean;
  icon?: string;
}

// Processed format
interface Breakpoint {
  id: string;
  title: string;
  minWidth: number;     // Computed from input
  maxWidth: number;     // Computed from input
  default: boolean;
  icon?: string;
  mediaQuery: string;   // Generated: "@media (min-width: Xpx) and (max-width: Ypx)"
}

// Default breakpoint (always has default: true)
interface DefaultBreakpoint extends Breakpoint {
  default: true;
}
```

### Registration Example

Use the helper function — the `BreakpointRegistry` class is internal.

```typescript
import { registerBreakpoints } from "@contentstack/studio-react";

registerBreakpoints([
  {
    id: "desktop",
    title: "Desktop",
    minWidth: 1024,
    icon: "desktop",
    default: true,
  },
  {
    id: "tablet",
    title: "Tablet",
    minWidth: 768,
    maxWidth: 1023,
    icon: "tablet",
  },
  {
    id: "mobile",
    title: "Mobile",
    maxWidth: 767,
    icon: "mobile",
  },
]);
```

### How Breakpoints Work in Composition JSON

Each node's `styles` is keyed by breakpoint ID:

```json
{
  "uid": "node-abc123",
  "type": "header",
  "props": {
    "text": { "type": "string", "value": "Hello World" }
  },
  "styles": {
    "desktop": {
      "typography": { "fontSize": "3rem", "fontWeight": "700" },
      "spacing": { "paddingTop": "64px", "paddingBottom": "64px" }
    },
    "tablet": {
      "typography": { "fontSize": "2rem" },
      "spacing": { "paddingTop": "32px", "paddingBottom": "32px" }
    },
    "mobile": {
      "typography": { "fontSize": "1.5rem" },
      "spacing": { "paddingTop": "16px", "paddingBottom": "16px" }
    }
  }
}
```

The SDK applies styles based on the active breakpoint (viewport width or user selection in editor).

## SEO Metadata

Composition-level SEO data stored in the composition JSON:

```json
{
  "seo": {
    "title": "Page Title — Site Name",
    "description": "Meta description for search engines (150-160 chars)",
    "keywords": ["keyword1", "keyword2"],
    "ogTitle": "Open Graph Title",
    "ogDescription": "Open Graph Description",
    "ogImage": "https://images.contentstack.io/v3/assets/.../og-image.jpg",
    "canonicalUrl": "https://example.com/page",
    "robots": "index,follow",
    "twitterCard": "summary_large_image",
    "twitterTitle": "Twitter Card Title",
    "twitterDescription": "Twitter Card Description",
    "twitterImage": "https://images.contentstack.io/v3/assets/.../twitter-image.jpg"
  }
}
```

## Condition Types (for Data Binding Validation)

The SDK uses conditions to validate data bindings:

```typescript
type ComparisonOperator = "eq" | "ne" | "gt" | "gte" | "lt" | "lte";
type StringOperator = "contains" | "not_contains" | "starts_with" | "ends_with" | "regex";
type ArrayOperator = "includes" | "not_includes" | "length_eq" | "length_gt" | "length_lt";
type BooleanOperator = "is_true" | "is_false";
type SelectOperator = "is" | "is_not" | "any_of" | "none_of";
type ReferenceOperator = "references" | "not_references";
type ImageExtensionOperator = "is" | "is_not";

interface NumberCondition {
  field: string;
  operator: ComparisonOperator;
  value: number;
}

interface StringCondition {
  field: string;
  operator: ComparisonOperator | StringOperator;
  value: string;
}

interface BooleanCondition {
  field: string;
  operator: BooleanOperator;
}

interface ArrayCondition {
  field: string;
  operator: ArrayOperator;
  value?: unknown;
}

interface DateCondition {
  field: string;
  operator: ComparisonOperator;
  value: string; // ISO 8601
}

interface SelectCondition {
  field: string;
  operator: SelectOperator;
  value: string | string[];
}

interface ReferenceCondition {
  field: string;
  operator: ReferenceOperator;
  value: { uid: string; _content_type_uid: string };
}

interface ImageCondition {
  field: string;
  extension?: { operator: ImageExtensionOperator; value: string };
  size?: { operator: ComparisonOperator; value: number; unit: "bytes" | "kb" | "mb" };
}

// Union of all conditions
type Condition =
  | NumberCondition
  | StringCondition
  | BooleanCondition
  | ArrayCondition
  | ModularBlockCondition
  | DateCondition
  | SelectCondition
  | ReferenceCondition
  | ImageCondition;
```

## Agent Rules

1. Always include `desktop` breakpoint styles when creating nodes — it's the default
2. Use design token CSS variables (`var(--cs-colors-primary)`) instead of hardcoded values when tokens are registered
3. Mobile-first approach: set base styles on smallest breakpoint, override for larger
4. Image components must always have `alt` text prop set
5. Every page composition should set `seo.title` and `seo.description`
6. Responsive styles only override what changes — don't repeat unchanged properties across breakpoints
7. When the agent creates responsive layouts, ensure the grid/flex container adjusts columns for mobile
