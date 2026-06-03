# Supabase setup for Bronly MVP

Этот проект теперь умеет работать с Supabase и хранить MVP-сущности Bronly в реальной базе.

## На что опирается схема

- `docs/product/prd.md`, разделы `4.4`, `4.5`, `4.6`
- `docs/product/decision-log.md`, блоки `Заявки и публичные страницы`, `Цены`, `Коллекции`, `Агентский контур`

## Что уже добавлено в репозиторий

- `.env.example` с переменными окружения;
- `supabase/migrations/202606020001_initial_bronly_schema.sql` с основной MVP-схемой;
- `supabase/seed.sql` с демо-данными под текущие страницы;
- серверный Supabase data layer в `src/lib/supabase/*` и `src/lib/bronly-data.ts`.

## Переменные окружения

Создайте `.env.local` на основе `.env.example` и заполните:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `BRONLY_DEMO_PROPERTY_SLUG`

Для вашего проекта URL уже известен:

`https://uevwqievuzakcquselku.supabase.co`

## Как применить схему к вашему проекту

1. Установите Supabase CLI или используйте `npx supabase`.
2. Выполните `supabase login`.
3. Выполните `supabase link --project-ref uevwqievuzakcquselku`.
4. Выполните `supabase db push`.
5. Если база пустая и вам нужен демо-контент, выполните SQL из `supabase/seed.sql` через SQL Editor.

## Как это работает в приложении

- Если переменные Supabase заполнены, страницы читают данные из базы.
- Если переменные не заданы или база еще не наполнена, UI использует текущие мок-данные как fallback.
- Отправка заявки с публичной страницы идет через серверный action и пишет запись в таблицу `guest_requests`.

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

## Что важно для дальнейшей работы Codex

- Все изменения схемы лучше вносить новыми SQL-файлами в `supabase/migrations`.
- Для применения изменений в ваш реальный проект нужен доступ к Supabase CLI или к SQL Editor.
- `SUPABASE_SERVICE_ROLE_KEY` должен оставаться только на сервере и не попадать во frontend.
