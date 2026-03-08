import { LitElement, css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';
import {
  clampDiceCount,
  DEFAULT_DICE_TYPE,
  DICE_TYPES,
  getDiceType,
  type DiceTypeConfig,
} from '../dice-config';

import '@shoelace-style/shoelace/dist/components/card/card.js';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '../components/dice-webgl-icon';

import { styles } from '../styles/shared-styles';

@customElement('app-home')
export class AppHome extends LitElement {
  @state() private selectedDiceType = getDiceType(DEFAULT_DICE_TYPE);
  @state() private diceCount = 1;

  static styles = [
    styles,
    css`
      #screen {
        display: flex;
        width: 100%;
        height: calc(100dvh - var(--app-header-height));
      }

      #selectCard {
        box-sizing: border-box;
        width: 100%;
        height: calc(100dvh - var(--app-header-height));
        padding: 20px;
        border-radius: 0;
      }

      #selectCard::part(body) {
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-sizing: border-box;
        height: 100%;
        padding: 12px;
        overflow: auto;
      }

      h2 {
        margin: 0;
        font-size: 22px;
        line-height: 1.05;
      }

      #typeGrid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 7px;
      }

      .typeTile {
        box-sizing: border-box;
        width: 100%;
        min-height: 118px;
        padding: 8px 6px 7px;
        border: 1.5px solid color-mix(in oklab, var(--app-color-primary) 42%, #90a3b6);
        border-radius: 18px;
        background:
          radial-gradient(circle at 26% 18%, rgba(255, 255, 255, 0.9), transparent 38%),
          linear-gradient(
            165deg,
            color-mix(in oklab, var(--app-color-primary) 14%, #fcfdff) 0%,
            #ffffff 44%,
            color-mix(in oklab, var(--app-color-primary) 8%, #edf3fb) 100%
          );
        color: inherit;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        gap: 4px;
        box-shadow:
          0 8px 16px rgba(15, 23, 42, 0.12),
          0 0 0 1px rgba(255, 255, 255, 0.72) inset;
        transition:
          transform 120ms ease,
          box-shadow 120ms ease,
          border-color 120ms ease,
          background 120ms ease;
        cursor: pointer;
        appearance: none;
        -webkit-tap-highlight-color: transparent;
      }

      .typeTile:hover {
        transform: translateY(-1px);
        box-shadow:
          0 12px 22px rgba(15, 23, 42, 0.16),
          0 0 0 3px color-mix(in oklab, var(--app-color-primary) 18%, transparent);
        border-color: var(--app-color-primary);
      }

      .typeTile.selected {
        border-color: color-mix(in oklab, var(--app-color-primary) 82%, #87a3c2);
        background:
          radial-gradient(circle at 24% 18%, rgba(255, 255, 255, 0.95), transparent 40%),
          linear-gradient(
            165deg,
            color-mix(in oklab, var(--app-color-primary) 20%, #ffffff) 0%,
            #ffffff 42%,
            color-mix(in oklab, var(--app-color-primary) 15%, #e6effa) 100%
          );
        box-shadow:
          0 14px 24px rgba(15, 23, 42, 0.16),
          0 0 0 3px color-mix(in oklab, var(--app-color-primary) 20%, transparent);
        transform: translateY(-1px);
      }

      .diePreview {
        width: 100%;
        max-width: 62px;
        aspect-ratio: 1 / 1;
        margin-top: 2px;
      }

      dice-webgl-icon {
        width: 100%;
        height: 100%;
      }

      .typeMeta {
        width: 100%;
        display: grid;
        justify-items: center;
        gap: 2px;
        text-align: center;
      }

      .typeId {
        padding: 2px 7px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.9);
        box-shadow: 0 3px 8px rgba(15, 23, 42, 0.08);
        font-size: 12px;
        line-height: 1;
        font-weight: 800;
        letter-spacing: 0.08em;
      }

      .typeName {
        min-height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        line-height: 1.05;
        font-weight: 700;
        text-wrap: balance;
      }

      .typeTeaser {
        font-size: 9px;
        color: #607283;
      }

      .hintText {
        margin: 4px 0 0;
        color: #546678;
        font-size: 13px;
      }

      #countCard {
        padding: 10px 12px 12px;
        border-radius: 16px;
        background: color-mix(in oklab, var(--app-color-primary) 8%, white);
        box-shadow: inset 0 0 0 1px rgba(138, 160, 184, 0.24);
      }

      .countHeader {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        font-size: 14px;
        font-weight: 700;
      }

      .countValue {
        min-width: 38px;
        padding: 3px 8px;
        border-radius: 999px;
        background: white;
        text-align: center;
        box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
      }

      #countRange {
        width: 100%;
        margin: 10px 0 6px;
        accent-color: var(--app-color-primary);
      }

      .rangeMarks {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        color: #617384;
        font-size: 12px;
        text-align: center;
      }

      #actionRow {
        margin-top: auto;
        display: grid;
        gap: 8px;
      }

      .selectionSummary {
        margin: 0;
        color: #516274;
        font-size: 13px;
      }

      .typeTile:focus-visible {
        outline: 3px solid color-mix(in oklab, var(--app-color-primary) 50%, white);
        outline-offset: 2px;
      }

      @media (min-width: 760px) {
        #typeGrid {
          grid-template-columns: repeat(6, minmax(0, 1fr));
        }

        .typeTile {
          min-height: 132px;
        }

        .diePreview {
          max-width: 76px;
        }
      }

      @media (max-width: 420px) {
        #selectCard::part(body) {
          gap: 10px;
          padding: 12px;
        }

        h2 {
          font-size: 20px;
        }

        .typeTile {
          min-height: 104px;
          padding: 7px 5px 6px;
          border-radius: 16px;
        }

        .diePreview {
          max-width: 56px;
        }

        .typeName {
          min-height: 18px;
          font-size: 9px;
        }

        .typeTeaser {
          display: none;
        }

        #countCard {
          padding: 10px 12px 12px;
        }
      }

      .typeTile:active {
        transform: translateY(0) scale(0.99);
      }

      .typeTile,
      .typeTile * {
        user-select: none;
      }
    `,
  ];

  firstUpdated() {
    const params = new URLSearchParams(window.location.search);
    this.selectedDiceType = getDiceType(params.get('type'));
    this.diceCount = clampDiceCount(Number(params.get('count')));
  }

  private getRollPath(): string {
    const rollUrl = new URL(resolveRouterPath('roll'), window.location.origin);
    rollUrl.searchParams.set('count', String(this.diceCount));
    rollUrl.searchParams.set('type', this.selectedDiceType.id);
    return `${rollUrl.pathname}${rollUrl.search}`;
  }

  private getCountWord(count: number): string {
    if (count === 1) {
      return 'кубик';
    }

    if (count < 5) {
      return 'кубика';
    }

    return 'кубиков';
  }

  private updateDiceCount(event: Event) {
    const input = event.target as HTMLInputElement;
    this.diceCount = clampDiceCount(Number(input.value));
  }

  private selectDiceType(diceType: DiceTypeConfig) {
    this.selectedDiceType = diceType;
  }

  private renderChoice(diceType: DiceTypeConfig) {
    const isSelected = this.selectedDiceType.id === diceType.id;

    return html`
      <button
        type="button"
        class="typeTile ${isSelected ? 'selected' : ''}"
        @click=${() => this.selectDiceType(diceType)}
        aria-pressed="${isSelected ? 'true' : 'false'}"
      >
        <div class="diePreview">
          <dice-webgl-icon dice-type="${diceType.id}"></dice-webgl-icon>
        </div>
        <div class="typeMeta">
          <span class="typeId">${diceType.id.toUpperCase()}</span>
          <span class="typeName">${diceType.solidName}</span>
          <span class="typeTeaser">${diceType.teaser}</span>
        </div>
      </button>
    `;
  }

  render() {
    return html`
      <app-header></app-header>

      <main>
        <div id="screen">
          <sl-card id="selectCard">
            <div>
              <h2>Выберите тип кубиков</h2>
              <p class="hintText">Нажмите на иконку кубика, затем укажите количество от 1 до 6.</p>
            </div>

            <div id="typeGrid">${DICE_TYPES.map((diceType) => this.renderChoice(diceType))}</div>

            <section id="countCard">
              <div class="countHeader">
                <span>Количество кубиков</span>
                <span class="countValue">${this.diceCount}</span>
              </div>

              <input
                id="countRange"
                type="range"
                min="1"
                max="6"
                step="1"
                .value=${String(this.diceCount)}
                @input=${this.updateDiceCount}
                aria-label="Количество кубиков"
              />

              <div class="rangeMarks" aria-hidden="true">
                ${Array.from({ length: 6 }, (_, index) => html`<span>${index + 1}</span>`)}
              </div>
            </section>

            <div id="actionRow">
              <p class="selectionSummary">
                Выбрано: ${this.diceCount} ${this.getCountWord(this.diceCount)}
                ${this.selectedDiceType.id.toUpperCase()} (${this.selectedDiceType.solidName.toLowerCase()}).
              </p>
              <sl-button href="${this.getRollPath()}" variant="primary" size="large">
                Перейти к броску
              </sl-button>
            </div>
          </sl-card>
        </div>
      </main>
    `;
  }
}
