# Bronly Tailwind Migration Rules

Use this reference to keep component migrations predictable and local.

## Stack assumptions

- Treat the repo as Next.js plus React with Tailwind CSS v4 already installed.
- Treat `src/app/globals.css` as the main legacy styling source unless the target file proves otherwise.
- Prefer plain `className` strings. No shared `cn` helper is established in the current repo context.

## Default migration approach

1. Search the target file for `br-*` classes and inline `style` props.
2. Search `src/app/globals.css` for each selector before rewriting it.
3. Port the exact visual job of that selector into Tailwind utilities at the call site.
4. Keep semantic structure, event handlers, imports, and component boundaries intact.
5. Remove old selectors only when the repo no longer uses them.

## Favor these decisions

- Keep migration scope local to the component the user provided.
- Preserve existing shared primitives and only rewrite their usage layer when possible.
- Reuse CSS variables through Tailwind arbitrary values when the design depends on project tokens.
- Use responsive, state, and pseudo-class utilities directly in `className` when they replace legacy modifiers cleanly.

## Avoid these decisions

- Do not recreate BEM-style global classes with new names.
- Do not move style logic into `globals.css` when Tailwind utilities can live beside the markup.
- Do not add helper abstractions just to shorten one long class string.
- Do not guess spacing, color, or radius values if the legacy CSS already defines them.

## Cleanup rule

If the migration removes the last usage of a selector, delete that selector in the same task. If other files still rely on it, keep it and report the remaining dependency.
