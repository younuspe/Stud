/**
 * Minimal, dependency-free HTML sanitizer for the single place the app renders
 * generated markup via `dangerouslySetInnerHTML` (the Generative Studio's
 * "atomic component" preview).
 *
 * It strips the dangerous surface — script/style/iframe/object/embed/link/meta
 * elements, all inline event handlers, and `javascript:`/`data:` URLs — while
 * leaving the presentational markup intact. This is defense-in-depth: callers
 * should still escape any untrusted values they interpolate.
 */

const BLOCKED_TAGS = new Set([
  'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form',
  'input', 'button', 'textarea', 'select', 'svg', 'math', 'template',
]);

const SAFE_URL = /^(?:https?:|mailto:|tel:|#|\/|\.\/|\.\.\/)/i;

export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // Server/SSR fallback: strip tags entirely rather than risk unsafe markup.
    return dirty.replace(/<[^>]*>/g, '');
  }

  const doc = new DOMParser().parseFromString(`<body>${dirty}</body>`, 'text/html');
  const body = doc.body;

  const walk = (node: Element) => {
    // Snapshot children first — we mutate the tree while iterating.
    const children = Array.from(node.children);
    for (const child of children) {
      const tag = child.tagName.toLowerCase();
      if (BLOCKED_TAGS.has(tag)) {
        child.remove();
        continue;
      }
      // Drop every on* handler and neutralize unsafe URL attributes.
      for (const attr of Array.from(child.attributes)) {
        const name = attr.name.toLowerCase();
        const value = attr.value.trim();
        if (name.startsWith('on')) {
          child.removeAttribute(attr.name);
        } else if ((name === 'href' || name === 'src' || name === 'xlink:href') && !SAFE_URL.test(value)) {
          child.removeAttribute(attr.name);
        } else if (name === 'style' && /expression|javascript:/i.test(value)) {
          child.removeAttribute(attr.name);
        }
      }
      walk(child);
    }
  };

  walk(body);
  return body.innerHTML;
}

/** Escape a value for safe interpolation into an HTML string. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
