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
| D35 | `/agent/dashboard/referrals` | route-specific контракт готов; shared implementation уже внедрён |
| D36 | `/agent/dashboard/requests` | verified ранее; canonical D36 contract восстановлен |
| D37 | `/agent/dashboard/settings` | verified ранее; canonical D37 contract восстановлен |
| D38 | `/agent/dashboard/subscription` | route-specific контракт готов; shared implementation уже внедрён |
| D39 | `/admin` | verified: существующий mobile-first redesign и route-specific контракт |
| D40 | `/admin/properties` | verified: существующий mobile-first redesign и route-specific контракт |
| D41 | `/admin/reviews` | verified: существующий mobile-first redesign и route-specific контракт |
| D42 | `/admin/subscriptions` | verified: существующий mobile-first redesign и route-specific контракт |
| D43 | `/admin/users` | verified: существующий mobile-first redesign и route-specific контракт |
| D44 | `/a/[slug]` | verified: существующий public redesign и route-specific контракт |
| D45 | `/a/[slug]/request` | verified: agent request flow и route-specific контракт |
| D46 | `/a/[slug]/request/success` | verified: agent success flow и ручные следующие шаги |
| D47 | `/c/[slug]` | verified: персональная подборка без общего каталога |
| D48 | `/c/[slug]/request` | verified: заявка на конкретный номер из подборки |
| D49 | `/c/[slug]/request/success` | verified: collection success flow и role-specific шаги |
| D50 | `/check-email` | verified: confirmation states и invite-контекст |
| D51 | `/forgot-password` | verified: recovery form и feedback states |
| D52 | `/invite/[token]` | verified: role-bound invite и unavailable state |
| D53 | `/login` | verified: role-aware login, recovery и redirect context |
| D54 | `/p/[slug]` | verified: owner storefront с базовыми ценами и direct request |
| D55 | `/p/[slug]/request` | pending |
| D56 | `/p/[slug]/request/success` | pending |
| D57 | `/register` | pending |
| D58 | `/reset-password` | pending |
| D59 | `/welcome` | pending |
