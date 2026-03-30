# PWA Kubiki

Веб-приложение для броска игровых кубиков (1-3), подготовленное к публикации в сторы через PWABuilder.

## Стек

- `Vite`
- `TypeScript`
- `Lit`
- `vite-plugin-pwa` (Workbox, `injectManifest`)

## Локальный запуск

1. Установить зависимости:
   - `npm install`
2. Запустить dev-сервер:
   - `npm run dev`

## Основные команды

- `npm run dev` — локальная разработка
- `npm run build` — production-сборка в `dist/`
- `npm run deploy` — только для **ручного** выкладывания: `npm run build` и `wrangler pages deploy dist` (нужны токен и `CLOUDFLARE_ACCOUNT_ID`, см. [документацию Wrangler](https://developers.cloudflare.com/workers/wrangler/commands/#deploy)). Поле `name` в `wrangler.toml` должно совпадать с именем проекта **Pages** в Dashboard.

### Cloudflare Pages при деплое из Git

В настройках проекта **Workers & Pages → ваш проект → Settings → Builds**:

| Поле | Значение |
|------|----------|
| Build command | `npm run build` |
| Build output directory | `dist` |
| **Deploy command** | **оставить пустым** |

После сборки Cloudflare сам публикует содержимое `dist`. Не указывайте `npx wrangler deploy` — это команда для **Cloudflare Workers**; она запускает авто-настройку Vite с `@cloudflare/vite-plugin` и на типичном Pages-билде приводит к ошибкам вроде «ESM only but tried to load by require».

Если в репозитории появились правки от неудачного `wrangler deploy` (импорт `@cloudflare/vite-plugin` в `vite.config.ts`, `wrangler.jsonc` для Worker), откатите их: для этого приложения достаточно обычного Vite-сборщика и при необходимости `public/_redirects` (SPA fallback).

## PWA-конфигурация

- Манифест: `public/manifest.json`
- Service Worker исходник: `public/sw.js`
- Регистрация Service Worker: `index.html`

## Релизный процесс (PWABuilder)

1. Собрать веб-приложение: `npm run build`
2. Опубликовать `dist/` на HTTPS-домен
3. Открыть URL в [PWABuilder](https://www.pwabuilder.com)
4. Скачать Android `.aab` (TWA) и/или iOS-пакет
5. Загрузить сборку в соответствующий стор

Короткий чек-лист: `PWABUILDER_RELEASE.md`  
Подробный процесс: `STORE_PUBLISHING.md`  
Чек-лист Play Console: `PLAY_CONSOLE_CHECKLIST.md`
