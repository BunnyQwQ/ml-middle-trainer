import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import './styles/app.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

/**
 * Register the runtime cache only in a real build. After one online visit the
 * app, the DuckDB wasm and the Pyodide payload are all available offline, which
 * is what makes this usable on a phone in the metro.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const url = new URL('sw.js', document.baseURI);
    navigator.serviceWorker.register(url.pathname, { scope: './' }).catch(() => {
      // Offline support is a bonus; a failed registration must not break the app.
    });
  });
}
