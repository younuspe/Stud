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
});

describe('escapeHtml', () => {
  it('escapes all HTML-significant characters', () => {
    expect(escapeHtml(`<img src=x onerror="alert('x')">&`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;x&#39;)&quot;&gt;&amp;',
    );
  });
});
