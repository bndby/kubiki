import { LitElement, css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { resolveRouterPath } from '../router';

import '@shoelace-style/shoelace/dist/components/card/card.js';

import { styles } from '../styles/shared-styles';

@customElement('app-home')
export class AppHome extends LitElement {
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

      h2 {
        margin: 0;
      }

      #buttons {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        gap: 14px;
        margin-top: 20px;
      }

      .choiceTile {
        box-sizing: border-box;
        border: 2px solid color-mix(in oklab, var(--app-color-primary) 62%, #8aa0b8);
        border-radius: 14px;
        background: linear-gradient(
          155deg,
          color-mix(in oklab, var(--app-color-primary) 18%, #ffffff) 0%,
          #ffffff 48%,
          color-mix(in oklab, var(--app-color-primary) 8%, #eef3fa) 100%
        );
        color: inherit;
        text-decoration: none;
        min-height: 138px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
        box-shadow:
          0 10px 18px rgba(0, 0, 0, 0.14),
          0 0 0 1px rgba(255, 255, 255, 0.7) inset;
        transition:
          transform 120ms ease,
          box-shadow 120ms ease,
          border-color 120ms ease,
          background 120ms ease;
      }

      .choiceTile:hover {
        transform: translateY(-2px);
        box-shadow:
          0 14px 24px rgba(0, 0, 0, 0.18),
          0 0 0 3px color-mix(in oklab, var(--app-color-primary) 22%, transparent);
        border-color: var(--app-color-primary);
      }

      .dicePreview {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 54px;
      }

      .miniDie {
        width: 34px;
        height: 34px;
        border-radius: 9px;
        border: 2px solid #a7b3c3;
        background: linear-gradient(145deg, #ffffff 0%, #f2f4f8 100%);
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(3, 1fr);
        place-items: center;
        box-shadow:
          0 3px 10px rgba(0, 0, 0, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.9);
      }

      .miniPip {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: #1f2937;
      }

      .count-2 .miniDie:nth-child(2) {
        transform: translateY(-5px);
      }

      .count-3 .miniDie:nth-child(2) {
        transform: translateY(-6px);
      }

      .count-3 .miniDie:nth-child(3) {
        transform: translateY(3px);
      }

      .choiceLabel {
        font-weight: 700;
      }

      .hintText {
        margin-top: 10px;
      }

      .srOnly {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      .miniDie .miniPip:nth-child(1),
      .miniDie .miniPip:nth-child(2),
      .miniDie .miniPip:nth-child(3),
      .miniDie .miniPip:nth-child(4),
      .miniDie .miniPip:nth-child(6),
      .miniDie .miniPip:nth-child(7),
      .miniDie .miniPip:nth-child(8),
      .miniDie .miniPip:nth-child(9) {
        opacity: 0;
      }

      .miniDie .miniPip:nth-child(5) {
        opacity: 1;
      }

      .choiceTile:focus-visible {
        outline: 3px solid color-mix(in oklab, var(--app-color-primary) 50%, white);
        outline-offset: 2px;
      }

      @media (max-width: 620px) {
        #buttons {
          grid-template-columns: 1fr;
        }

        .choiceTile {
          min-height: 112px;
        }
      }

      .choiceTile:active {
        transform: translateY(0) scale(0.99);
      }

      a {
        -webkit-tap-highlight-color: transparent;
      }

      .choiceTile,
      .choiceTile * {
        user-select: none;
      }

      .choiceContent {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
      }

      .choiceIconLabel {
        display: inline-flex;
        align-items: center;
      }

      .choiceIconLabel .countText {
        margin-left: 6px;
      }

      .choiceLabelWrap {
        display: flex;
        align-items: baseline;
        gap: 4px;
      }

      .choiceLabelWrap .num {
        font-size: 20px;
        line-height: 1;
      }

      .choiceLabelWrap .word {
        font-size: 14px;
      }

      .choiceTile .choiceLabelWrap {
        text-shadow: 0 1px 0 rgba(255, 255, 255, 0.7);
      }

      .choiceTile {
        width: 100%;
      }
    `,
  ];

  private getRollPath(cubesCount: number): string {
    const rollUrl = new URL(resolveRouterPath('roll'), window.location.origin);
    rollUrl.searchParams.set('count', String(cubesCount));
    return `${rollUrl.pathname}${rollUrl.search}`;
  }

  private renderDiceIcons(count: number) {
    return html`
      <div class="dicePreview count-${count}" aria-hidden="true">
        ${Array.from({ length: count }).map(
          () => html`
            <div class="miniDie">
              ${Array.from({ length: 9 }).map(() => html`<span class="miniPip"></span>`)}
            </div>
          `
        )}
      </div>
    `;
  }

  private renderChoice(count: number) {
    const cubeWord = count === 1 ? 'кубик' : count < 5 ? 'кубика' : 'кубиков';

    return html`
      <a class="choiceTile" href="${this.getRollPath(count)}">
        ${this.renderDiceIcons(count)}
        <div class="choiceContent">
          <div class="choiceLabelWrap">
            <span class="num">${count}</span>
            <span class="word">${cubeWord}</span>
          </div>
        </div>
      </a>
    `;
  }

  render() {
    return html`
      <app-header></app-header>

      <main>
        <div id="screen">
          <sl-card id="selectCard">
            <h2>Сколько кубиков бросаем?</h2>
            <p class="hintText">Выберите количество: 1, 2 или 3.</p>

            <div id="buttons">
              ${this.renderChoice(1)} ${this.renderChoice(2)} ${this.renderChoice(3)}
            </div>
          </sl-card>
        </div>
      </main>
    `;
  }
}
