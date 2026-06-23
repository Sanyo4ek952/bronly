# Bronly UI Reuse Search Map

Use this search order before creating new UI.

## Primary search order

1. `src/shared/ui`
2. `src/widgets`
3. `src/features`

Do not skip earlier layers.

## Fast checks

- Reusable primitives: `src/shared/ui/index.ts`
- Existing UI inventory: `docs/engineering/component-index.md`
- Existing visual patterns: `.codex/skills/bronly-ui-style-guard/references/project-style-map.md`

## Useful searches

- Find exported shared primitives: `rg -n "^export" src/shared/ui/index.ts src/shared/ui`
- Find a likely component name: `rg -n "Button|Panel|Tabs|FormSection|Notice|Card|Sheet|Header" src/shared/ui src/widgets src/features`
- Find a page-local pattern before creating a wrapper: `rg -n "className=.*(card|panel|tabs|notice|header|section)" src/widgets src/features src/app`
- Find where a shared primitive is already used: `rg -n "@/shared/ui" src`

## Current hotspots

- `src/shared/ui`: primitives and small wrappers intended for reuse
- `src/widgets/property-admin`: admin cards, accordions, section layouts, quick actions
- `src/widgets/public-request`: public request frame and success surfaces
- `src/widgets/owner-shell` and `src/widgets/admin-dashboard`: shell-level navigation and sheet patterns
- `src/widgets/*browser`: browse, tabs, filters, and list patterns
- `src/features/property/edit-room` and `src/features/property/edit-property`: form sections and editing blocks

## Layer rule

- Put a component in `src/shared/ui` only if it is presentation-first and reusable across multiple screens or flows.
- Put a component in `src/widgets` if it assembles multiple primitives into a reusable page section.
- Put a component in `src/features` if it is tied to one business flow or form behavior.
- Keep one-off helpers local to the nearest page, widget, or feature.
