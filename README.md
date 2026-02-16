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
- `npm run deploy` — деплой через Azure Static Web Apps CLI

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
