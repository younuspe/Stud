/**
 * HTML sanitizer for the single place the app renders generated markup via
 * `dangerouslySetInnerHTML` (the Generative Studio's "atomic component" preview).
 *
 * Backed by DOMPurify rather than a hand-rolled allow/deny list: DOMPurify is a
 * battle-tested sanitizer that keeps up with new bypasses. The config below
 * strips the dangerous surface (script/style/iframe/object/embed, inline event
 * handlers, and `javascript:`/`data:` URLs) while leaving presentational markup
 * intact. This is defense-in-depth — callers should still escape untrusted
 * values they interpolate.
 */
import DOMPurify from 'dompurify';

const PURIFY_CONFIG = {
  FORBID_TAGS: [
    'script', 'style', 'iframe', 'object', 'embed', 'link', 'meta', 'base',
    'form', 'input', 'button', 'textarea', 'select', 'svg', 'math', 'template',
  ],
  FORBID_ATTR: ['style'],
  ALLOW_DATA_ATTR: false,
};

export function sanitizeHtml(dirty: string): string {
  if (typeof window === 'undefined' || typeof window.document === 'undefined') {
    // Server/SSR fallback: strip tags entirely rather than risk unsafe markup.
    return dirty.replace(/<[^>]*>/g, '');
  }
  return DOMPurify.sanitize(dirty, PURIFY_CONFIG);
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
