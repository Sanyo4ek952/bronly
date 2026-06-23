# Replica Checklist

Use this checklist before and after implementing a screenshot-based UI request in Bronly.

## What To Extract From The Screenshot

- Primary layout structure
- Major spacing relationships
- Typography levels and emphasis
- Surface colors and contrast
- Radius, border, and shadow treatment
- Control density and grouping
- Visible states such as selected, disabled, or expanded
- Desktop or mobile cues

## Implementation Priorities

Apply changes in this order:

1. Match structure first.
2. Match spacing and sizing next.
3. Match typography hierarchy next.
4. Match surfaces, borders, radius, and shadows next.
5. Match colors next.
6. Add states and interactions next.
7. Add responsive adjustments last.

## Safe Assumptions

- If a font cannot be identified, use the closest existing project font setup.
- If an icon set is unclear, use the closest existing icon style already used nearby.
- If responsive behavior is not shown, preserve the current page behavior and adapt only as much as needed.
- If hidden states are not shown, do not invent extra states or flows.

## Bronly-Specific Guardrails

- Keep user-facing copy aligned with `docs/product/terminology.md`.
- Prefer narrow changes near the target surface over broad shared-component edits.
- If the screenshot suggests behavior that conflicts with fixed product rules, stop and raise the conflict before implementing it.

## Final Visual Check

- Does the overall silhouette match at a glance?
- Do the main blocks occupy similar space?
- Are spacing and alignment close?
- Does the typography hierarchy feel the same?
- Did the implementation avoid adding extra elements?
- Is the result visually close without breaking nearby Bronly surfaces?
