import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { getDiceType } from '../dice-config';
import { loadHistory, clearHistory, type HistoryEntry } from '../storage';
import { t, tn, I18nController } from '../i18n';

import '../components/dice-svg-icon';
import '../components/header';
import '../components/app-tabs';

import { styles } from '../styles/shared-styles';

@customElement('app-history')
export class AppHistory extends LitElement {
  constructor() { super(); new I18nController(this); }

  @state() private entries: HistoryEntry[] = [];

  static styles = [
    styles,
    css`
      main {
        background: #f2f4f8;
        display: flex;
        flex-direction: column;
        overflow-y: auto;
      }

      #clearBtn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 8px;
        background: transparent;
        color: #e03a3a;
        cursor: pointer;
        transition: background 120ms ease, transform 120ms ease;
        -webkit-tap-highlight-color: transparent;
        padding: 0;
      }

      #clearBtn:hover {
        background: rgba(224, 58, 58, 0.1);
      }

      #clearBtn:active {
        transform: scale(0.9);
      }

      #clearBtn svg {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
      }

      #list {
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      #empty {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: #8e9aaa;
        font-size: 15px;
        padding: 40px 16px;
        text-align: center;
      }

      #empty svg {
        width: 48px;
        height: 48px;
        opacity: 0.4;
      }

      .entry {
        background: #ffffff;
        border-radius: 20px;
        padding: 14px 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }

      .entryTitle {
        font-size: 14px;
        font-weight: 700;
        color: #2d3748;
        margin: 0 0 10px;
      }

      .diceRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }

      .dieIcon {
        width: 42px;
        height: 42px;
        border-radius: 10px;
        overflow: hidden;
        flex-shrink: 0;
        background: #f0f3f8;
        padding: 4px;
        box-sizing: border-box;
      }

      dice-svg-icon {
        width: 100%;
        height: 100%;
      }

      .entryTotal {
        font-size: 20px;
        font-weight: 800;
        color: #1a2a3a;
        margin: 0 0 4px;
      }

      .entryTime {
        font-size: 12px;
        color: #8e9aaa;
        margin: 0;
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    this.entries = loadHistory();
  }

  private handleClear() {
    clearHistory();
    this.entries = [];
  }

  private formatTime(timestamp: number): string {
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60_000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return t('timeJustNow');
    if (diffMin < 60) return tn(t('timeMinAgo'), diffMin);
    if (diffHour < 24) return tn(t('timeHourAgo'), diffHour);
    return tn(t('timeDayAgo'), diffDay);
  }

  private formatTitle(entry: HistoryEntry, rollNumber: number): string {
    return `${t('historyRollTitle')} #${rollNumber}: ${entry.diceCount}×${entry.diceType.toUpperCase()}`;
  }

  private renderEntry(entry: HistoryEntry, index: number, total: number) {
    const diceType = getDiceType(entry.diceType);
    const rollNumber = total - index;

    return html`
      <article class="entry">
        <p class="entryTitle">${this.formatTitle(entry, rollNumber)}</p>

        <div class="diceRow">
          ${entry.values.map(
            (value) => html`
              <div class="dieIcon">
                <dice-svg-icon
                  dice-type="${diceType.id}"
                  dice-color="${diceType.color}"
                  face-value="${value}"
                ></dice-svg-icon>
              </div>
            `
          )}
        </div>

        <p class="entryTotal">${t('sumLabel')} ${entry.total}</p>
        <p class="entryTime">${this.formatTime(entry.timestamp)}</p>
      </article>
    `;
  }

  render() {
    const hasEntries = this.entries.length > 0;

    return html`
      <app-header pageTitle="${t('headerHistory')}">
        ${hasEntries
          ? html`
              <button id="clearBtn" @click=${this.handleClear} title="${t('clearHistory')}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6"/>
                  <path d="M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
              </button>
            `
          : ''}
      </app-header>

      <main>
        ${hasEntries
          ? html`
              <div id="list">
                ${this.entries.map((entry, index) =>
                  this.renderEntry(entry, index, this.entries.length)
                )}
              </div>`
          : html`
              <div id="empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="9"/>
                  <polyline points="12,7 12,12 15,14"/>
                </svg>
                <p>${t('historyEmpty')}</p>
                <p>${t('historyEmptyHint')}</p>
              </div>
            `}
      </main>

      <app-tabs activeTab="history"></app-tabs>
    `;
  }
}
