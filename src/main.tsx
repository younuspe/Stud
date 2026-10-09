import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// In production, Tauri serves the frontend from its app bundle while the
// bundled API server runs as a localhost process. Keep existing relative API
// calls working in both the browser-based dev server and the packaged app.
const nativeWindow = window as Window & { __TAURI_INTERNALS__?: unknown };
if (nativeWindow.__TAURI_INTERNALS__) {
  const nativeFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      return nativeFetch(`http://127.0.0.1:3000${input}`, init);
    }
    if (input instanceof URL && input.pathname.startsWith('/api/')) {
      return nativeFetch(new URL(input.pathname + input.search, 'http://127.0.0.1:3000'), init);
    }
    return nativeFetch(input, init);
  }) as typeof window.fetch;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
