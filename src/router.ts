// Документация роутера: https://github.com/thepassle/app-tools/blob/master/router/README.md

import { html } from 'lit';

if (!(globalThis as any).URLPattern) {
  await import('urlpattern-polyfill');
}

import { Router } from '@thepassle/app-tools/router.js';

// @ts-ignore
import { title } from '@thepassle/app-tools/router/plugins/title.js';

import './pages/app-roll.js';
import './pages/app-history.js';
import './pages/app-settings.js';

const baseURL: string = (import.meta as any).env.BASE_URL;

export const router = new Router({
  routes: [
    {
      path: resolveRouterPath(),
      title: 'Бросок кубиков',
      render: () => html`<app-roll></app-roll>`,
    },
    {
      path: resolveRouterPath('history'),
      title: 'История бросков',
      render: () => html`<app-history></app-history>`,
    },
    {
      path: resolveRouterPath('settings'),
      title: 'Настройки броска',
      render: () => html`<app-settings></app-settings>`,
    },
  ],
});

/**
 * Разрешает маршрутный путь относительно базового URL приложения.
 * @param unresolvedPath Относительный путь (например, 'history')
 * @returns Полный путь с учётом BASE_URL
 */
export function resolveRouterPath(unresolvedPath?: string): string {
  let resolvedPath = baseURL;
  if (unresolvedPath) {
    resolvedPath = resolvedPath + unresolvedPath;
  }
  return resolvedPath;
}
