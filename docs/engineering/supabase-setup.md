# Supabase setup for Bronly

Проект использует Supabase для хранения базовых сущностей Bronly в реальной базе.

## На что опирается схема

- `docs/product/prd.md`, разделы `4` (роли), `6` (заявки), `13` (сущности), `14` (RLS)
- `docs/product/decision-log.md`, блоки `Заявки и публичные страницы`, `Цены`, `Коллекции`, `Агентский контур`

## Что уже добавлено в репозиторий

- `.env.example` с переменными окружения;
- `supabase/migrations/202606020001_initial_bronly_schema.sql` с исходной базовой схемой;
- `supabase/seed.sql` с демо-данными под текущие страницы;
- Supabase-клиенты в `src/shared/api/supabase/*`, data layer в `src/entities/*/api/*`, серверные действия в `src/features/*`.

Установка приложения, запуск и проверки описаны в [local-development.md](./local-development.md).

## Переменные окружения

Создайте `.env.local` на основе `.env.example` и заполните:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BRONLY_DEMO_MODE` — `true` только для явного read-only demo без Supabase
- `BRONLY_DEMO_PROPERTY_SLUG`
- `NEXT_PUBLIC_APP_URL` — канонический origin для auth, приглашений и ссылок в уведомлениях
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` — пара VAPID и контакт отправителя PWA push
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` — серверные настройки Telegram-бота

Для вашего проекта URL уже известен:

`https://uevwqievuzakcquselku.supabase.co`

## Как применить схему к отдельному тестовому проекту

В истории 26 миграций. Первая, `202606020000_reset_public_schema.sql`, удаляет схему public каскадно. Следующие команды предназначены для отдельной пустой тестовой базы. Для существующей базы сначала сверьте историю миграций и сохранность данных; слепое применение всей истории разрушительно. Эти команды не входят в локальные проверки lint/TypeScript/build/encoding.

1. Установите Supabase CLI или используйте `npx supabase`.
2. Выполните `supabase login`.
3. Выполните `supabase link --project-ref <YOUR_TEST_PROJECT_REF>`.
4. Выполните `supabase db push`.
5. Если база пустая и вам нужен демо-контент, выполните SQL из `supabase/seed.sql` через SQL Editor.

## Как это работает в приложении

- Если переменные Supabase заполнены, страницы читают данные из базы; рабочая конфигурация всегда имеет приоритет над demo.
- Read-only demo публичной страницы владельца включается только при `BRONLY_DEMO_MODE=true` и использует `BRONLY_DEMO_PROPERTY_SLUG`. Ошибка настроенной базы никогда не переключает приложение на demo.
- Отправка заявки сообщает об успехе только после сохранения записи в `guest_requests`. Без серверной конфигурации или при недоступной базе форма показывает безопасную ошибку и прямо сообщает, что данные не отправлены.
- Критические ошибки конфигурации и data layer пишутся в структурированный серверный лог без пользовательских полей, текста ошибки и stack trace Supabase.

## Типы базы и проверка доступа

- npm run supabase:types заново формирует src/shared/api/supabase/database.types.ts из PostgREST-схемы настроенного проекта. Для чтения схемы нужен NEXT_PUBLIC_SUPABASE_URL и ключ из локального .env; ключ service role используется только этим серверным скриптом, если anon key не имеет доступа к OpenAPI.
- Supabase-клиенты параметризованы сгенерированным Database, поэтому несовпадения колонок и enum обнаруживаются TypeScript.
- tests/rls/access-smoke.sql — транзакционный smoke-тест ролей, владения, отдельного номера и переходов заявки. Его следует запускать только в локальной или изолированной тестовой БД после применения миграций, например через psql -v ON_ERROR_STOP=1 -f tests/rls/access-smoke.sql; тест завершает данные через rollback.
- tests/rls/calendar-boundaries-smoke.sql — транзакционный smoke-тест полуоткрытой занятости: соседние интервалы, запрет пересечения и нулевого периода, а также заявки на общей границе выезда/заезда. Запускается после всех миграций только в локальной или изолированной тестовой БД и завершает данные через rollback.
- tests/rls/subscription-smoke.sql — транзакционный smoke-тест лимита активных номеров и атомарного ручного продления owner/agent с записью в `subscription_audit_events`; также запускается только в изолированной тестовой БД после всех миграций и завершает данные через rollback.
- tests/rls/referral-admin-smoke.sql — транзакционный smoke-тест invite/consume, owner/agent milestone, единственной pending-записи, ручного решения администратора, продления обоих контекстов на 10 дней и запрета административных действий обычному пользователю; запускается только в изолированной тестовой БД и завершает данные через rollback.

## Подтверждение email при регистрации

Письма отправляет **Supabase Auth**, не приложение Bronly.

В [Dashboard](https://supabase.com/dashboard) → проект `uevwqievuzakcquselku` → **Authentication**:

1. **Providers → Email** — включите **Confirm email**.
2. **URL Configuration**:
   - **Site URL**: тот же хост, что в браузере (например `http://localhost:3001`, если dev на 3001).
   - **Redirect URLs** (добавьте оба при локальной разработке):
     - `http://localhost:3000/auth/confirm`
     - `http://localhost:3001/auth/confirm`
3. **SMTP** — для Gmail и продакшена настройте Custom SMTP (встроенная почта Supabase имеет низкий лимит и часто попадает в спам).
4. **Users** — если email уже регистрировали, повторное письмо не придёт; удалите пользователя или используйте «Отправить письмо ещё раз» на `/check-email`.

`NEXT_PUBLIC_APP_URL` в `.env.local` должен совпадать с портом dev-сервера.

## Уведомления и PWA

- VAPID-пару создают один раз, например командой `npx web-push generate-vapid-keys`; публичный ключ доступен браузеру, приватный хранится только в серверном окружении.
- Telegram webhook направляют на `https://<ваш-домен>/api/telegram/webhook` и регистрируют с тем же secret token, который хранится в `TELEGRAM_WEBHOOK_SECRET`.
- Без VAPID или Telegram-конфигурации in-app уведомление сохраняется, а вторичный канал получает отслеживаемый статус `pending_configuration`; основное бизнес-событие не откатывается.
- Push-подписка создаётся отдельно для каждого браузера. Отключение на устройстве удаляет только его endpoint; Telegram можно выключить без удаления привязки чата.

## Что важно для дальнейшей работы Codex

- Все изменения схемы лучше вносить новыми SQL-файлами в `supabase/migrations`.
- Для применения изменений в ваш реальный проект нужен доступ к Supabase CLI или к SQL Editor.
- `SUPABASE_SERVICE_ROLE_KEY` должен оставаться только на сервере и не попадать во frontend.
