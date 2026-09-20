# Локальная разработка и техническая база Bronly

Снимок задачи 01 от 2026-09-14, исходный commit: `5773c48`. Продуктовая опора: PRD, разделы 12 (стек), 14 (RLS), 17 (текущий продуктовый baseline). Это инструкция для существующего checkout.

## Установка

Проверенное окружение: Windows, PowerShell, Node.js 22.23.1, npm 10.9.8. Используйте эти версии для повторения исходной проверки. В репозитории есть `package-lock.json` версии 3; зависимости устанавливаются через `npm ci`, без обновления lockfile.

Из корня репозитория:

```powershell
npm ci --no-audit --no-fund
```

Установка проверена в отдельной временной папке с копиями package.json и package-lock.json: npm ci --no-audit --no-fund установил 372 пакета за 24 секунды, exit 0; рабочий node_modules не изменялся.

Нужен доступ к npm registry либо заполненный npm cache. Сборка использует `next/font/google` (Manrope, latin/cyrillic в `src/app/layout.tsx`), поэтому получение шрифта также зависит от сети.

Создайте `.env.local` по `.env.example`, только если локального файла ещё нет. Заполните значениями своего тестового Supabase-проекта:

- `NEXT_PUBLIC_SUPABASE_URL` и `NEXT_PUBLIC_SUPABASE_ANON_KEY` — браузерный клиент и серверная авторизация.
- `SUPABASE_SERVICE_ROLE_KEY` — серверные операции и чтение публичного контура; в шаблоне эта переменная пока отсутствует. Ключ не должен иметь префикс `NEXT_PUBLIC_`.
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` — адрес приложения для ссылок и auth redirects.
- `BRONLY_DEMO_MODE=true` — явно включает read-only демонстрационные данные только при отсутствии серверной конфигурации Supabase. Значение по умолчанию и любое значение кроме `true` оставляют demo выключенным.
- `BRONLY_DEMO_PROPERTY_SLUG` — slug публичной страницы для явно включенного demo-режима. Сам по себе этот параметр demo не включает.

Значения из существующих `.env` / `.env.local` не перезаписывайте. Next.js читает оба файла, локальный имеет приоритет. URL в шаблоне относится к уже существующему проекту: для изолированной разработки замените его своим.

Для отдельных функций дополнительно нужны `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (push) и `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`, `TELEGRAM_WEBHOOK_SECRET` (Telegram). Эти функции требуют соответствующей внешней настройки. Секреты в git не добавляются.

```powershell
npm run dev
```

Откройте http://localhost:3000. Если порт занят, используйте `npm run dev -- --port 3001` и согласуйте `NEXT_PUBLIC_APP_URL` и auth redirect URLs с выбранным портом.

## Проверки и production-сборка

Команды выполняются из корня:

```powershell
npm run lint
npx --no-install tsc --noEmit --incremental false
npm run build
npm run check:encoding
```

После успешной сборки локальный production-сервер запускается командой `npm run start`. Проверки lint, TypeScript и build не подтверждают доступность Supabase, работу RLS, доставки уведомлений или сквозной сценарий гостя.

`check:encoding` проверяет только отслеживаемые git текстовые файлы. Новые неотслеживаемые документы нужно отдельно проверить на корректный UTF-8 без BOM. Скрипт требует разрешения на запуск дочернего процесса `git ls-files`.

Если Windows sandbox возвращает `EPERM` / `Access denied` при запуске git, воркеров Graphify или записи `.next`, повторите затронутую команду с разрешённым локальным выполнением. Это ограничение окружения, а не повод менять бизнес-код.

## Конфигурация и структура

- Lockfile: Next.js 16.2.7, React / React DOM 19.2.7, TypeScript 6.0.3, ESLint 9.39.4, Tailwind CSS 4.3.1, Supabase JS 2.106.2.
- `tsconfig.json`: strict, noEmit, bundler resolution, alias `@/* -> src/*`; включены генерируемые типы Next. Команда выше отключает incremental cache.
- `eslint.config.mjs`: flat config на основе Next core-web-vitals. Чистые правила проверяются встроенным Node.js test runner через `npm run test:unit`.
- `postcss.config.mjs`: `@tailwindcss/postcss`; в `globals.css` подключены theme и utilities Tailwind v4, базовые стили заданы вручную.
- `next.config.ts`: React Strict Mode, Server Actions body size 50 MB.
- `src/app`: маршруты, layouts, route handlers и глобальные стили.
- `src/widgets`: составные экраны; `src/features`: действия и формы; `src/entities`: модели, запросы и мутации предметных сущностей.
- `src/shared`: Supabase-клиенты, общие функции и UI. Перед UI-работой используйте `docs/engineering/component-index.md`.
- Каталоги `src/components`, `src/lib`, `src/data` сейчас не содержат файлов исходного кода. Старые ссылки на `src/lib/bronly-data.ts` неактуальны.
- В `supabase/migrations` 20 SQL-файлов: от `202606020000_reset_public_schema.sql` до `202606120001_fix_room_photos_standalone_rls.sql`. Локального `supabase/config.toml` нет; порядок настройки удалённой тестовой базы описан в `supabase-setup.md`.

## Graphify

Для этого аудита минимальный scope — `src`. Установленный CLI доступен через PATH:

```powershell
graphify update ./src
graphify query "Supabase requests calendar pricing" --graph ./src/graphify-out/graph.json --budget 1700
```

`update` выполняет AST-анализ без LLM/API-ключа. Проверены 314 файлов, граф содержит 1604 узла и 5214 связей; топология совпала с сохранённой, поэтому CLI не переписывал граф. `src/graphify-out` исключён из git. `npm run graphify:src` запускает более дорогой `extract` с semantic extraction; при отсутствии внешнего API достаточно `update`. После изменений исходников обновляйте минимальный затронутый scope.

## Итоговый архитектурный аудит

Состояние после задачи 15 от 2026-09-15:

| Область | Доказательство | Следствие для переработки |
|---|---|---|
| Направление слоёв | Автоматический аудит импортов не находит переходов `shared → entities/features/widgets/app`, `entities → features/widgets/app`, `features → widgets/app`, `widgets → app` | Новые исключения не добавлять; server actions держать в `features`, а общие date/money helpers — в `entities` или `shared` |
| Стили | `src/app/globals.css`: 319 строк; в TS/TSX нет потребителей `br-*` | В globals остаются только reset, глобальные токены, dashboard theme и общие keyframes; стили экранов задаются Tailwind-классами рядом с компонентами |
| Переиспользование UI | Удалены неиспользуемые legacy widgets и дублирующий accordion; актуальные точки перечислены в `component-index.md` | Перед созданием UI сначала проверять `shared/ui`, затем ближайшие widgets/features |
| Типы | Supabase-клиенты используют сгенерированный `Database`; нет `as any`, `as unknown` или `as never` | Узкие ручные типы допустимы только для join-проекций, которые Supabase не выводит полностью; доменные enum нужно проверять runtime guard, а не утверждать cast |
| Mock-данные | Остались только прямые mock-модули property/room/request для явно включаемого read-only demo | Реальные data loaders и мутации не подменяют инфраструктурную ошибку успехом; `BRONLY_DEMO_MODE=true` остаётся обязательным opt-in |
| Крупные модули | Сгенерированный `database.types.ts`; составные role/data orchestration файлы `admin-sections`, public loaders, request mutations и calendar browser | У файлов есть единая граница ответственности; при следующем функциональном изменении выделять независимый loader/section, если это уменьшает связанность без дублирования запросов |
| Ошибки | Пустых `catch` нет; намеренно игнорируемые browser/cookie ошибки снабжены пояснением | Не маскировать ошибки чтения пустыми данными и не возвращать ложный success |
| Миграции | Первая миграция содержит `drop schema if exists public cascade` | Полную историю применять только к новой изолированной базе; существующую базу обновлять согласованной additive-цепочкой |

Архитектурный аудит проверяет зависимости статически и не заменяет RLS smoke. После изменения схемы запускайте unit/TypeScript/build, затем SQL smoke на новой локальной PostgreSQL-базе и удаляйте её после отката тестовых транзакций.

## Unit-тесты бизнес-логики (задача 03)

Продуктовая опора: PRD 6–8 и 17. Из корня проекта:

```powershell
npm run test:unit
```

Используется встроенный `node:test` и `node:assert/strict` в Node.js 22.23.1 с удалением TypeScript-типов через `--experimental-strip-types`. Новые зависимости и отдельная сборка тестов не нужны; lockfile сохранён. Команда автоматически находит `tests/unit/*.test.ts` и завершается с ненулевым кодом при ошибке. Предупреждение Node `MODULE_TYPELESS_PACKAGE_JSON` означает определение ESM по синтаксису; тип модулей всего Next.js-проекта ради тестов не меняется.

Тесты проверяют ночи, базовую/сезонную цену, агентскую наценку, пересечения и соседние даты, параметры проживания, допустимые и запрещённые переходы заявок, лимиты номеров и границы active/grace/expired. Время для подписки передаётся явно, `.env`, Supabase, Next.js-сервер и сеть не нужны. Серверные функции вызывают те же извлечённые правила, что тесты; существующие экспорты подписки сохранены.

Новый сценарий добавляйте в соответствующий `tests/unit/*.test.ts`: импортируйте чистый модуль напрямую, без entity-barrel, который может загружать серверный код. Runtime-импорты используют расширение `.ts`; `allowImportingTsExtensions` разрешает их при существующем `noEmit`. Type-only импорты удаляются Node. Runner не проверяет типы — для этого отдельно выполняется `npx --no-install tsc --noEmit --incremental false`. Не добавляйте JSX, снимки разметки или моки базы в эти тесты.

Тесты фиксируют разные контракты границ: сезонная цена включает последнюю дату, а проживание и `room_busy_ranges` используют `[заезд, выезд)`. Проверяются общая дата выезда/следующего заезда, исключение checkout из календарной полосы, границы месяца и года, тарифные пороги 3/10 и трёхдневный grace period. Это техническая защита текущего поведения, а не новые продуктовые решения. Подсчёт номеров через БД, RLS, уведомления и фактическое сохранение заявки unit-тестами не подтверждаются; SQL-инварианты календаря проверяет `tests/rls/calendar-boundaries-smoke.sql` в изолированной базе.
