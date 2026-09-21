# Component Index

Use this index before creating new UI in Bronly. Check the closest existing primitive or pattern first, then extend it with the smallest safe diff.

Update this file when a new reusable component or composite pattern is added.

## Shared UI Primitives

- `BrandLogo` — `src/shared/ui/brand-logo.tsx` — Bronly wordmark or logo surface.
- `BottomSheet` — `src/shared/ui/bottom-sheet.tsx` — Tailwind mobile dialog with drag-to-close, focus trap/restore, Escape and safe-area handling; accepts body/surface classes and render-close API.
- `Button`, `ButtonLink` — `src/shared/ui/button.tsx` — shared `primary` / `secondary` / `danger` / `ghost`, `sm` / `md`, full-width, disabled and loading action API.
- `DashboardPageNav` — `src/shared/ui/dashboard-page-nav.tsx` — back navigation and page-level dashboard nav.
- `Input`, `Textarea` — `src/shared/ui/field.tsx` — Tailwind form controls with labels, descriptions, disabled/focus styling and accessible error messaging.
- `Select` — `src/shared/ui/select.tsx` — единый Radix Select с Bronly-токенами, адаптивным меню, keyboard/typeahead-навигацией, ошибками и передачей значения в формы.
- `FormSection` — `src/shared/ui/form-section.tsx` — section wrapper for grouped form content; supports static card, opt-in accessible accordion and `bare` sections without a surface, border or padding for use inside an existing panel.
- `AppIcon` — `src/shared/ui/icon.tsx` — icon mapping surface.
- `IconButton` — `src/shared/ui/icon-button.tsx` — compact icon-only action button.
- `InlineNotice` — `src/shared/ui/inline-notice.tsx` — inline feedback with `default`, `soft`, `warning` and alerting `error` tones.
- `Panel` — `src/shared/ui/panel.tsx` — semantic Tailwind surface with `default` / `subtle` / `raised` and explicit padding variants.
- `SectionHeader` — `src/shared/ui/section-header.tsx` — paired title and subtitle block.
- `SectionSubtitle` — `src/shared/ui/section-subtitle.tsx` — secondary section text.
- `SectionTitle` — `src/shared/ui/section-title.tsx` — primary section heading.
- `StatCard` — `src/shared/ui/stat-card.tsx` — small metric card surface.
- `StatusPill` — `src/shared/ui/status-pill.tsx` — compact neutral, pending, active/inactive and request-status badge.
- `SubmitButton` — `src/shared/ui/submit-button.tsx` — submit-aware button wrapper.
- `Tabs` — `src/shared/ui/tabs.tsx` — Tailwind tablist with disabled items, ARIA selection and arrow/Home/End keyboard navigation.

## Reusable Composite Patterns

- `PropertySetupFlow`, `CreationWizard`, `RoomCreationForm` — `src/features/property/setup/ui/*` — этапы настройки объекта и создания номера; боковая навигация на широком экране, горизонтальная на телефоне, сохранение полей между шагами и пошаговая валидация. Используют `Panel`, `Button`, `SubmitButton` и существующие блоки форм; бизнес-логика остаётся в серверных действиях.

- `AuthShell` — `src/widgets/auth-shell/auth-shell.tsx` — общая адаптивная оболочка входа и регистрации с intro-зоной, формой и footer-навигацией.
- `AdminPageLayout`, `AdminPageHeader` — `src/widgets/property-admin/admin-page-layout.tsx`, `src/widgets/property-admin/admin-page-header.tsx` — property admin page scaffolding.
- `FormSectionCard` — `src/widgets/property-admin/form-section-card.tsx` — property-admin compatibility wrapper around shared `FormSection`; new screens should use the shared primitive directly.
- `PublicRequestPageFrame`, `PublicRequestSuccessScreen` — `src/widgets/public-request/*` — Tailwind public request flow framing and success state.
- `PublicStayFilter`, `PublicRoomBrowser` — `src/widgets/public-room-browser/public-room-browser.tsx` — единый фильтр дат/гостей/комнат и выбор конкретного номера с подходящими и объяснёнными неподходящими вариантами.
- `CollaborationContactLinks`, `CollaborationTargets` — `src/widgets/collaboration-details/collaboration-details.tsx` — общие Tailwind-блоки контактов участника и целей активного сотрудничества для owner/agent экранов.
- `OwnerShell`, `AdminShell` — `src/widgets/owner-shell/owner-shell.tsx`, `src/widgets/admin-dashboard/admin-shell.tsx` — Tailwind cabinet shells with desktop sidebar, mobile bottom navigation, active/focus states and shared `BottomSheet` overflow menu.
- `RequestsBrowser`, `OwnerCalendarBrowser`, `AgentCalendarBrowser` — `src/widgets/*browser/*` — role-specific filter, tab, list and calendar browsing patterns.
- `RoomFormSection`, `OwnerPropertyFormFields` — `src/features/property/edit-room/ui/room-form-section.tsx`, `src/features/property/edit-property/ui/owner-property-form-fields.tsx` — property editing form layouts.

## Search Checklist

1. Check `src/shared/ui/index.ts`.
2. Search `src/widgets` for a nearby composite pattern.
3. Search `src/features` for a flow-specific implementation.
4. Prefer an opt-in extension over a new default shared primitive.
5. If you still add a new reusable component, add it to this index in the same change.
