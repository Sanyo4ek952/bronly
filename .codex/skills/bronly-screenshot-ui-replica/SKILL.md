---
name: bronly-screenshot-ui-replica
description: Recreate a Bronly UI surface as closely as possible from a provided screenshot or design image in a user-specified target page, section, or component inside this repository. Use when the user shares a screenshot, mockup, or reference image and wants Codex to match the layout, spacing, typography, colors, surfaces, and hierarchy with maximum visual fidelity, optionally with a small set of explicit changes.
---

# Bronly Screenshot UI Replica

Recreate the provided screenshot as closely as possible in this repository. Treat the screenshot as the visual source of truth, then fit the result into the smallest safe target area in the existing Bronly codebase.

Read [references/replica-checklist.md](references/replica-checklist.md) before making substantial edits.

## Inputs To Lock Down

1. Confirm the visual source.

- Use the attached screenshot or design image as the primary reference.
- If the user provides multiple images, identify which one is the baseline and which ones are variants or states.

2. Confirm the target surface.

- Identify the exact page, section, widget, or component that must change.
- Keep nearby surfaces untouched unless the user explicitly expands the scope.

3. Confirm allowed differences.

- Treat the screenshot as the default baseline.
- Apply only the changes the user explicitly asks for, such as different text, spacing, colors, or controls.

## Workflow

1. Inspect the screenshot first.

- Identify layout structure, spacing rhythm, typography hierarchy, colors, radii, borders, shadows, icons, and obvious responsive cues.
- Note what is visible versus what must be inferred.

2. Inspect the current code at the target surface.

- Find the page entry and nearby widgets.
- Check `src/shared/ui`, feature-level components, and `src/app/globals.css` before inventing new patterns.
- Reuse existing Bronly primitives when they allow a close visual match.

3. Optimize for fidelity first, then blast radius.

- Match composition, sizing, spacing, visual density, and hierarchy before polishing minor details.
- Prefer a local implementation or an opt-in variant over changing a widely used shared primitive when exact matching would otherwise cause regressions elsewhere.

4. Do not redesign.

- Do not improve, simplify, modernize, or reinterpret the screenshot unless the user asks.
- Do not add new sections, actions, copy, or animation on your own.

5. Handle unknown details conservatively.

- If hover, focus, mobile behavior, hidden states, fonts, or exact icon sets are not visible, choose the closest safe match already present in this repo.
- State those assumptions briefly in the final handoff.

6. Keep Bronly constraints intact.

- Preserve project terminology in user-facing text.
- If the screenshot conflicts with fixed product logic or project terminology, stop and raise the conflict instead of silently copying it.

## Visual Priority Order

Apply this order when tradeoffs appear:

1. Layout and structure
2. Spacing and sizing
3. Typography hierarchy
4. Surfaces, borders, radius, and shadows
5. Color accuracy
6. States and interactions
7. Responsive behavior

## Output Expectations

Before finishing, verify that:

- the structure matches the screenshot closely;
- the spacing and sizing feel close at a glance;
- the typography hierarchy is preserved;
- no unnecessary elements were introduced;
- the change works in the target Bronly layout;
- shared primitives were not widened in scope without a clear reason.

When the match cannot be exact, explain the smallest material gaps and why they exist.
