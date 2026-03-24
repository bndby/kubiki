import { LitElement, css, html } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('app-header')
export class AppHeader extends LitElement {
  /** Заголовок страницы, отображаемый по центру хедера */
  @property({ type: String }) pageTitle = '';

  static styles = css`
    header {
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      color: #1a2a3a;
      box-sizing: border-box;
      min-height: var(--app-header-height);
      padding: var(--app-safe-area-top) 16px 0;
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      position: fixed;
      left: 0;
      top: 0;
      width: 100%;
      z-index: 50;
      -webkit-app-region: drag;
    }

    h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #1a2a3a;
    }

    .end {
      position: absolute;
      right: 16px;
      bottom: 0;
      top: var(--app-safe-area-top);
      display: flex;
      align-items: center;
      -webkit-app-region: no-drag;
    }

    ::slotted(*) {
      -webkit-app-region: no-drag;
    }
  `;

  render() {
    return html`
      <header>
        <h1>${this.pageTitle}</h1>
        <div class="end">
          <slot></slot>
        </div>
      </header>
    `;
  }
}
