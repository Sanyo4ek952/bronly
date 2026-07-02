---
name: bronly-tailwind-component-migrator
description: Rewrite existing Bronly React and Next.js components, pages, widgets, and form sections from legacy global CSS or `br-*` classes to Tailwind CSS v4 utility classes. Use when Codex is given a TSX or JSX UI surface that currently depends on `src/app/globals.css`, repeated global selectors, or inline style objects and should be migrated to local `className` utilities while preserving behavior, semantics, accessibility, and Bronly terminology.
---

# Bronly Tailwind Component Migrator

Convert one existing UI surface at a time from global styling to Tailwind v4. Preserve behavior and visual intent, reduce dependence on `src/app/globals.css`, and avoid turning a migration task into a redesign.

Read [references/migration-rules.md](references/migration-rules.md) before making substantial edits.

## Workflow

1. Define the migration boundary.

- Migrate the exact component, page, widget, or form section the user provided.
- Name the legacy selectors it depends on before editing.
- Keep routes, data flow, copy, actions, and states unchanged unless the user asks for more.

2. Map the current styling source.

- Search the file for `br-*` classes, inline `style` props, and shared primitives.
- Resolve every legacy selector in `src/app/globals.css` or nearby files before replacing it.
- Keep shared UI components in place unless the shared primitive itself is the migration target.

3. Translate styles into Tailwind v4.

- Move layout, spacing, typography, borders, radius, shadows, and responsive behavior into `className`.
- Prefer the existing Tailwind scale before reaching for arbitrary values.
- When a token exists only as a CSS variable, reference it with arbitrary values such as `bg-[var(--token)]`, `text-[var(--token)]`, or `shadow-[var(--token)]`.
- Keep conditional classes readable with template literals or small inline arrays. Do not introduce a helper unless the repo already uses one nearby.

4. Preserve structure and behavior.

- Keep semantic tags, labels, ARIA, keyboard behavior, and form wiring intact.
- Preserve `data-*` attributes, disabled and loading states, focus states, and validation states.
- Keep Bronly terminology in visible copy.

5. Clean up CSS safely.

- Remove a legacy selector from global CSS only after confirming no other usage remains in the repo.
- Leave shared or still-used selectors in place and call out the leftover debt.
- Avoid bundling unrelated CSS cleanup into the same task.

## Guardrails

- Do not redesign the screen while migrating it.
- Do not replace shared components with ad hoc markup unless the current component cannot express the needed Tailwind classes safely.
- Do not create new global classes to imitate Tailwind. Keep the result local to the component.
- Do not extract a new reusable wrapper unless duplication is real inside the current change.
- Do not broaden a one-component cleanup into a repo-wide migration without explicit approval.

## Output Expectations

1. State the migration boundary.
2. Name the main legacy classes or selectors being removed or reduced.
3. Implement the Tailwind rewrite.
4. Mention any leftover global CSS selectors and why they remain.
