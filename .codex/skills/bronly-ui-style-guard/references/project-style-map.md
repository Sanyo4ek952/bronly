# Bronly UI Style Map

Use this file to find the existing design language quickly before editing UI.

## Primary UI layer

- `src/shared/ui/index.ts`: export map for reusable UI primitives
- `src/shared/ui/button.tsx`: button variants `primary`, `secondary`, `danger`, `ghost`
- `src/shared/ui/panel.tsx`: shared card surface and padding wrapper
- `src/shared/ui/field.tsx`: input, textarea, select field wrappers
- `src/shared/ui/form-section.tsx`: form section patterns
- `src/shared/ui/tabs.tsx`: tab row pattern
- `src/shared/ui/status-pill.tsx`: status pill variants
- `src/shared/ui/inline-notice.tsx`: inline notice variants

Prefer this layer before adding ad hoc markup.

## Styling source of truth

- `src/app/globals.css`: main global styles, component classes, and token definitions
- Search for `.br-` classes used by the target component before adding new CSS
- Resolve class names to existing patterns such as cards, pills, badges, filter bars, admin headers, and form sections

## Token guidance

The repo currently contains more than one token cluster in `src/app/globals.css`. Treat the surrounding UI as the active source of truth for the area you are editing.

Look for these token families first:

- colors: `--color-*`, `--accent*`, `--text*`, `--surface*`, `--border*`
- radius: `--radius-*`
- shadow: `--shadow-*`
- motion: `--transition`
- layout: `--container`, `--safe-area-*`

Do not rewrite token groups globally for a local polish task.

## Search patterns

Use narrow searches before broad ones.

- Find page or widget entry: `rg -n "<component-or-page-name>" src`
- Find shared primitives: `rg -n "export function|type .*Variant|type .*Size" src/shared/ui`
- Find class usage: `rg -n "br-[a-z0-9_-]+" src`
- Find token usage: `rg -n "var\\(--|--color-|--radius-|--shadow-|--transition" src/app/globals.css src`

## Decision ladder

Use this order when choosing where to implement the change:

1. Existing `shared/ui` primitive without changes
2. Existing prop or variant on a shared primitive
3. Existing page or widget class pattern
4. Minimal local class addition
5. New opt-in variant on a shared primitive
6. Global token or pattern edit only with explicit intent

## Red flags

- Editing `src/shared/ui/button.tsx` or `panel.tsx` for a one-screen request
- Adding raw hex colors when a token already exists
- Introducing a new radius or shadow value next to existing tokenized values
- Creating a page-local class that duplicates an established `.br-*` pattern
- Refactoring a wide section of `globals.css` while solving a single widget issue
