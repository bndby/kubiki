import { LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

import './components/header';
import './components/app-tabs';
import './styles/global.css';
import { router } from './router';

@customElement('app-index')
export class AppIndex extends LitElement {
  firstUpdated() {
    router.addEventListener('route-changed', () => {
      if ('startViewTransition' in document) {
        (document as any).startViewTransition(() => this.requestUpdate());
      } else {
        this.requestUpdate();
      }
    });
  }

  render() {
    // Конфигурация маршрутов — в src/router.ts
    return router.render();
  }
}
