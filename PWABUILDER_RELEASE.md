# PWABuilder Release Checklist

## 1) Перед сборкой

- [ ] `public/manifest.json` валиден (`name`, `start_url`, `icons` 192/512)
- [ ] `public/sw.js` актуален
- [ ] Приложение открывается и работает локально (`npm run dev`)

## 2) Сборка и деплой

- [ ] Выполнить `npm run build`
- [ ] Опубликовать `dist/` на HTTPS URL
- [ ] Проверить production URL в браузере (без ошибок в консоли)

## 3) Упаковка в PWABuilder

- [ ] Открыть [PWABuilder](https://www.pwabuilder.com)
- [ ] Ввести production URL приложения
- [ ] Скачать Android-пакет (`.aab`, TWA)
- [ ] При необходимости скачать iOS-пакет (Xcode project)

## 4) Google Play

- [ ] Загрузить `.aab` в Internal testing
- [ ] Проверить установку и запуск на устройстве
- [ ] Перевести релиз в Production
- [ ] После первой публикации обновить SHA-256 в `assetlinks.json`

## 5) App Store (опционально)

- [ ] Открыть iOS-проект в Xcode на macOS
- [ ] Настроить Signing и Bundle Identifier
- [ ] Собрать архив и отправить через App Store Connect

## Быстрые ссылки

- Подробные шаги: `STORE_PUBLISHING.md`
- Play Console чек-лист: `PLAY_CONSOLE_CHECKLIST.md`
- Тексты для карточки приложения: `STORE_LISTING_TEXTS.md`
