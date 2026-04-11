/**
 * Data Binding Rules - Single Source of Truth
 * 
 * This file defines the type compatibility rules for data binding.
 * These rules determine which CMS field types can be bound to which component prop types.
 * 
 * These rules are enforced by the frontend UI (TreeNode.tsx) and must match exactly.
 * 
 * Architecture: Backend is the single source of truth for system rules.
 * Frontend only sends dynamic data (composition, pageData, designTokens, etc.)
 */

export interface DataBindingRules {
  typeCompatibility: {
    [propType: string]: string[]; // prop type → allowed CMS field types
  };
  specialRules: {
    cssBinding: string[]; // CSS bindings only accept these field types
    conditionMode: string[]; // Condition mode allows these types with children
  };
  examples: {
    valid: Array<{
      propType: string;
      fieldType: string;
      description: string;
    }>;
    invalid: Array<{
      propType: string;
      fieldType: string;
      reason: string;
    }>;
  };
  entryBindingRules: {
    templateEntry: {
      bindingType: string;
      pathFormat: string;
      examples: Array<{ path: string; description: string }>;
    };
    linkedEntry: {
      bindingType: string;
      pathFormat: string;
      examples: Array<{ path: string; description: string }>;
    };
  };
}

/**
 * Data Binding Type Compatibility Rules
 * 
 * Based on frontend implementation in TreeNode.tsx (isBindable logic)
 * These rules ensure LLM only suggests valid bindings that the frontend will accept.
 */
export const DATA_BINDING_RULES: DataBindingRules = {
  /**
   * Type Compatibility Mapping
   * 
   * Maps component prop types to allowed CMS field types.
   * If a prop type is not listed, it cannot bind to any CMS field.
   */
  typeCompatibility: {
    // Primitive types
    string: ["text"], // string prop → text fields only
    number: ["number"], // number prop → number fields only
    boolean: ["boolean"], // boolean prop → boolean fields only
    
    // Complex types
    object: ["json", "file"], // object prop → json or file fields
    array: ["blocks", "file"], // array prop → blocks or file fields
    
    // Special types
    datestring: ["isodate", "text"], // date prop → isodate or text fields
    href: ["text"], // href prop → text fields only
    imageurl: ["text", "file"], // imageurl prop → text or file fields
    choice: ["text"], // choice prop → text fields only
    json_rte: ["json_rte"], // json_rte prop → json_rte fields only (if field.multiple === false)
    
    // Special cases
    slot: [], // slot prop → NEVER bindable (slots are for components, not data)
    any: ["*"], // any prop → can bind to ALL field types (special case: always returns true)
  },

  /**
   * Special Rules
   * 
   * Context-specific rules that override or supplement type compatibility.
   */
  specialRules: {
    // CSS bindings (for style properties) only accept text fields
    cssBinding: ["text"],
    
    // Condition mode allows these types with children
    conditionMode: ["reference", "blocks", "file", "select"],
  },

  /**
   * Examples
   * 
   * Valid and invalid binding examples to guide the LLM.
   */
  examples: {
    valid: [
      {
        propType: "string",
        fieldType: "text",
        description: "title (string prop) → entry.title (text field)",
      },
      {
        propType: "number",
        fieldType: "number",
        description: "count (number prop) → entry.views (number field)",
      },
      {
        propType: "boolean",
        fieldType: "boolean",
        description: "isActive (boolean prop) → entry.published (boolean field)",
      },
      {
        propType: "imageurl",
        fieldType: "text",
        description: "image (imageurl prop) → entry.banner.url (text field)",
      },
      {
        propType: "imageurl",
        fieldType: "file",
        description: "image (imageurl prop) → entry.banner (file field)",
      },
      {
        propType: "href",
        fieldType: "text",
        description: "link (href prop) → entry.cta.url (text field)",
      },
      {
        propType: "object",
        fieldType: "json",
        description: "metadata (object prop) → entry.custom_data (json field)",
      },
      {
        propType: "array",
        fieldType: "blocks",
        description: "items (array prop) → entry.content_blocks (blocks field)",
      },
    ],
    invalid: [
      {
        propType: "number",
        fieldType: "text",
        reason: "Cannot bind text field to number prop - type mismatch",
      },
      {
        propType: "boolean",
        fieldType: "number",
        reason: "Cannot bind number field to boolean prop - type mismatch",
      },
      {
        propType: "string",
        fieldType: "boolean",
        reason: "Cannot bind boolean field to string prop - type mismatch",
      },
      {
        propType: "slot",
        fieldType: "text",
        reason: "Slot props cannot bind to CMS data - slots are for component composition",
      },
    ],
  },

  /**
   * Entry Binding Rules
   * 
   * Rules for binding to template entries vs linked entries.
   * The binding path format differs based on entry type.
   */
  entryBindingRules: {
    /**
     * Template Entry (Preview Entry) - The main page entry
     * - Located in: context.templateEntry
     * - Binding format: Simple path only (e.g., "title", "banner.url")
     * - Binding type: "template"
     */
    templateEntry: {
      bindingType: "template",
      pathFormat: "field_path_only", // e.g., "title", "banner.url"
      examples: [
        { path: "title", description: "Template entry title field" },
        { path: "banner.url", description: "Template entry nested banner.url field" },
        { path: "content_blocks[0].title", description: "Template entry array item field" },
      ],
    },
    /**
     * Linked Entry (Referenced Entry) - Entries referenced by template entry
     * - Located in: context.linkedEntries array
     * - Binding format: Entry identifier + path (e.g., "content_type_uid:entry_uid.title")
     * - Binding type: "contentstack"
     */
    linkedEntry: {
      bindingType: "contentstack",
      pathFormat: "content_type_uid:entry_uid.field_path", // e.g., "blog_post:abc123.title"
      examples: [
        { path: "blog_post:abc123.title", description: "Linked blog post entry's title field" },
        { path: "author:xyz789.name", description: "Linked author entry's name field" },
        { path: "category:def456.title", description: "Linked category entry's title field" },
      ],
    },
  },
};

/**
 * Format data binding rules for LLM prompt
 * 
 * Converts the rules object into a markdown-formatted string for inclusion in the system prompt.
 */
export function formatDataBindingRulesForPrompt(): string {
  const rules = DATA_BINDING_RULES;

  // Build type compatibility table
  const compatibilityRows = Object.entries(rules.typeCompatibility)
    .map(([propType, allowedFields]) => {
      const allowed = allowedFields.length > 0 
        ? allowedFields.join(", ")
        : "❌ NEVER bindable";
      const notAllowed = propType === "any" 
        ? "none (binds to all)"
        : propType === "slot"
        ? "all fields"
        : getAllFieldTypes().filter(f => !allowedFields.includes(f)).join(", ");
      
      return `| \`${propType}\` | ${allowed} | ${notAllowed} |`;
    })
    .join("\n");

  // Build valid examples
  const validExamples = rules.examples.valid
    .map(ex => `- \`${ex.propType}\` prop → \`${ex.fieldType}\` field: ${ex.description} ✅`)
    .join("\n");

  // Build invalid examples
  const invalidExamples = rules.examples.invalid
    .map(ex => `- \`${ex.propType}\` prop → \`${ex.fieldType}\` field: ${ex.reason} ❌`)
    .join("\n");

  // Build entry binding rules
  const templateEntryExamples = rules.entryBindingRules.templateEntry.examples
    .map(ex => `- \`${ex.path}\`: ${ex.description}`)
    .join("\n");

  const linkedEntryExamples = rules.entryBindingRules.linkedEntry.examples
    .map(ex => `- \`${ex.path}\`: ${ex.description}`)
    .join("\n");

  return `
## 🔗 DATA BINDING RULES

**🚨 CRITICAL RULE #1: WHEN TO USE BINDINGS vs staticString**

**IF user message contains \`@blt\` (entry reference) OR linkedEntries exist:**
- ✅ **USE**: \`{ "binding": { "type": "contentstack", "value": { "uid": "...", "_content_type_uid": "...", "path": { "fieldName": {} } } } }\`
- ❌ **NEVER USE**: \`{ "staticString": "hardcoded value" }\` alone
- 🎯 **WHY**: User linked the entry BECAUSE they want DYNAMIC CMS content, not static text!
- ⚠️ **FAILURE TO BIND = TASK FAILURE!**

**IF no linkedEntries and user didn't specify CMS binding:**
- ✅ **USE**: \`{ "staticString": "placeholder text" }\`
- 🎯 **WHY**: No CMS data available to bind to

**Example - CORRECT (user linked entry):**
\`\`\`json
{
  "text": {
    "type": "string",
    "binding": {
      "type": "contentstack",
      "value": {
        "uid": "blt3bd0bf3c584d1116",
        "_content_type_uid": "whats_new",
        "path": { "title": {} }
      }
    }
  }
}
\`\`\`

**Example - WRONG (user linked entry but you used staticString):**
\`\`\`json
{
  "text": {
    "type": "string",
    "staticString": "WHAT'S NEW"  // ❌ WRONG! Should use binding above!
  }
}
\`\`\`

---

## 🔗 PROP TYPE TO FIELD TYPE COMPATIBILITY

**🚨 CRITICAL RULE #2: Only certain CMS field types can bind to certain prop types!**

The frontend enforces type compatibility. If you suggest an incompatible binding, it will be disabled in the UI, causing user confusion.

### Type Compatibility Rules

**Component Prop Types → CMS Field Types:**

| Prop Type | Can Bind To | Cannot Bind To |
|-----------|-------------|----------------|
${compatibilityRows}

### Special Cases

1. **\`any\` prop type**: Can bind to ANY field type (most flexible)
2. **\`slot\` prop type**: NEVER bindable (slots are for components, not data)
3. **\`json_rte\` prop type**: Only binds to json_rte fields, and only if the field is NOT multiple
4. **CSS bindings**: Always use text fields only (for style properties)

### Examples

**✅ VALID Bindings:**
${validExamples}

**❌ INVALID Bindings (Frontend will disable):**
${invalidExamples}

### Rules for Binding Selection

**Before creating a binding:**
1. ✅ Check the prop type from component schema (see "AVAILABLE COMPONENTS" section)
2. ✅ Check the CMS field type from pageData section
3. ✅ Verify compatibility using the table above
4. ✅ If incompatible → Use staticString instead or ask user for compatible field

**If prop type is \`any\`:**
- ✅ Can bind to any field type
- ✅ Most flexible option

**If prop type is \`slot\`:**
- ❌ NEVER create a binding
- ✅ Slots are for components, not data

**If prop type is \`json_rte\`:**
- ✅ Only bind to json_rte fields
- ✅ Check that field.multiple === false
- ❌ Cannot bind to text, number, boolean, etc.

### CSS Property Bindings

When binding CSS properties (styles):
- ✅ Always use text fields
- ✅ Example: \`backgroundColor\` → \`entry.brand_color\` (text field)
- ❌ Cannot bind to number, boolean, json, etc.

### Repeater Items Binding

For repeater \`items\` prop (array type):
- ✅ Can bind to blocks field types
- ✅ Can bind to file field types (for object prop)
- ❌ Cannot bind to text, number, boolean, etc.

**Example:**
\`\`\`json
{
  "props": {
    "items": {
      "type": "array",
      "binding": {
        "type": "template",
        "value": { "path": { "entry.products": {} } }  // products must be blocks field
      }
    }
  }
}
\`\`\`

### Entry Binding Rules

**🚨 CRITICAL: Entry Type Determines Binding Format!**

The page data structure separates template entries from linked entries:
- **Template Entry**: Located in \`context.templateEntry\` (main page entry)
- **Linked Entries**: Located in \`context.linkedEntries\` array (referenced entries)

**Template Entry (Main Page Entry):**
- **Location**: \`context.templateEntry\`
- **Binding type**: \`${rules.entryBindingRules.templateEntry.bindingType}\`
- **Path format**: \`${rules.entryBindingRules.templateEntry.pathFormat}\`
- **Examples:**
${templateEntryExamples}

**Binding Format for Template Entry:**
\`\`\`json
{
  "binding": {
    "type": "template",
    "value": {
      "path": { "title": {} }  // Simple path, no entry identifier needed
    }
  }
}
\`\`\`

**Linked Entry (Referenced Entry):**
- **Location**: \`context.linkedEntries\` array
- **Binding type**: \`${rules.entryBindingRules.linkedEntry.bindingType}\`
- **Path format**: \`${rules.entryBindingRules.linkedEntry.pathFormat}\`
- **Examples:**
${linkedEntryExamples}

**Binding Format for Linked Entry:**
\`\`\`json
{
  "binding": {
    "type": "contentstack",
    "value": {
      "uid": "blt79cd803ea9660c7a",        // Entry UID from linkedEntries
      "_content_type_uid": "blog_post",    // Entry type from linkedEntries
      "path": { "title": {} }              // Field path
    }
  }
}
\`\`\`

**Decision Process:**
1. ✅ Check if data is from \`context.templateEntry\` → Use \`binding.type: "template"\` with simple path
2. ✅ Check if data is from \`context.linkedEntries\` → Use \`binding.type: "contentstack"\` with uid, _content_type_uid, and path
3. ❌ DO NOT mix binding types - template entry uses template, linked entries use contentstack

**⚠️ CRITICAL: Always verify type compatibility before creating bindings!**
`;
}

/**
 * Get all CMS field types
 * Helper function to generate "cannot bind to" list
 */
function getAllFieldTypes(): string[] {
  return [
    "text",
    "number",
    "boolean",
    "json",
    "blocks",
    "isodate",
    "file",
    "json_rte",
    "reference",
    "select",
  ];
}
