---
name: bronly-ui-reuse-guard
description: Prevent unnecessary UI duplication in Bronly. Use when a task proposes a new component, a new reusable UI block, or fresh TSX/CSS markup in `src/shared/ui`, `src/widgets`, `src/features`, or app pages. Search existing primitives and nearby patterns first, prefer extending an existing component with minimal blast radius, and create a new component only when checked alternatives are clearly insufficient. Update `docs/engineering/component-index.md` when a new reusable component is added.
---

# Bronly UI Reuse Guard

Prevent avoidable UI duplication. Reuse the existing Bronly component system before creating new primitives, wrappers, or composite blocks.

Read [references/reuse-search-map.md](references/reuse-search-map.md) and [docs/engineering/component-index.md](../../../docs/engineering/component-index.md) before creating a new reusable component.

## Workflow

1. Identify the target layer.

- Decide whether the task changes a primitive, a composite widget, a feature-local block, or one page.
- Prefer the narrowest layer that solves the request.

2. Search in strict order.

1. `src/shared/ui`
2. `src/widgets`
3. `src/features`

- Check whether the task can be solved by an existing primitive as-is.
- Check whether an existing prop, variant, size, state, or wrapper already covers the need.
- Check whether a nearby widget or feature already implements the same pattern.

3. Choose the smallest safe reuse path.

Apply this order strictly:

1. Reuse an existing `shared/ui` component unchanged.
2. Reuse an existing variant or prop surface.
3. Extend an existing component with an opt-in API.
4. Add a local component near the feature when reuse is too narrow for `shared/ui`.
5. Add a new `shared/ui` component only when the pattern is clearly cross-surface and reusable.

4. Justify every new component.

- Name the existing components or patterns you checked.
- State briefly why they are insufficient.
- If the need is only local, keep the new component in the closest feature or widget instead of `shared/ui`.

5. Update the component index.

- When you add a new reusable component or composite pattern, update `docs/engineering/component-index.md` in the same task.
- Keep entries short: component name, layer, file path, purpose, and notable props or states.

## Guardrails

- Do not create a new component before checking `src/shared/ui`.
- Do not move a one-screen helper into `shared/ui` without a clear second consumer or a strong reuse case.
- Do not replace an existing primitive with ad hoc markup just because the existing API is slightly inconvenient.
- Prefer opt-in variants over changing default behavior on shared primitives.
- If the task also changes look and feel, use `$bronly-ui-style-guard` alongside this skill.

## Output Expectations

When you create a new component, explain in one short block:

- what existing components were checked;
- why they were not enough;
- why the chosen layer is the smallest safe layer;
- whether `docs/engineering/component-index.md` was updated.
