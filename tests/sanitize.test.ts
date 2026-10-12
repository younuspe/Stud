// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { sanitizeHtml, escapeHtml } from '../src/utils/sanitize';

describe('sanitizeHtml', () => {
  it('keeps benign presentational markup intact', () => {
    const html = '<div class="rounded-3xl p-6"><h3>Title</h3><button>Engage</button></div>';
    const out = sanitizeHtml(html);
    expect(out).toContain('<h3>Title</h3>');
    expect(out).toContain('class="rounded-3xl p-6"');
    // Interactive controls are stripped to keep the preview inert.
    expect(out).not.toContain('<button');
  });

  it('removes script elements and their payloads', () => {
    const out = sanitizeHtml('<div>ok</div><script>alert(1)</script>');
    expect(out).toBe('<div>ok</div>');
  });

  it('strips inline event handlers', () => {
    const out = sanitizeHtml('<img src="https://x.test/a.png" onerror="alert(1)">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="https://x.test/a.png"');
  });

  it('neutralizes javascript: URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">x</a>');
    expect(out).not.toContain('javascript:');
  });

  it('drops iframes, objects and embeds', () => {
    const out = sanitizeHtml('<iframe src="https://evil.test"></iframe><object></object><embed>');
    expect(out).toBe('');
  });

  it('keeps safe http(s) links', () => {
    const out = sanitizeHtml('<a href="https://supru.dev/docs">docs</a>');
    expect(out).toContain('href="https://supru.dev/docs"');
  });

  it('defeats common bypass attempts', () => {
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toContain('onerror');
    expect(sanitizeHtml('<a href="java\nscript:alert(1)">x</a>')).not.toMatch(/javascript:/i);
    expect(sanitizeHtml('<a href="data:text/html,<script>alert(1)</script>">x</a>')).not.toContain('data:text/html');
    expect(sanitizeHtml('<svg onload="alert(1)"></svg>')).not.toContain('onload');
    expect(sanitizeHtml('<math><mtext><script>alert(1)</script></mtext></math>')).not.toContain('<script');
  });

  it('drops inline style attributes', () => {
    const out = sanitizeHtml('<div style="background:url(javascript:alert(1))">x</div>');
    expect(out).not.toContain('style=');
    expect(out).not.toMatch(/javascript:/i);
  });
});

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;',
    );
  });
});
