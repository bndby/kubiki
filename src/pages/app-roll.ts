import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';
import { clampDiceCount, DEFAULT_DICE_TYPE, getDiceType } from '../dice-config';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '../components/dice-webgl-icon';

import { styles } from '../styles/shared-styles';

type RollState = 'idle' | 'rolling' | 'result';

@customElement('app-roll')
export class AppRoll extends LitElement {
  @state() private diceCount = 1;
  @state() private diceType = getDiceType(DEFAULT_DICE_TYPE);
  @state() private rollState: RollState = 'idle';
  @state() private currentValues: number[] = [1];

  private readonly rollDurationMs = 3000;
  private rollIntervalId?: number;
  private rollTimeoutId?: number;

  static styles = [
    styles,
    css`
      #screen {
        display: flex;
        width: 100%;
        height: calc(100dvh - var(--app-header-height));
      }

      #rollCard {
        box-sizing: border-box;
        width: 100%;
        height: calc(100dvh - var(--app-header-height));
        padding: 20px;
        border-radius: 0;
      }

      #rollCard::part(body) {
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        height: 100%;
        padding: 16px;
      }

      h2 {
        margin: 0;
      }

      #summaryRow {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 10px;
      }

      .summaryChip {
        padding: 7px 12px;
        border-radius: 999px;
        background: color-mix(in oklab, var(--app-color-primary) 10%, white);
        color: #223243;
        font-size: 14px;
        box-shadow: inset 0 0 0 1px rgba(138, 160, 184, 0.24);
      }

      #diceRow {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        flex-wrap: wrap;
        column-gap: 18px;
        row-gap: 10px;
        margin: 0;
        padding: 10px 8px;
      }

      .dieCard {
        width: min(112px, 100%);
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 8px;
        transition: transform 220ms ease;
      }

      .dieCard.rolling {
        animation: bounce 420ms ease-in-out infinite alternate;
      }

      .diePreview {
        width: 100%;
        max-width: 62px;
        aspect-ratio: 1 / 1;
      }

      dice-webgl-icon {
        width: 100%;
        height: 100%;
      }

      .dieValueChip {
        min-width: 58px;
        padding: 5px 10px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow:
          0 6px 14px rgba(15, 23, 42, 0.1),
          inset 0 0 0 1px rgba(138, 160, 184, 0.18);
        font-size: 12px;
        font-weight: 800;
        text-align: center;
        color: #243445;
      }

      #actionRow {
        padding-top: 12px;
        display: grid;
        gap: 10px;
      }

      sl-button {
        width: 100%;
      }

      @keyframes bounce {
        0% {
          transform: translateY(0);
        }
        100% {
          transform: translateY(-5px);
        }
      }

      @media (min-width: 760px) {
        .dieCard {
          width: min(124px, 100%);
        }

        .diePreview {
          max-width: 76px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .dieCard.rolling {
          animation: none;
        }
      }
    `,
  ];

  firstUpdated() {
    this.readSelectionFromQuery();
    this.currentValues = this.createRandomRoll(this.diceCount);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearRollTimers();
  }

  private readSelectionFromQuery() {
    const params = new URLSearchParams(window.location.search);
    this.diceType = getDiceType(params.get('type'));
    this.diceCount = clampDiceCount(Number(params.get('count')));
  }

  private getSelectionPath(): string {
    const selectionUrl = new URL(resolveRouterPath(), window.location.origin);
    selectionUrl.searchParams.set('count', String(this.diceCount));
    selectionUrl.searchParams.set('type', this.diceType.id);
    return `${selectionUrl.pathname}${selectionUrl.search}`;
  }

  private createRandomValue(): number {
    return Math.floor(Math.random() * this.diceType.sides) + 1;
  }

  private createRandomRoll(count: number): number[] {
    return Array.from({ length: count }, () => this.createRandomValue());
  }

  private getTotalValue(): number {
    return this.currentValues.reduce((sum, value) => sum + value, 0);
  }

  private getMotionMode(): 'rolling' | 'still' {
    return this.rollState === 'rolling' ? 'rolling' : 'still';
  }

  private renderDie(value: number, index: number) {
    const isRolling = this.rollState === 'rolling';

    return html`
      <div class="dieCard ${isRolling ? 'rolling' : ''}" role="img" aria-label="${this.diceType.id.toUpperCase()}: ${value}">
        <div class="diePreview">
          <dice-webgl-icon
            dice-type="${this.diceType.id}"
            motion-mode="${this.getMotionMode()}"
            roll-duration-ms="${this.rollDurationMs}"
            face-value="${value}"
          ></dice-webgl-icon>
        </div>
        <div class="dieValueChip">#${index + 1}: ${value}</div>
      </div>
    `;
  }

  private clearRollTimers() {
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
    if (this.rollState === 'rolling') {
      return;
    }

    this.clearRollTimers();
    this.rollState = 'rolling';
    this.currentValues = this.createRandomRoll(this.diceCount);

    this.rollIntervalId = window.setInterval(() => {
      this.currentValues = this.createRandomRoll(this.diceCount);
    }, 120);

    this.rollTimeoutId = window.setTimeout(() => {
      this.clearRollTimers();
      this.currentValues = this.createRandomRoll(this.diceCount);
      this.rollState = 'result';
    }, this.rollDurationMs);
  }

  render() {
    return html`
      <app-header></app-header>

      <main>
        <div id="screen">
          <sl-card id="rollCard">
            <h2>${this.diceType.id.toUpperCase()} · ${this.diceType.solidName}</h2>

            <div id="summaryRow">
              <span class="summaryChip">Кубиков: ${this.diceCount}</span>
              <span class="summaryChip">Граней: ${this.diceType.sides}</span>
              <span class="summaryChip">Сумма: ${this.getTotalValue()}</span>
            </div>

            <div id="diceRow">
              ${this.currentValues.map((value, index) => this.renderDie(value, index))}
            </div>

            <div id="actionRow">
              <sl-button
                variant="primary"
                size="large"
                @click=${this.rollDice}
                ?disabled=${this.rollState === 'rolling'}
              >
                Бросаю
              </sl-button>
              <sl-button href="${this.getSelectionPath()}" variant="default" size="large">
                К выбору кубиков
              </sl-button>
            </div>
          </sl-card>
        </div>
      </main>
    `;
  }
}
