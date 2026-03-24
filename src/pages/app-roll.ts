import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { clampDiceCount, DEFAULT_DICE_TYPE, getDiceType, type DiceTypeConfig } from '../dice-config';
import { loadSettings, addToHistory } from '../storage';
import { t, I18nController } from '../i18n';

import '../components/dice-webgl-icon';
import '../components/header';
import '../components/app-tabs';

import { styles } from '../styles/shared-styles';

type RollState = 'idle' | 'rolling' | 'result';

@customElement('app-roll')
export class AppRoll extends LitElement {
  constructor() { super(); new I18nController(this); }

  @state() private diceType: DiceTypeConfig = getDiceType(DEFAULT_DICE_TYPE);
  @state() private diceCount = 2;
  @state() private rollState: RollState = 'idle';
  @state() private currentValues: number[] = [];

  private readonly rollDurationMs = 3000;
  private rollIntervalId?: number;
  private rollTimeoutId?: number;

  static styles = [
    styles,
    css`
      main {
        background: linear-gradient(160deg, var(--felt-bg) 0%, var(--felt-bg-dark) 100%);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      #sumBanner {
        margin: 12px 16px 0;
        padding: 14px 20px;
        border-radius: 16px;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(6px);
        text-align: center;
        color: #ffffff;
        font-size: 28px;
        font-weight: 800;
        letter-spacing: -0.02em;
        flex-shrink: 0;
      }

      #sumBanner.rolling {
        opacity: 0.7;
      }

      #diceArea {
        flex: 1;
        display: grid;
        justify-content: center;
        align-content: center;
        gap: 16px;
        padding: 20px 16px;
        overflow: hidden;
      }

      /* Grid columns by count */
      #diceArea.cols-1 { grid-template-columns: auto; }
      #diceArea.cols-2 { grid-template-columns: auto auto; }
      #diceArea.cols-3 { grid-template-columns: auto auto auto; }

      /* Die preview sizes by count */
      #diceArea.count-1 .diePreview { width: 150px; height: 150px; }
      #diceArea.count-2 .diePreview { width: 130px; height: 130px; }
      #diceArea.count-3 .diePreview { width: 96px;  height: 96px; }
      #diceArea.count-4 .diePreview { width: 120px; height: 120px; }
      #diceArea.count-5 .diePreview { width: 88px;  height: 88px; }
      #diceArea.count-6 .diePreview { width: 88px;  height: 88px; }

      /* Center the 2-item last row for 5 dice (3 cols, last row = 2 items):
         offset = (3 * dieW + 2 * gap − 2 * dieW − 1 * gap) / 2 = (dieW + gap) / 2
         = (88 + 16) / 2 = 52px */
      #diceArea.count-5 .dieCard:nth-child(4) {
        margin-left: 52px;
      }

      .dieCard {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }

      .dieCard.rolling {
        animation: dieBounce 400ms ease-in-out infinite alternate;
      }

      .diePreview {
        /* default (fallback) size */
        width: 88px;
        height: 88px;
        border-radius: 18%;
        overflow: hidden;
      }

      dice-webgl-icon {
        width: 100%;
        height: 100%;
      }

      .dieValue {
        min-width: 48px;
        padding: 4px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        text-align: center;
      }

      #rollBtn {
        display: block;
        flex-shrink: 0;
        margin: 0 16px 16px;
        padding: 16px;
        border: none;
        border-radius: 16px;
        background: var(--app-color-primary);
        color: #ffffff;
        font-size: 17px;
        font-weight: 700;
        letter-spacing: -0.01em;
        cursor: pointer;
        box-shadow: 0 6px 20px rgba(58, 123, 213, 0.38);
        transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms ease;
        text-align: center;
        box-sizing: border-box;
        -webkit-tap-highlight-color: transparent;
      }

      #rollBtn:hover {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(58, 123, 213, 0.46);
      }

      #rollBtn:active {
        transform: scale(0.98);
      }

      #rollBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }

      @keyframes dieBounce {
        0%   { transform: translateY(0) rotate(-2deg); }
        100% { transform: translateY(-8px) rotate(2deg); }
      }

      @media (max-width: 380px) {
        #diceArea .diePreview { width: 72px; height: 72px; }
        /* Re-center 2-item last row: (72 + 16) / 2 = 44px */
        #diceArea.count-5 .dieCard:nth-child(4) { margin-left: 44px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .dieCard.rolling { animation: none; }
      }
    `,
  ];

  connectedCallback() {
    super.connectedCallback();
    const settings = loadSettings();
    this.diceType = getDiceType(settings.type);
    this.diceCount = clampDiceCount(settings.count);
    this.currentValues = this.makeRoll(clampDiceCount(settings.count));
    this.rollState = 'result';
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearTimers();
  }

  private get gridCols(): number {
    if (this.diceCount <= 3) return this.diceCount;
    if (this.diceCount === 4) return 2;
    return 3; // 5, 6
  }

  private makeRoll(count: number): number[] {
    return Array.from({ length: count }, () =>
      Math.floor(Math.random() * this.diceType.sides) + 1
    );
  }

  private getTotal(): number {
    return this.currentValues.reduce((sum, v) => sum + v, 0);
  }

  private clearTimers() {
    if (this.rollIntervalId !== undefined) {
      window.clearInterval(this.rollIntervalId);
      this.rollIntervalId = undefined;
    }
    if (this.rollTimeoutId !== undefined) {
      window.clearTimeout(this.rollTimeoutId);
      this.rollTimeoutId = undefined;
    }
  }

  private rollDice() {
    if (this.rollState === 'rolling') return;

    this.clearTimers();
    this.rollState = 'rolling';
    this.currentValues = this.makeRoll(this.diceCount);

    this.rollIntervalId = window.setInterval(() => {
      this.currentValues = this.makeRoll(this.diceCount);
    }, 120);

    this.rollTimeoutId = window.setTimeout(() => {
      this.clearTimers();
      const finalValues = this.makeRoll(this.diceCount);
      this.currentValues = finalValues;
      this.rollState = 'result';

      addToHistory({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        diceType: this.diceType.id,
        diceCount: this.diceCount,
        values: finalValues,
        total: finalValues.reduce((s, v) => s + v, 0),
      });
    }, this.rollDurationMs);
  }

  private renderDie(value: number, index: number) {
    const isRolling = this.rollState === 'rolling';
    const motionMode = isRolling ? 'rolling' : 'still';

    return html`
      <div
        class="dieCard ${isRolling ? 'rolling' : ''}"
        role="img"
        aria-label="${this.diceType.id.toUpperCase()} #${index + 1}: ${value}"
      >
        <div class="diePreview">
          <dice-webgl-icon
            dice-type="${this.diceType.id}"
            dice-color="${this.diceType.color}"
            motion-mode="${motionMode}"
            roll-duration-ms="${this.rollDurationMs}"
            face-value="${value}"
          ></dice-webgl-icon>
        </div>
        <div class="dieValue">${value}</div>
      </div>
    `;
  }

  render() {
    const isRolling = this.rollState === 'rolling';

    return html`
      <app-header pageTitle="${t('headerRoll')}"></app-header>

      <main>
        <div id="sumBanner" class="${isRolling ? 'rolling' : ''}">
          ${t('sumLabel')} ${this.getTotal()}
        </div>

        <div id="diceArea" class="cols-${this.gridCols} count-${this.diceCount}">
          ${this.currentValues.map((value, index) => this.renderDie(value, index))}
        </div>

        <button
          id="rollBtn"
          @click=${this.rollDice}
          ?disabled=${isRolling}
          aria-label="${t('rollBtnAria')}"
        >
          ${t('rollBtn')}
        </button>
      </main>

      <app-tabs activeTab="roll"></app-tabs>
    `;
  }
}
