---
name: troubleshooting
description: Diagnose and fix common issues in Visual Compose compositions and Studio AI code setups
type: skill
agent: polaris-assist, polaris-agent
triggers: ["not working", "broken", "error", "blank", "empty", "missing", "stuck", "help", "debug", "why"]
---

# Troubleshooting — Common Issues & Fixes

## Visual Compose Issues

### Component Not Rendering / Blank

| Symptom | Cause | Fix |
|---------|-------|-----|
| Component shows as empty box | Wrong component type (e.g., `paragraph` instead of `text`) | Use correct type — see `COMPONENT_SCHEMAS.ts` |
| Component not recognized | Type doesn't exist in registry | Check `components-registration.md` for valid types |
| "Unknown component" error | Typo in `type` field | Verify exact type string (case-sensitive) |
| Component renders but no content | Props using `value` instead of `staticString` | Change all prop values to use `staticString` field |
| Slots are empty despite having children | Slot key in `slots` doesn't match `props.*.slot` reference | Ensure `props.children.slot` value matches the key in `slots` object |

### Data Binding Shows Empty

| Symptom | Cause | Fix |
|---------|-------|-----|
| Bound field shows nothing | Wrong field path | Verify path exists in the content type schema |
| Image bound but shows broken | Missing `.url` suffix on file field | Change path from `hero_image` to `hero_image.url` |
| Shows `[object Object]` | Binding to object instead of leaf field | Drill deeper into the path (e.g., `author.name` not `author`) |
| Template binding empty | Composition not linked to a content type | Ensure `connected_content_type` is set on the composition |
| Repeater binding empty | Wrong `repeaterUID` | Ensure `repeaterUID` matches the repeater node's actual UID |
| Reference field empty | `include[]` not resolving | Use dot notation path — include is auto-generated |

### Styles Not Applying

| Symptom | Cause | Fix |
|---------|-------|-----|
| Styles have no effect | Using flat format (`"desktop": {}`) | Use nested format: `styles.default.responsiveStyles.default` |
| Mobile styles not working | Missing breakpoint key | Add `"mobile"` key inside `responsiveStyles` |
| Style applied to wrong element | Targeting wrong UID | Re-read composition to get correct UID |
| Styles reset after binding | MODIFY replaced entire `styles` object | Include full styles object in MODIFY changes (top-level replace) |

### Repeater Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Repeater shows nothing | Data source has no items | Check CMS entry has data in the bound field |
| Shows 1 item only | Data source has 1 entry | That's correct — check CMS data |
| Modular blocks not rendering | Missing condition-blocks | Add `condition-block` nodes inside repeater (one per block type) — see `constraints.md` |
| Nested repeater crashes | Missing box wrapper | Wrap nested repeater in `box` with `metadata.repeaterWrapper: true` |

### JSON / Save Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| "UID conflict" error | Duplicate UIDs in composition | Regenerate UIDs (paste worker does this for ADD, but check MODIFY) |
| Checksum mismatch | Composition was modified between read and write | Re-read composition and retry |
| "Parent not found" | The parent UID doesn't exist | Re-read composition to get current UIDs |
| "Slot not found" | Parent has no slots | Ensure parent is a container component (section, box, hstack, etc.) |

---

## Studio AI (Code) Issues

### SDK Not Initializing

| Symptom | Cause | Fix |
|---------|-------|-----|
| SDK not active | App not opened with `?cs_studio=true` param | Add `cs_studio=true` to URL when testing |
| `sdk.init()` error | Called before component registration | Register components first, then call `init()` |
| "postMessage origin mismatch" | Domain mismatch between Studio and iframe | Check CORS and allowed origins |

### Components Not Showing in Panel

| Symptom | Cause | Fix |
|---------|-------|-----|
| Component not in left panel | Not registered with `registerComponents()` | Add to registration file |
| Registered but not visible | Registration file not imported in SDK init | Ensure the registration file is imported and passed to SDK config |
| Error during registration | Wrong prop type name | Use correct type names: `"imageurl"` not `"image"`, `"href"` not `"url"`, `"choice"` not `"enum"` |

### Props Not Editable

| Symptom | Cause | Fix |
|---------|-------|-----|
| Prop doesn't show in right panel | Wrong type in registration | Check prop type matches SDK types exactly |
| Prop shows but no input | Missing `default` value | Add `default` to the prop definition |
| Slot not accepting children | Prop type not `"slot"` | Change prop type to `"slot"` for nestable areas |

### Build / Runtime Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Hot reload breaks Studio | SDK re-initializes on HMR | Add HMR guard: only init once |
| Blank iframe in Studio | App crash or wrong port | Check dev server is running, verify port matches Studio config |
| CORS error loading iframe | Missing CORS headers | Add allowed origins to app server config |
| "process.env is not defined" | rsbuild overrides process.env | Use rsbuild proxy paths instead of env vars |

---

## General Debugging Steps

1. **Read the error message first** — most errors tell you exactly what's wrong
2. **Check component type** — is it a valid registered type? (See `COMPONENT_SCHEMAS.ts`)
3. **Check prop names** — are they correct? (`Tag` not `headingTag`, `label` not `text` for buttons)
4. **Check prop format** — are you using `staticString` not `value`?
5. **Check slot linkage** — does `props.children.slot` match the `slots` key?
6. **Check styles format** — are you using nested `default.responsiveStyles.default`?
7. **Check binding paths** — do they match actual CMS field names? Image fields need `.url`
8. **Re-read the composition** — UIDs and structure may have changed since your last read
