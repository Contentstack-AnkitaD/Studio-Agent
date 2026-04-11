/**
 * Component Schema Definitions for Polaris AI
 *
 * Source: composable-studio-sdk (alpha branch)
 *   packages/studio-react-components/src/componentDefinitions/
 *   packages/studio-registry/src/component-registry/registry.constant.ts
 *
 * MAINTENANCE RULES:
 * - Keep this file in sync with studio-react-components/src/componentDefinitions
 * - Add new components here when they're created in the SDK
 * - Update prop definitions when component APIs change
 *
 * LAST VERIFIED: April 11, 2026 (SDK alpha branch)
 *
 * COMMON MISTAKES — these component types DO NOT EXIST:
 *   paragraph → use "text"
 *   container → use "box"
 *   flex      → use "hstack" or "vstack"
 *   grid      → use "hstack"
 *   columns   → use "hstack"
 *   richtext  → use "json-rte"
 *   html      → use "html-element"
 *   divider   → use "separator"
 *   accordion → use "collapsible"
 *
 * COMMON PROP MISTAKES:
 *   header: "headingTag" → correct: "Tag" (capital T)
 *   button: "text" → correct: "label"
 *   button: "href" → correct: "link"
 */

export interface ComponentPropDefinition {
  type:
    | "string"
    | "imageurl"
    | "href"
    | "choice"
    | "boolean"
    | "slot"
    | "array"
    | "number"
    | "datestring"
    | "object"
    | "any"
    | "json_rte";
  displayName?: string;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { value: string; label: string }[];
  control?: string;
  helpText?: string;
  min?: number;
  max?: number;
  countProp?: string;
}

export interface ComponentSchema {
  type: string;
  displayName: string;
  description: string;
  category: "basic" | "container" | "advanced" | "system";
  props: Record<string, ComponentPropDefinition>;
  commonMistakes?: string[];
}

export const COMPONENT_SCHEMAS: ComponentSchema[] = [
  // ===== BASIC COMPONENTS =====
  {
    type: "header",
    displayName: "Header",
    description: "Heading element (h1-h6)",
    category: "basic",
    props: {
      text: { type: "string", displayName: "Text", defaultValue: "Title", placeholder: "Welcome to Studio" },
      Tag: { type: "choice", displayName: "Heading Level", defaultValue: ["h1"], options: [{ value: "h1", label: "H1" }, { value: "h2", label: "H2" }, { value: "h3", label: "H3" }, { value: "h4", label: "H4" }, { value: "h5", label: "H5" }, { value: "h6", label: "H6" }], control: "dropdown" },
    },
    commonMistakes: ["Use 'Tag' (capital T) not 'tag', 'headingTag', or 'level'"],
  },
  {
    type: "text",
    displayName: "Paragraph",
    description: "Text/paragraph element. Type is 'text' not 'paragraph'",
    category: "basic",
    props: {
      text: { type: "string", displayName: "Text", defaultValue: "Your text here", placeholder: "Your text here" },
    },
    commonMistakes: ["Type is 'text' NOT 'paragraph'"],
  },
  {
    type: "number",
    displayName: "Number",
    description: "Displays a number value",
    category: "basic",
    props: {
      number: { type: "number", displayName: "Number", defaultValue: 0 },
    },
  },
  {
    type: "button",
    displayName: "Button",
    description: "Clickable button with label and link",
    category: "basic",
    props: {
      label: { type: "string", displayName: "Label", defaultValue: "Button", placeholder: "Button" },
      link: { type: "href", displayName: "Link", placeholder: "https://www.contentstack.com", helpText: "Where should the button redirect to?" },
      openInNewTab: { type: "boolean", displayName: "Open in New Tab", defaultValue: false },
    },
    commonMistakes: ["Use 'label' NOT 'text' for button text", "Use 'link' NOT 'href' for destination"],
  },
  {
    type: "link",
    displayName: "Link",
    description: "Clickable text link",
    category: "basic",
    props: {
      href: { type: "href", displayName: "Link URL", defaultValue: "https://www.contentstack.com" },
      label: { type: "string", displayName: "Label", defaultValue: "Link Label" },
      openInNewTab: { type: "boolean", displayName: "Open in new tab", defaultValue: false },
    },
  },
  {
    type: "link-container",
    displayName: "Link Container",
    description: "Makes child components clickable (e.g., clickable cards)",
    category: "basic",
    props: {
      href: { type: "href", displayName: "Link URL", defaultValue: "https://www.contentstack.com" },
      openInNewTab: { type: "boolean", displayName: "Open in new tab", defaultValue: false },
      children: { type: "slot", displayName: "Contents" },
    },
  },
  {
    type: "image",
    displayName: "Image",
    description: "Image element",
    category: "basic",
    props: {
      src: { type: "imageurl", displayName: "Image" },
      alt: { type: "string", displayName: "Alt Text", placeholder: "Enter the alt text here" },
    },
  },
  {
    type: "video",
    displayName: "Video",
    description: "Video player",
    category: "basic",
    props: {
      src: { type: "string", displayName: "Video URL", placeholder: "Enter the video URL here" },
      posterSrc: { type: "imageurl", displayName: "Poster" },
    },
  },
  {
    type: "embed",
    displayName: "Embed",
    description: "Embed external content (YouTube, maps, etc.)",
    category: "basic",
    props: {
      src: { type: "href", displayName: "Embed URL", defaultValue: "https://example.com" },
    },
  },
  {
    type: "json-rte",
    displayName: "JSON RTE",
    description: "Rich text editor. Type is 'json-rte' not 'richtext'",
    category: "basic",
    props: {
      jsonData: { type: "json_rte", displayName: "JSON RTE Data" },
    },
    commonMistakes: ["Type is 'json-rte' NOT 'richtext'", "Prop is 'jsonData' NOT 'content'"],
  },
  {
    type: "plain-text",
    displayName: "Plain Text",
    description: "Plain text node (for use inside html-element)",
    category: "basic",
    props: {
      text: { type: "string", displayName: "Text", defaultValue: "Your text here" },
    },
  },
  {
    type: "collapsible-text",
    displayName: "Collapsible Text",
    description: "Text with show more/less toggle",
    category: "basic",
    props: {
      text: { type: "string", displayName: "Text", control: "large" },
      maxLines: { type: "number", displayName: "Max Lines", defaultValue: 3, min: 1 },
      buttonAction: { type: "choice", displayName: "Button Action", defaultValue: ["expand"], options: [{ value: "expand", label: "Expand" }, { value: "redirect", label: "Redirect" }] },
      showMoreText: { type: "string", displayName: "Show More Text", defaultValue: "Show More" },
      showLessText: { type: "string", displayName: "Show Less Text", defaultValue: "Show Less" },
      redirectUrl: { type: "href", displayName: "Redirect URL" },
      buttonOnNewLine: { type: "boolean", displayName: "Button On New Line", defaultValue: false },
      openInNewTab: { type: "boolean", displayName: "Open in new tab", defaultValue: false },
    },
  },
  {
    type: "html-element",
    displayName: "HTML Element",
    description: "Custom HTML tag. Type is 'html-element' not 'html'",
    category: "basic",
    props: {
      Tag: { type: "string", displayName: "HTML Tag", defaultValue: "div" },
      properties: { type: "string", displayName: "Properties" },
      children: { type: "slot", displayName: "Contents" },
    },
    commonMistakes: ["Type is 'html-element' NOT 'html'"],
  },
  {
    type: "style-sheet",
    displayName: "Style Sheet",
    description: "CSS stylesheet for custom styles",
    category: "basic",
    props: {
      styles: { type: "string", displayName: "Styles", defaultValue: "/* .header { color: red; } */", control: "large" },
    },
  },

  // ===== CONTAINER COMPONENTS =====
  {
    type: "section",
    displayName: "Section",
    description: "Top-level page section",
    category: "container",
    props: { children: { type: "slot", displayName: "Contents" } },
  },
  {
    type: "box",
    displayName: "Box",
    description: "Generic container. Type is 'box' not 'container'",
    category: "container",
    props: { children: { type: "slot", displayName: "Contents" } },
    commonMistakes: ["Type is 'box' NOT 'container'"],
  },
  {
    type: "hstack",
    displayName: "Columns",
    description: "Horizontal layout. Type is 'hstack' not 'flex' or 'columns' or 'grid'",
    category: "container",
    props: {
      count: { type: "number", displayName: "Number of Columns", defaultValue: 3, min: 1, max: 12 },
      children: { type: "slot", displayName: "Contents", countProp: "count" },
    },
    commonMistakes: ["Type is 'hstack' NOT 'flex', 'columns', or 'grid'"],
  },
  {
    type: "vstack",
    displayName: "Rows",
    description: "Vertical layout. Type is 'vstack' not 'rows'",
    category: "container",
    props: {
      count: { type: "number", displayName: "Number of Rows", defaultValue: 3, min: 1, max: 12 },
      children: { type: "slot", displayName: "Contents", countProp: "count" },
    },
  },
  {
    type: "repeater",
    displayName: "Repeater",
    description: "Iterates over array data, renders template per item",
    category: "container",
    props: {
      items: { type: "array", displayName: "Items" },
      children: { type: "slot", displayName: "Contents" },
    },
  },
  {
    type: "condition-block",
    displayName: "Condition Block",
    description: "Conditional rendering (used inside repeaters for modular blocks)",
    category: "container",
    props: { children: { type: "slot", displayName: "Contents" } },
  },
  {
    type: "fragment",
    displayName: "Fragment",
    description: "Invisible wrapper (no DOM element)",
    category: "container",
    props: { ui: { type: "slot", displayName: "Contents" } },
  },

  // ===== ADVANCED COMPONENTS =====
  {
    type: "alert",
    displayName: "Alert",
    description: "Alert/notification banner",
    category: "advanced",
    props: {
      title: { type: "string", displayName: "Title" },
      message: { type: "string", displayName: "Message" },
      src: { type: "imageurl", displayName: "Icon" },
      alt: { type: "string", displayName: "Icon Alt Text" },
    },
  },
  {
    type: "avatar",
    displayName: "Avatar",
    description: "User avatar with fallback",
    category: "advanced",
    props: {
      src: { type: "imageurl", displayName: "Avatar Image" },
      fallbackText: { type: "string", displayName: "Fallback Text" },
    },
  },
  {
    type: "badge",
    displayName: "Badge",
    description: "Small label badge",
    category: "advanced",
    props: { text: { type: "string", displayName: "Badge", defaultValue: "badge" } },
  },
  {
    type: "bread-crumb",
    displayName: "Breadcrumb",
    description: "Navigation breadcrumb",
    category: "advanced",
    props: { breadcrumbItems: { type: "array", displayName: "Breadcrumb Items" } },
  },
  {
    type: "card",
    displayName: "Card",
    description: "Card with 3 named slots: header, children, footer",
    category: "advanced",
    props: {
      header: { type: "slot", displayName: "Title" },
      children: { type: "slot", displayName: "Content" },
      footer: { type: "slot", displayName: "Footer" },
    },
  },
  {
    type: "collapsible",
    displayName: "Collapsible",
    description: "Expandable section. Type is 'collapsible' not 'accordion'",
    category: "advanced",
    props: {
      header: { type: "string", defaultValue: "Collapsible Header" },
      content: { type: "string", defaultValue: "Collapsible Content" },
    },
    commonMistakes: ["Type is 'collapsible' NOT 'accordion'"],
  },
  {
    type: "drawer",
    displayName: "Drawer",
    description: "Slide-out panel",
    category: "advanced",
    props: {
      label: { type: "string", displayName: "Label", defaultValue: "Open Drawer" },
      children: { type: "slot", displayName: "Contents" },
    },
  },
  {
    type: "hover-card",
    displayName: "Hover Card",
    description: "Content on hover",
    category: "advanced",
    props: {
      trigger: { type: "slot", displayName: "Hover Target" },
      hoverCardContent: { type: "slot", displayName: "Hover Content" },
    },
  },
  {
    type: "menubar",
    displayName: "Menu Bar",
    description: "Navigation menu with submenus",
    category: "advanced",
    props: { menu: { type: "array", displayName: "Menu Items" } },
  },
  {
    type: "popover",
    displayName: "Popover",
    description: "Content on click",
    category: "advanced",
    props: {
      triggerText: { type: "string", displayName: "Trigger Text", defaultValue: "Click me" },
      position: { type: "choice", displayName: "Position", defaultValue: ["top"], options: [{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }] },
      children: { type: "slot", displayName: "Contents" },
    },
  },
  {
    type: "progress",
    displayName: "Progress",
    description: "Progress bar",
    category: "advanced",
    props: { value: { type: "number", displayName: "Progress Bar", defaultValue: 66, min: 0, max: 100 } },
  },
  {
    type: "separator",
    displayName: "Separator",
    description: "Visual divider. Type is 'separator' not 'divider'",
    category: "advanced",
    props: {
      orientation: { type: "choice", displayName: "Orientation", defaultValue: ["horizontal"], options: [{ value: "horizontal", label: "Horizontal" }, { value: "vertical", label: "Vertical" }] },
    },
    commonMistakes: ["Type is 'separator' NOT 'divider'"],
  },
  {
    type: "skeleton",
    displayName: "Skeleton",
    description: "Loading placeholder",
    category: "advanced",
    props: {},
  },
  {
    type: "tooltip",
    displayName: "Tooltip",
    description: "Tooltip on hover",
    category: "advanced",
    props: {
      text: { type: "string", displayName: "Tooltip Text", defaultValue: "Tooltip text" },
      children: { type: "slot", displayName: "Contents" },
    },
  },

  // ===== SYSTEM COMPONENTS (DO NOT CREATE) =====
  {
    type: "page",
    displayName: "Page",
    description: "Root page (system — never create)",
    category: "system",
    props: { children: { type: "slot", displayName: "Contents" } },
  },
  {
    type: "symbol",
    displayName: "Symbol",
    description: "Shared component instance (system — never create directly)",
    category: "system",
    props: { ui: { type: "slot" } },
  },
];
