# Чек-лист полей для Google Play Console

Ниже чек-лист, который можно проходить сверху вниз перед публикацией.

## 1) Setup приложения

- [ ] **App name**: `PWA Kubiki`
- [ ] **Default language**: `Russian (ru-RU)` или нужная основная
- [ ] **App or Game**: `App`
- [ ] **Free or Paid**: обычно `Free`

## 2) Dashboard / Policy status

- [ ] Все обязательные карточки в Dashboard помечены как Completed
- [ ] Нет блокирующих Policy issues

## 3) App content

### Privacy Policy

- [ ] Указан публичный URL privacy policy (https)
- [ ] Политика доступна без авторизации

### Data safety

- [ ] Отмечено, собираются ли данные (для текущего приложения обычно: не собираются)
- [ ] Отмечено, передаются ли данные третьим лицам (обычно: нет)
- [ ] Заполнены все обязательные ответы формы

### Target audience

- [ ] Выбрана корректная возрастная аудитория
- [ ] Заполнены дополнительные поля, если Play запрашивает

### Ads

- [ ] Указано, содержит ли приложение рекламу (обычно: нет)

### Content rating

- [ ] Пройден опросник и получен рейтинг контента

## 4) Store presence

### Main store listing

- [ ] App name
- [ ] Short description
- [ ] Full description
- [ ] App icon 512x512 (PNG, без прозрачности если требуется)
- [ ] Feature graphic 1024x500
- [ ] Скриншоты телефона (минимум 2)
- [ ] Скриншоты планшета (опционально, но желательно при поддержке)

### Contact details

- [ ] Email для поддержки
- [ ] Website (опционально)
- [ ] Phone (опционально)

## 5) Test and release

### Internal testing

- [ ] Создан тестовый трек (Internal testing)
- [ ] Загружен подписанный `.aab`
- [ ] Назначены тестировщики
- [ ] Проверена установка и запуск

### Production

- [ ] Создан Production release
- [ ] Загружен релизный `.aab`
- [ ] Заполнены Release notes
- [ ] Нажато Submit for review

## 6) Техническая проверка перед загрузкой AAB

- [ ] Production URL доступен по HTTPS
- [ ] `manifest.json` валиден (name, start_url, icons 192/512)
- [ ] Service Worker зарегистрирован и активен
- [ ] AAB сгенерирован через PWABuilder (Android/TWA)
- [ ] Package ID в PWABuilder: `by.bnd.pwakubiki`
- [ ] После публикации обновлен SHA-256 в `assetlinks.json`

## 7) Минимальный пакет файлов, который нужно держать под рукой

- [ ] `AAB` файл релиза
- [ ] Иконка 512x512
- [ ] Feature graphic 1024x500
- [ ] 2-8 скриншотов телефона
- [ ] URL Privacy Policy
- [ ] Тексты карточки приложения
