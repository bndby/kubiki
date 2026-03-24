import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';
import { t, I18nController } from '../i18n';

/** Идентификатор активной вкладки */
export type TabId = 'roll' | 'history' | 'settings';

@customElement('app-tabs')
export class AppTabs extends LitElement {
  constructor() { super(); new I18nController(this); }

  /** Текущая активная вкладка */
  @property({ type: String }) activeTab: TabId = 'roll';

  static styles = css`
    nav {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 100;
      display: flex;
      background: #ffffff;
      border-top: 1px solid rgba(0, 0, 0, 0.1);
      padding-bottom: env(safe-area-inset-bottom, 0px);
      box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.08);
    }

    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 3px;
      height: 56px;
      text-decoration: none;
      color: #8e9aaa;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.01em;
      transition: color 120ms ease;
      -webkit-tap-highlight-color: transparent;
    }

    a.active {
      color: #3a7bd5;
    }

    svg {
      width: 24px;
      height: 24px;
      flex-shrink: 0;
    }
  `;

  private renderTab(id: TabId, label: string, path: string, icon: unknown) {
    const isActive = this.activeTab === id;
    return html`
      <a href="${path}" class="${isActive ? 'active' : ''}" aria-current="${isActive ? 'page' : 'false'}">
        ${icon}
        <span>${label}</span>
      </a>
    `;
  }

  render() {
    const rollIcon = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="3"/>
        <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15.5" cy="8.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="8.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" stroke="none"/>
      </svg>
    `;

    const historyIcon = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <polyline points="12,7 12,12 15,14"/>
      </svg>
    `;

    const settingsIcon = html`
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    `;

    return html`
      <nav>
        ${this.renderTab('roll',     t('tabRoll'),     resolveRouterPath(),            rollIcon)}
        ${this.renderTab('history',  t('tabHistory'),  resolveRouterPath('history'),   historyIcon)}
        ${this.renderTab('settings', t('tabSettings'), resolveRouterPath('settings'),  settingsIcon)}
      </nav>
    `;
  }
}
