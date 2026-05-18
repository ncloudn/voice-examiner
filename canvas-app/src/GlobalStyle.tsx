import { createGlobalStyle } from 'styled-components';
import { text, background } from '@salutejs/plasma-tokens';

export const GlobalStyle = createGlobalStyle`
  :root {
    color: ${text};
    background: ${background};
  }

  body {
    margin: 0;
    min-height: 100vh;
    font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  }

  * { box-sizing: border-box; }
`;
