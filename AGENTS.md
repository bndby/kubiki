# AGENTS.md — Руководство для AI-агентов

## Обзор проекта

**pwa-kubiki** — прогрессивное веб-приложение (PWA) для броска игральных кубиков. Поддерживает типы d4, d6, d8, d10, d12, d20. Полностью клиентское, без бэкенда. Деплоится на GitHub Pages или Cloudflare Pages.

---

## Технологический стек

| Слой | Технология |
|------|-----------|
| UI-компоненты | **Lit 3** (web components, TypeScript декораторы) |
| UI-библиотека | **Shoelace 2** (загружается с jsDelivr CDN в `index.html`) |
| 3D-рендеринг | **three.js 0.183** (WebGL-иконки кубиков) |
| Роутер | `@thepassle/app-tools` Router + URLPattern |
| Сборка | **Vite 7** (`tsc && vite build`) |
| PWA / SW | `vite-plugin-pwa` в режиме `injectManifest`; SW-исходник: `public/sw.js` |
| Деплой | Cloudflare Pages (`wrangler pages deploy dist`) или GitHub Pages (Actions) |
| TypeScript | 5.9, strict, experimentalDecorators для Lit |

---

## Структура директорий

```
pwa-kubiki/
├── src/
│   ├── app-index.ts          # Корневой custom element <app-index>
│   ├── router.ts             # Маршруты и resolveRouterPath()
│   ├── storage.ts            # localStorage: настройки, история (≤50 записей), язык
│   ├── dice-config.ts        # Типы d4–d20, визуальные данные, лимиты
│   ├── components/
│   │   ├── header.ts         # <app-header>
│   │   ├── app-tabs.ts       # Нижняя навигация
│   │   ├── dice-svg-icon.ts
│   │   └── dice-webgl-icon.ts
│   ├── pages/
│   │   ├── app-roll.ts       # Экран броска (состояния: idle/rolling/result)
│   │   ├── app-history.ts    # История бросков
│   │   ├── app-settings.ts   # Настройки: тип кубика, кол-во, язык
│   │   └── app-about/        # Заготовка, не подключена к роутеру
│   ├── i18n/
│   │   ├── index.ts          # t(), setLanguage(), I18nController
│   │   ├── languages.ts
│   │   └── translations.ts   # Словарь переводов
│   └── styles/
│       ├── global.css
│       └── shared-styles.ts
├── public/
│   ├── manifest.json         # PWA-манифест (app id: by.bnd.kubiki)
│   ├── sw.js                 # Service Worker: precache + PWA Widget (Workbox 7)
│   ├── widget/               # data.json, ac.json — Adaptive Cards для виджета
│   ├── _redirects            # SPA fallback для Cloudflare Pages
│   └── assets/
│       ├── icons/            # Иконки PWA (ссылаются из manifest.json)
│       └── screenshots/      # Скриншоты для стора
├── index.html                # Точка входа, регистрация SW, <app-index>
├── vite.config.ts
├── tsconfig.json             # emitDeclarationOnly → types/, moduleResolution: bundler
├── wrangler.toml             # Cloudflare Pages
└── .github/workflows/
    ├── deploy-pages.yml      # Основной CI/CD (Node 20, GitHub Pages)
    └── main.yml              # Legacy-вариант (Node 16, устарел)
```

---

## Маршруты приложения

| Путь | Компонент | Заголовок |
|------|-----------|-----------|
| `{BASE_URL}` | `<app-roll>` | Бросок кубиков |
| `{BASE_URL}history` | `<app-history>` | История бросков |
| `{BASE_URL}settings` | `<app-settings>` | Настройки броска |

`BASE_URL` берётся из `import.meta.env.BASE_URL`. Все ссылки внутри приложения строятся через `resolveRouterPath()` из `src/router.ts`.

---

## Управление состоянием

- **Локальное состояние компонентов** — декоратор `@state()` (Lit).
- **Персистентность** — `src/storage.ts` через `localStorage`:
  - `saveSettings()` / `loadSettings()` — тип кубика, количество.
  - `addToHistory()` / `getHistory()` / `clearHistory()` — история бросков, лимит 50 записей.
  - Язык интерфейса.
- **i18n** — синглтон `_currentLang` в `src/i18n/index.ts`, подписка через `I18nController` (реактивный контроллер Lit), событие `langchange` на `window`.

---

## Стиль кода

Форматирование задано в `package.json` (prettier):

- Отступы: **2 пробела**
- Точка с запятой: **да**
- Кавычки: **одинарные**
- Trailing comma: **es5**
- End of line: **CRLF**
- Bracket spacing: **да**

Компоненты — **классы Lit** с декораторами `@customElement`, `@state`, `@property`. ESLint не настроен, тестов нет.

---

## Команды разработки

```bash
npm run dev          # Vite dev-сервер с открытием браузера
npm run dev-task     # Vite без открытия браузера
npm run build        # tsc + vite build → dist/
npm run deploy       # build + wrangler pages deploy dist
npm run start-remote # Vite с --host (внешний доступ)
```

---

## CI/CD

**Активный workflow: `.github/workflows/deploy-pages.yml`**
- Триггер: `push` в любую ветку + `workflow_dispatch`
- Node 20, `npm ci`
- `VITE_BASE_PATH`: `/` для `user.github.io`, иначе `/<repo>/`
- Деплой через `actions/deploy-pages@v4`

`.github/workflows/main.yml` — legacy (Node 16), запускается только вручную.

---

## PWA-специфика

- **Манифест** (`public/manifest.json`): `prefer_related_applications: true`, связь с Play Store. При изменении путей иконок — обновить `assets/icons/`.
- **Service Worker** (`public/sw.js`): precache через `workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)` + обработка событий виджета Windows (install/resume/click/uninstall).
- **Режим PWA**: `injectManifest` — Vite инжектирует список precache в `self.__WB_MANIFEST`. Регистрация SW в `index.html` вручную, `injectRegister: false`.
- **View Transitions**: `document.startViewTransition` при смене маршрута в `app-index.ts`.

---

