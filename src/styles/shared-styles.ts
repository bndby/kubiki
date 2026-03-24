import { css } from 'lit';

/**
 * Общие стили для всех страниц.
 * main — контентная область между хедером (сверху) и таббаром (снизу).
 */
export const styles = css`
  main {
    box-sizing: border-box;
    width: 100%;
    height: 100dvh;
    /* Отступ сверху = высота хедера, снизу = высота таббара */
    padding-top: var(--app-header-height);
    padding-bottom: var(--app-tab-bar-height);
    padding-right: var(--app-safe-area-right);
    padding-left: var(--app-safe-area-left);
  }
`;
