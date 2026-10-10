/**
 * Extract a complete HTML document from model output.
 * Models may wrap source in Markdown fences or add prose before/after it.
 * Return an empty string rather than treating a partial response as valid code.
 */
export function extractCompleteHtml(response: string): string {
  const text = response.replace(/^\uFEFF/, '').trim();
  const fencedBlocks = [...text.matchAll(/```(?:html|htm)?\s*([\s\S]*?)```/gi)]
    .map((match) => (match[1] || '').trim());
  const candidates = [...fencedBlocks, text];

  for (const candidate of candidates) {
    const start = candidate.search(/<!doctype\s+html|<html[\s>]/i);
    if (start < 0) continue;
    const html = candidate.slice(start).trim();
    const closingTag = html.toLowerCase().lastIndexOf('</html>');
    if (closingTag >= 0) return html.slice(0, closingTag + '</html>'.length).trim();
  }

  return '';
}
