import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  clampDiceCount,
  DICE_TYPES,
  getDiceType,
  type DiceTypeConfig,
} from '../dice-config';
import { loadSettings, saveSettings } from '../storage';
import {
  t,
  setLanguage,
  getCurrentLang,
  getLanguages,
  I18nController,
  type Language,
} from '../i18n';

import '../components/dice-svg-icon';
import '../components/header';
import '../components/app-tabs';

import { styles } from '../styles/shared-styles';

@customElement('app-settings')
export class AppSettings extends LitElement {
  constructor() { super(); new I18nController(this); }

  @state() private selectedType: DiceTypeConfig = getDiceType('d6');
  @state() private diceCount = 2;
  @state() private selectedLang: string = getCurrentLang();

  static styles = [
    styles,
    css`
      main {
        background: #f2f4f8;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .content {
        flex: 1;
        min-height: 0;
        overflow-y: auto;
        padding: 20px 16px;
        display: flex;
        flex-direction: column;
        gap: 24px;
      }

      .section-title {
        margin: 0 0 12px;
        font-size: 13px;
        font-weight: 700;
        color: #6b7a8d;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }

      /* ── Dice type row ── */
      #typeRow {
        display: flex;
        gap: 10px;
        justify-content: space-between;
      }

      .typeTile {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .dieIconWrap {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        border: 2.5px solid transparent;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        padding: 4px;
        box-sizing: border-box;
      }

      .typeTile.selected .dieIconWrap {
        border-color: var(--app-color-primary);
        box-shadow: 0 0 0 3px rgba(58, 123, 213, 0.2), 0 3px 10px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      dice-svg-icon {
        width: 100%;
        height: 100%;
      }

      .typeLabel {
        font-size: 11px;
        font-weight: 700;
        color: #4a5568;
        letter-spacing: 0.04em;
      }

      .typeTile.selected .typeLabel {
        color: var(--app-color-primary);
      }

      /* ── Count row ── */
      #countRow {
        display: flex;
        gap: 8px;
        justify-content: space-between;
      }

      .countBtn {
        flex: 1;
        aspect-ratio: 1;
        border-radius: 50%;
        border: 2px solid #d1d9e6;
        background: #ffffff;
        font-size: 16px;
        font-weight: 700;
        color: #2d3748;
        cursor: pointer;
        transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
        -webkit-tap-highlight-color: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      }

      .countBtn.selected {
        background: var(--app-color-primary);
        border-color: var(--app-color-primary);
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(58, 123, 213, 0.4);
        transform: scale(1.08);
      }

      /* ── Language grid ── */
      #langGrid {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 10px;
      }

      .langTile {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 0;
        border: none;
        background: none;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .flagWrap {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 50%;
        border: 2.5px solid transparent;
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
        transition: border-color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
        padding: 4px;
        box-sizing: border-box;
        font-size: 22px;
        line-height: 1;
      }

      .langTile.selected .flagWrap {
        border-color: var(--app-color-primary);
        box-shadow: 0 0 0 3px rgba(58, 123, 213, 0.2), 0 3px 10px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }

      .langLabel {
        font-size: 10px;
        font-weight: 700;
        color: #4a5568;
        text-align: center;
        letter-spacing: 0.04em;
        line-height: 1.2;
        word-break: break-word;
        max-width: 100%;
      }

      .langTile.selected .langLabel {
        color: var(--app-color-primary);
      }

      .card {
        background: #ffffff;
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
      }
    `,
  ];

  firstUpdated() {
    const settings = loadSettings();
    this.selectedType = getDiceType(settings.type);
    this.diceCount = clampDiceCount(settings.count);
    this.selectedLang = getCurrentLang();
  }

  private selectType(diceType: DiceTypeConfig) {
    this.selectedType = diceType;
    saveSettings({ type: diceType.id, count: this.diceCount });
  }

  private selectCount(count: number) {
    this.diceCount = count;
    saveSettings({ type: this.selectedType.id, count });
  }

  private selectLang(lang: Language) {
    this.selectedLang = lang.code;
    setLanguage(lang.code);
  }

  private renderTypeTile(diceType: DiceTypeConfig) {
    const isSelected = this.selectedType.id === diceType.id;
    return html`
      <button
        type="button"
        class="typeTile ${isSelected ? 'selected' : ''}"
        @click=${() => this.selectType(diceType)}
        aria-pressed="${isSelected}"
        aria-label="${diceType.id.toUpperCase()}"
      >
        <div class="dieIconWrap">
          <dice-svg-icon
            dice-type="${diceType.id}"
            dice-color="${diceType.color}"
          ></dice-svg-icon>
        </div>
        <span class="typeLabel">${diceType.id.toUpperCase()}</span>
      </button>
    `;
  }

  private renderLangTile(lang: Language) {
    const isSelected = this.selectedLang === lang.code;
    return html`
      <button
        type="button"
        class="langTile ${isSelected ? 'selected' : ''}"
        @click=${() => this.selectLang(lang)}
        aria-pressed="${isSelected}"
        aria-label="${lang.name}"
        title="${lang.name}"
      >
        <div class="flagWrap">${lang.flag}</div>
        <span class="langLabel">${lang.nativeName}</span>
      </button>
    `;
  }

  render() {
    return html`
      <app-header pageTitle="${t('headerSettings')}"></app-header>

      <main>
        <div class="content">
          <!-- Dice type -->
          <div class="card">
            <p class="section-title">${t('settingsDiceType')}</p>
            <div id="typeRow">
              ${DICE_TYPES.map((dt) => this.renderTypeTile(dt))}
            </div>
          </div>

          <!-- Dice count -->
          <div class="card">
            <p class="section-title">${t('settingsCount')}</p>
            <div id="countRow">
              ${Array.from({ length: 6 }, (_, i) => i + 1).map(
                (n) => html`
                  <button
                    type="button"
                    class="countBtn ${this.diceCount === n ? 'selected' : ''}"
                    @click=${() => this.selectCount(n)}
                    aria-pressed="${this.diceCount === n}"
                  >
                    ${n}
                  </button>
                `
              )}
            </div>
          </div>

          <!-- Language -->
          <div class="card">
            <p class="section-title">${t('settingsLanguage')}</p>
            <div id="langGrid">
              ${getLanguages().map((lang) => this.renderLangTile(lang))}
            </div>
          </div>
        </div>
      </main>

      <app-tabs activeTab="settings"></app-tabs>
    `;
  }
}
