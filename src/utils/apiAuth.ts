/**
 * Attaches the optional Supru API access token to same-origin `/api` requests.
 *
 * The server only enforces a token when SUPRU_ACCESS_TOKEN is set (public
 * deployments). Local/desktop runs have no token, so this is a no-op there.
 *
 * The token is read from localStorage at runtime ONLY. It is deliberately not
 * read from `import.meta.env`: Vite inlines those values into the shipped JS, so
 * a build-time token would be readable by anyone and would defeat the gate.
 */
const TOKEN =
  (typeof localStorage !== 'undefined' ? localStorage.getItem('supru_access_token') : '') || '';

if (TOKEN) {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.pathname : input.url;
    if (url.startsWith('/api') || url.includes('/api/')) {
      const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization') && !headers.has('x-supru-token')) {
        headers.set('x-supru-token', TOKEN);
      }
      init = { ...init, headers };
    }
    return originalFetch(input, init);
  };
}

export {};
