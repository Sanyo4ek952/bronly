# Component Index

Use this index before creating new UI in Bronly. Check the closest existing primitive or pattern first, then extend it with the smallest safe diff.

Update this file when a new reusable component or composite pattern is added.

## Shared UI Primitives

- `BrandLogo` — `src/shared/ui/brand-logo.tsx` — Bronly wordmark or logo surface.
- `BottomSheet` — `src/shared/ui/bottom-sheet.tsx` — shared mobile sheet container.
- `Button`, `ButtonLink` — `src/shared/ui/button.tsx` — primary action and link-styled action primitives.
- `DashboardPageNav` — `src/shared/ui/dashboard-page-nav.tsx` — back navigation and page-level dashboard nav.
- `Input`, `Select`, `Textarea` — `src/shared/ui/field.tsx` — shared form controls.
- `FormSection` — `src/shared/ui/form-section.tsx` — section wrapper for grouped form content.
- `AppIcon` — `src/shared/ui/icon.tsx` — icon mapping surface.
- `IconButton` — `src/shared/ui/icon-button.tsx` — compact icon-only action button.
- `InlineNotice` — `src/shared/ui/inline-notice.tsx` — inline feedback and status messaging.
- `Panel` — `src/shared/ui/panel.tsx` — shared card or panel surface.
- `SectionHeader` — `src/shared/ui/section-header.tsx` — paired title and subtitle block.
- `SectionSubtitle` — `src/shared/ui/section-subtitle.tsx` — secondary section text.
- `SectionTitle` — `src/shared/ui/section-title.tsx` — primary section heading.
- `StatCard` — `src/shared/ui/stat-card.tsx` — small metric card surface.
- `StatusPill` — `src/shared/ui/status-pill.tsx` — compact status badge.
- `SubmitButton` — `src/shared/ui/submit-button.tsx` — submit-aware button wrapper.
- `Tabs` — `src/shared/ui/tabs.tsx` — shared tab row pattern.

## Reusable Composite Patterns

- `AdminPageLayout`, `AdminPageHeader` — `src/widgets/property-admin/admin-page-layout.tsx`, `src/widgets/property-admin/admin-page-header.tsx` — property admin page scaffolding.
- `FormSectionCard`, `FormSectionAccordion` — `src/widgets/property-admin/form-section-card.tsx`, `src/widgets/property-admin/form-section-accordion.tsx` — card and accordion wrappers around form sections.
- `PublicRequestPageFrame`, `PublicRequestSuccessScreen` — `src/widgets/public-request/*` — public request flow framing and success state.
- `OwnerShell`, `AdminShell` — `src/widgets/owner-shell/owner-shell.tsx`, `src/widgets/admin-dashboard/admin-shell.tsx` — dashboard shell and navigation patterns.
- `RoomsBrowser`, `RequestsBrowser`, `CalendarBrowser` — `src/widgets/*browser/*` — filter, tab, and list browsing patterns.
- `RoomFormSection`, `OwnerPropertyFormFields` — `src/features/property/edit-room/ui/room-form-section.tsx`, `src/features/property/edit-property/ui/owner-property-form-fields.tsx` — property editing form layouts.

## Search Checklist

1. Check `src/shared/ui/index.ts`.
2. Search `src/widgets` for a nearby composite pattern.
3. Search `src/features` for a flow-specific implementation.
4. Prefer an opt-in extension over a new default shared primitive.
5. If you still add a new reusable component, add it to this index in the same change.
