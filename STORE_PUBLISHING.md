# Публикация приложения через PWABuilder

Проект переведен на web-first подход: приложение публикуется как PWA и пакуется в сторы через PWABuilder, без Capacitor-пайплайна.

## Минимальные требования перед упаковкой

1. Приложение доступно по HTTPS URL (production или staging).
2. Манифест подключен в `index.html` и содержит минимум:
   - `name`,
   - `start_url`,
   - `icons` (минимум 192x192 и 512x512).
3. Service Worker регистрируется в `index.html`.
4. Проект собирается без ошибок: `npm run build`.

## Что проверять в этом проекте

- Манифест: `public/manifest.json`
- Service Worker: `public/sw.js`
- Регистрация Service Worker: `index.html`

## Android (Google Play) через PWABuilder

1. Собрать и задеплоить веб-версию:
   - `npm run build`
   - загрузить `dist/` на хостинг с HTTPS.
2. Открыть [PWABuilder](https://www.pwabuilder.com) и ввести URL приложения.
3. В разделе упаковки выбрать Android (TWA) и скачать `.aab`.
4. Загрузить `.aab` в Google Play Console.
5. После первой публикации обновить `assetlinks.json` SHA-256 отпечатком из Play Console, чтобы TWA работал корректно без адресной строки.

## iOS (App Store) через PWABuilder

1. В PWABuilder выбрать упаковку для iOS и скачать Xcode-проект.
2. На macOS открыть проект в Xcode, настроить Signing и Bundle Identifier.
3. Собрать архив и отправить через App Store Connect.

## Рабочий цикл после изменений

После изменений в `src/`:

1. `npm run build`
2. задеплоить новую веб-версию;
3. при необходимости переупаковать билд в PWABuilder.
