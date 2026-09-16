# Единый стиль Bronly — очередь D29–D59

Восстановлено 2026-09-16 из канонического rollout основного checkout после ошибочного объединения нескольких экранов в D28/D29. D01–D28 остаются историческими завершёнными задачами; точные маршруты и решения зафиксированы в соответствующих `docs/design/pages/DNN.md`.

Каждая оставшаяся задача получает собственные `DNN.md` и `DNN.html`, route-specific audit, reuse-first реализацию, responsive QA на 1440/390/320, `check:encoding`, `diff --check` и отдельный коммит. Уже существующий общий redesign не отменяет отдельную проверку маршрута.

| ID | Маршрут | Текущее состояние |
| --- | --- | --- |
| D29 | `/agent/dashboard/collections` | route-specific контракт восстановлен; shared implementation уже внедрён |
| D30 | `/agent/dashboard/collections/[collectionId]` | route-specific контракт готов; shared implementation уже внедрён |
| D31 | `/agent/dashboard/collections/new` | route-specific контракт готов; shared implementation уже внедрён |
| D32 | `/agent/dashboard/deals` | verified ранее; canonical D32 contract восстановлен |
| D33 | `/agent/dashboard/notifications` | route-specific контракт готов; shared implementation уже внедрён |
| D34 | `/agent/dashboard/opportunities` | canonical contract готов; implementation уже внедрён |
| D35 | `/agent/dashboard/referrals` | pending route-specific audit |
| D36 | `/agent/dashboard/requests` | implementation существует, pending canonical D36 contract |
| D37 | `/agent/dashboard/settings` | implementation существует, pending canonical D37 contract |
| D38 | `/agent/dashboard/subscription` | pending route-specific audit |
| D39 | `/admin` | pending |
| D40 | `/admin/properties` | pending |
| D41 | `/admin/reviews` | pending |
| D42 | `/admin/subscriptions` | pending |
| D43 | `/admin/users` | pending |
| D44 | `/a/[slug]` | pending |
| D45 | `/a/[slug]/request` | pending |
| D46 | `/a/[slug]/request/success` | pending |
| D47 | `/c/[slug]` | pending |
| D48 | `/c/[slug]/request` | pending |
| D49 | `/c/[slug]/request/success` | pending |
| D50 | `/check-email` | pending |
| D51 | `/forgot-password` | pending |
| D52 | `/invite/[token]` | pending |
| D53 | `/login` | pending |
| D54 | `/p/[slug]` | pending |
| D55 | `/p/[slug]/request` | pending |
| D56 | `/p/[slug]/request/success` | pending |
| D57 | `/register` | pending |
| D58 | `/reset-password` | pending |
| D59 | `/welcome` | pending |
