---
name: bronly-ui-style-guard
description: Keep Bronly UI changes aligned with the existing design language and minimize regressions. Use when a task changes the look, spacing, hierarchy, or styling of an existing page, widget, section, form, card, button, sheet, tab set, or other UI surface in this repository. Follow the existing shared/ui components, global CSS patterns, and design tokens before adding local styles or changing shared primitives.
---

# Bronly UI Style Guard

Keep UI edits inside the visual system that already exists in this repository. Prefer reuse, token alignment, and the smallest safe diff over creative redesign.

Read [references/project-style-map.md](references/project-style-map.md) before making substantial UI changes. Use it to find the right files and avoid searching the whole repo blindly.

## Workflow

1. Identify the exact change surface.

- Name the page, widget, section, and state that must change.
- Separate the target surface from nearby surfaces that should stay untouched.
- If the request changes UX copy together with visuals, keep Bronly terminology from `docs/product/terminology.md`.

2. Map the existing UI dependencies.

- Find the page entry, then trace which `src/shared/ui` primitives and nearby widgets it uses.
- Prefer `src/shared/ui` as the main reusable UI layer in this repo.
- Treat changes to `Button`, `Panel`, `Field`, `Tabs`, `FormSection`, `StatusPill`, `InlineNotice`, and similar shared primitives as high blast-radius changes.
- Check for a nearby sibling pattern before inventing a new one. A matching pattern on another page is usually safer than a one-off style.

3. Find the active styling source.

- Inspect the JSX classes on the target page or widget.
- Resolve those classes in `src/app/globals.css` before writing new CSS.
- Check whether the change can be solved by existing component props or variants first.
- If both a component API change and a local class change are possible, prefer the option with the smaller surface area.

4. Check tokens before values.

- Reuse existing CSS variables for color, radius, shadow, motion, spacing, and surfaces.
- Do not introduce a new color, radius, shadow, or transition if an existing token or close pattern already works.
- Do not normalize or refactor global tokens just to make a local diff look cleaner.
- If `globals.css` contains multiple token groups or theme layers, use the layer that already drives the surrounding UI instead of merging systems opportunistically.

5. Choose the smallest safe diff.

Apply this order strictly:

1. Reuse an existing `shared/ui` component as-is.
2. Reuse an existing variant, size, surface, or state.
3. Reuse an existing page-level or widget-level class pattern.
4. Add a minimal local class adjustment near the feature.
5. Extend a shared primitive only if the change is clearly reusable and low-risk.
6. Touch global tokens or global patterns only when the user explicitly wants a system-level design change.

6. Check blast radius before editing shared layers.

- If editing a shared primitive or global class, search where else it is used.
- If the change could alter unrelated pages, prefer a local wrapper, a new opt-in variant, or a page-specific class hook.
- Do not change the default appearance of a widely used primitive unless the task explicitly calls for a broader redesign.

7. Present and implement a minimal diff.

- Keep the diff narrow and explain why that layer was chosen.
- If a broader cleanup is tempting but not required, note it separately and do not bundle it into the same change.

## Guardrails

- Do not add new brand colors when existing tokens can cover the need.
- Do not create local one-off styles when the same pattern already exists globally.
- Do not replace `shared/ui` usage with ad hoc markup unless the current primitive cannot support the request safely.
- Do not restyle whole sections when the request only targets one state or element.
- Do not turn a local polish task into a design-system refactor without explicit approval.

## Output Expectations

When the task is ambiguous, state the safest target layer before editing:

- local class tweak
- existing shared variant
- new opt-in variant
- shared primitive change
- global token or pattern change

When the task is clear, implement the diff directly and keep the explanation short: what changed, why that layer was chosen, and what blast radius was avoided.
