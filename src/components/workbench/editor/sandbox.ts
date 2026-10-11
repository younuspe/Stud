import type { EditorFile } from '../../../types/workbench';

/** Build the sandboxed preview document, injecting a console bridge so the
 *  parent workbench can surface the iframe's console output. */
export function buildSandboxHtml(activeFile: EditorFile): string {
  if (activeFile.language !== 'html') {
    return `<!DOCTYPE html>
<html>
<head>
<script src="https://cdn.tailwindcss.com"></script>
<style>body { background: #0b0b12; color: #f1f2f6; font-family: monospace; padding: 24px; }</style>
</head>
<body>
<div class="max-w-xl mx-auto border border-gray-800 rounded-xl bg-[#12121a] p-5 shadow-xl">
  <div class="flex items-center gap-2 mb-3 text-amber-400 font-bold text-xs uppercase">
    <span>📄</span>
    <span>${activeFile.name} (${activeFile.language.toUpperCase()})</span>
  </div>
  <p class="text-xs text-gray-400 mb-4">
    Non-HTML file active. You can run it via Supru CLI or switch to an HTML file to see real-time UI previews.
  </p>
  <pre class="bg-black/60 p-4 rounded-lg text-xs text-amber-200 overflow-x-auto whitespace-pre leading-relaxed">${activeFile.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
</div>
</body>
</html>`;
  }

  const interceptor = `
    <script>
      (function() {
        const sendLog = (level, args) => {
          try {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            window.parent.postMessage({ source: 'supru-sandbox', type: 'log', level, message: msg }, '*');
          } catch(e) {}
        };
        const origLog = console.log;
        const origInfo = console.info;
        const origWarn = console.warn;
        const origError = console.error;
        console.log = (...args) => { origLog(...args); sendLog('log', args); };
        console.info = (...args) => { origInfo(...args); sendLog('info', args); };
        console.warn = (...args) => { origWarn(...args); sendLog('warn', args); };
        console.error = (...args) => { origError(...args); sendLog('error', args); };
        window.onerror = function(msg, url, line) {
          window.parent.postMessage({ source: 'supru-sandbox', type: 'error', message: msg + ' (Line ' + line + ')' }, '*');
          return false;
        };
      })();
    </script>
  `;

  return activeFile.content.includes('<head>')
    ? activeFile.content.replace('<head>', `<head>${interceptor}`)
    : `${interceptor}${activeFile.content}`;
}
