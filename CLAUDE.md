# Bronly Project Instructions for Claude

## Source of truth

- `docs/product/prd.md` is the canonical product specification.
- `docs/product/decision-log.md` contains newer explicit decisions when they override earlier wording.
- `docs/product/mvp-boundaries.md` and `docs/product/terminology.md` are operational summaries, not replacements for the PRD.

## Required reading before work

Read in this order:

1. `README.md`
2. `docs/product/mvp-boundaries.md`
3. `docs/product/terminology.md`
4. `docs/process/task-intake.md`
5. `docs/product/prd.md` for product, UX, workflow, pricing, subscription, owner, guest, agent, collection, or public-page changes
6. `docs/product/decision-log.md` for changes involving unresolved, disputed, or recently updated logic

## Expected behavior

- Follow the documented MVP boundaries.
- Use project terminology in all user-facing text.
- Treat undocumented product behavior as ambiguous.
- Do not silently expand scope.

## Conflict handling

If a request conflicts with the MVP, terminology, or documented business rules:

1. stop implementation;
2. name the conflict;
3. cite the relevant document or section;
4. offer 1-2 safe options;
5. wait for the user's decision.

## Guardrails

Do not add marketplace behavior, accommodation payments, automatic booking confirmation, global catalog features, or other explicitly excluded MVP functionality unless the user clearly approves a product change.

