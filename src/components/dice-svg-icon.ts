import { LitElement, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { getDiceType, DEFAULT_DICE_TYPE, type DiceTypeId } from '../dice-config';

@customElement('dice-svg-icon')
export class DiceSvgIcon extends LitElement {
  @property({ type: String, attribute: 'dice-type' }) diceTypeId: DiceTypeId = DEFAULT_DICE_TYPE;
  @property({ type: String, attribute: 'dice-color' }) diceColor = '#d94040';
  @property({ type: Number, attribute: 'face-value' }) faceValue: number | null = null;

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `;

  render() {
    const diceType = getDiceType(this.diceTypeId);
    const color = this.diceColor;

    const lightColor = this.adjustColor(color, 0.38);
    const darkColor = this.adjustColor(color, -0.28);
    const strokeColor = this.adjustColor(color, -0.45);

    const showValue = this.faceValue !== null && this.faceValue !== undefined;
    const fv = showValue ? this.faceValue! : 0;
    const fontSize = fv >= 10 ? 22 : 28;
    const textY = diceType.labelY;

    if (this.diceTypeId === 'd6') {
      return this.renderD6(color, showValue, fv, fontSize);
    }

    return html`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0.25" y1="0" x2="0.75" y2="1">
            <stop offset="0%" stop-color="${lightColor}" />
            <stop offset="100%" stop-color="${darkColor}" />
          </linearGradient>
        </defs>
        <polygon
          points="${diceType.outlinePoints}"
          fill="url(#g)"
          stroke="${strokeColor}"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        ${diceType.innerLines.map(
          ({ x1, y1, x2, y2 }) => html`
            <line
              x1="${x1}"
              y1="${y1}"
              x2="${x2}"
              y2="${y2}"
              stroke="${strokeColor}"
              stroke-width="1.5"
              stroke-linecap="round"
              opacity="0.5"
            />
          `
        )}
        ${showValue
          ? html`
              <text
                x="50"
                y="${textY}"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="${fontSize}"
                font-weight="800"
                font-family="system-ui, -apple-system, sans-serif"
                fill="white"
                paint-order="stroke"
                stroke="${strokeColor}"
                stroke-width="5"
                stroke-linejoin="round"
              >${fv}</text>
            `
          : null}
      </svg>
    `;
  }

  private renderD6(color: string, showValue: boolean, fv: number, fontSize: number) {
    const topColor = this.adjustColor(color, 0.38);
    const leftColor = this.adjustColor(color, 0.10);
    const rightColor = this.adjustColor(color, -0.26);
    const strokeColor = this.adjustColor(color, -0.45);

    return html`
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polygon points="50,12 84,31 50,50 16,31" fill="${topColor}" />
        <polygon points="16,31 50,50 50,88 16,69" fill="${leftColor}" />
        <polygon points="84,31 84,69 50,88 50,50" fill="${rightColor}" />
        <polygon
          points="50,12 84,31 84,69 50,88 16,69 16,31"
          fill="none"
          stroke="${strokeColor}"
          stroke-width="2.5"
          stroke-linejoin="round"
        />
        <line x1="50" y1="12" x2="50" y2="50" stroke="${strokeColor}" stroke-width="1.5" opacity="0.65" />
        <line x1="84" y1="31" x2="50" y2="50" stroke="${strokeColor}" stroke-width="1.5" opacity="0.65" />
        <line x1="16" y1="31" x2="50" y2="50" stroke="${strokeColor}" stroke-width="1.5" opacity="0.65" />
        ${showValue
          ? html`
              <text
                x="50"
                y="56"
                text-anchor="middle"
                dominant-baseline="middle"
                font-size="${fontSize}"
                font-weight="800"
                font-family="system-ui, -apple-system, sans-serif"
                fill="white"
                paint-order="stroke"
                stroke="${strokeColor}"
                stroke-width="5"
                stroke-linejoin="round"
              >${fv}</text>
            `
          : null}
      </svg>
    `;
  }

  private adjustColor(hex: string, amount: number): string {
    if (!hex.startsWith('#') || hex.length < 7) return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
    if (amount >= 0) {
      return `rgb(${clamp(r + (255 - r) * amount)},${clamp(g + (255 - g) * amount)},${clamp(b + (255 - b) * amount)})`;
    }
    const f = 1 + amount;
    return `rgb(${clamp(r * f)},${clamp(g * f)},${clamp(b * f)})`;
  }
}
