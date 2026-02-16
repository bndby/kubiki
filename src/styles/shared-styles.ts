import { css } from 'lit';

// these styles can be imported from any component
// for an example of how to use this, check /pages/about-about.ts
export const styles = css`
  sl-card {
    height: 100%;
  }

  sl-card::part(base) {
    height: 100%;
  }

  sl-card::part(body) {
    box-sizing: border-box;
    height: 100%;
  }

  main {
    box-sizing: border-box;
    width: 100%;
    height: 100dvh;
    padding: 0;
    padding-top: var(--app-header-height);
  }
`;