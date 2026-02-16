import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';

import { styles } from '../styles/shared-styles';

type RollState = 'idle' | 'rolling' | 'result';

@customElement('app-roll')
export class AppRoll extends LitElement {
  @state() private diceCount = 1;
  @state() private rollState: RollState = 'idle';
  @state() private currentValues: number[] = [1];

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
        padding: 20px;
      }

      h2 {
        margin: 0;
      }

      #hint {
        margin: 8px 0 12px;
      }

      #diceRow {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        flex-wrap: wrap;
        column-gap: 26px;
        row-gap: 18px;
        margin: 0;
        padding: 12px 14px;
      }

      .die {
        border: 2px solid color-mix(in oklab, var(--app-color-primary) 45%, #9aa4b2);
        border-radius: 16px;
        width: min(96px, 100%);
        aspect-ratio: 1 / 1;
        justify-self: center;
        display: flex;
        justify-content: center;
        align-items: center;
        background: linear-gradient(145deg, #ffffff 0%, #f2f4f8 100%);
        box-shadow:
          0 8px 20px rgba(0, 0, 0, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .face {
        width: 78%;
        height: 78%;
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        place-items: center;
      }

      .pip {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #1f2937;
        opacity: 0;
        transform: scale(0.85);
      }

      .pip.visible {
        opacity: 1;
        transform: scale(1);
      }

      .rolling {
        animation: wobble 380ms linear infinite;
      }

      #actionRow {
        padding-top: 16px;
        display: grid;
        gap: 10px;
      }

      sl-button {
        width: 100%;
      }

      @keyframes wobble {
        0% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
        25% {
          transform: translateY(-4px) rotate(-8deg) scale(1.03);
        }
        50% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
        75% {
          transform: translateY(-3px) rotate(8deg) scale(1.02);
        }
        100% {
          transform: translateY(0) rotate(0deg) scale(1);
        }
      }
    `,
  ];

  firstUpdated() {
    this.diceCount = this.getDiceCountFromQuery();
    this.currentValues = this.createRandomRoll(this.diceCount);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearRollTimers();
  }

  private getDiceCountFromQuery(): number {
    const params = new URLSearchParams(window.location.search);
    const rawCount = Number(params.get('count'));

    if (!Number.isInteger(rawCount)) {
      return 1;
    }

    return Math.min(3, Math.max(1, rawCount));
  }

  private createRandomRoll(count: number): number[] {
    return Array.from({ length: count }, () => Math.floor(Math.random() * 6) + 1);
  }

  private getVisiblePips(value: number): number[] {
    switch (value) {
      case 1:
        return [5];
      case 2:
        return [1, 9];
      case 3:
        return [1, 5, 9];
      case 4:
        return [1, 3, 7, 9];
      case 5:
        return [1, 3, 5, 7, 9];
      case 6:
        return [1, 3, 4, 6, 7, 9];
      default:
        return [5];
    }
  }

  private renderDie(value: number) {
    const visiblePips = this.getVisiblePips(value);

    return html`
      <div class="die ${this.rollState === 'rolling' ? 'rolling' : ''}">
        <div class="face" role="img" aria-label="Кубик: ${value}">
          ${Array.from({ length: 9 }, (_, index) => index + 1).map(
            (position) => html`
              <span class="pip ${visiblePips.includes(position) ? 'visible' : ''}"></span>
            `
          )}
        </div>
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
    }, 3000);
  }

  render() {
    return html`
      <app-header></app-header>

      <main>
        <div id="screen">
          <sl-card id="rollCard">
            <h2>Кубиков: ${this.diceCount}</h2>

            <p id="hint">
              ${this.rollState === 'rolling'
                ? 'Бросаю...'
                : 'Нажмите "Бросаю", чтобы получить новый результат.'}
            </p>

            <div id="diceRow">
              ${this.currentValues.map((value) => this.renderDie(value))}
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
              <sl-button href="${resolveRouterPath()}" variant="default" size="large">
                К выбору кубиков
              </sl-button>
            </div>
          </sl-card>
        </div>
      </main>
    `;
  }
}
