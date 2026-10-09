import React, { useState } from 'react';
import { Check, Copy, Terminal, Play, Sparkles, ExternalLink } from 'lucide-react';
import { soundFx } from '../utils/audio';

interface MarkdownRendererProps {
  content: string;
  onOpenInEditor?: (code: string, language: string) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, onOpenInEditor }) => {
  // Split content by code blocks ```lang ... ```
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-3 leading-relaxed text-[#e5e7eb] font-normal text-[14.5px]">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // Extract language and code
          const firstLineEnd = part.indexOf('\n');
          let lang = 'code';
          let codeText = '';
          if (firstLineEnd !== -1) {
            lang = part.slice(3, firstLineEnd).trim() || 'plaintext';
            codeText = part.slice(firstLineEnd + 1, -3);
          } else {
            codeText = part.slice(3, -3);
          }

          return (
            <CodeBlock 
              key={index} 
              code={codeText} 
              language={lang} 
              onOpenInEditor={onOpenInEditor} 
            />
          );
        }

        return <TextMarkdownBlock key={index} text={part} />;
      })}
    </div>
  );
};

// 2027 Code block with copy button, run in studio, and language tag
const CodeBlock: React.FC<{ 
  code: string; 
  language: string;
  onOpenInEditor?: (code: string, language: string) => void;
}> = ({ code, language, onOpenInEditor }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    soundFx.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="my-3.5 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0c14]/90 backdrop-blur-xl shadow-2xl transition-all hover:border-amber-500/30">
      {/* 2027 Code Window Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-[#12121b]/95 px-3.5 py-2 text-xs font-mono">
        <div className="flex items-center gap-2.5">
          {/* Mac-style Window Dots */}
          <div className="flex items-center gap-1.5 opacity-70">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
          </div>

          <span className="h-3 w-[1px] bg-white/10 mx-0.5" />

          <div className="flex items-center gap-1.5">
            <Terminal size={12} className="text-amber-400" />
            <span className="uppercase tracking-wider font-bold text-[11px] text-amber-300">
              {language}
            </span>
            <span className="text-[10px] text-gray-500 font-mono">
              ({lines.length} {lines.length === 1 ? 'line' : 'lines'})
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-1.5">
          {/* Run in Supru Code Studio */}
          {onOpenInEditor && (
            <button
              onClick={() => {
                soundFx.playChime();
                onOpenInEditor(code, language);
              }}
              className="flex items-center gap-1 rounded-lg border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 transition-all hover:bg-amber-500/25 hover:border-amber-400 hover:shadow-[0_0_12px_rgba(245,158,11,0.25)]"
              title="Open and preview directly in Supru Code IDE"
            >
              <Play size={11} className="fill-amber-300" />
              <span>Run in Studio</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-lg bg-white/[0.05] border border-white/[0.08] px-2.5 py-1 text-[11px] font-medium text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            title="Copy code to clipboard"
          >
            {copied ? (
              <>
                <Check size={12} className="text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Text and Gutter */}
      <div className="overflow-x-auto p-3.5 font-mono text-[12.5px] leading-relaxed text-[#f3f4f6]">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02]">
                <td className="w-7 select-none pr-3 text-right text-[10.5px] text-[#4b5563] align-top font-mono">
                  {idx + 1}
                </td>
                <td className="whitespace-pre break-all pl-2 font-mono">
                  {highlightSyntax(line, language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Simple syntax highlighter helper for common tokens
function highlightSyntax(line: string, _lang: string): React.ReactNode {
  // If line contains comments
  if (line.trim().startsWith('//') || line.trim().startsWith('#') || line.trim().startsWith('/*')) {
    return <span className="text-[#6b7280] italic">{line}</span>;
  }

  // Regex replacement for strings, keywords, numbers
  const tokens = line.split(/('(?:\\'|[^'])*'|"(?:\\"|[^"])*"|`(?:\\`|[^`])*`|\b(?:const|let|var|function|return|import|export|from|async|await|class|interface|type|public|private|if|else|for|while|try|catch|new|def|def\b|lambda)\b|\b(?:true|false|null|undefined)\b|\b\d+\b)/g);

  return (
    <>
      {tokens.map((token, i) => {
        if (!token) return null;
        if (/^['"`]/.test(token)) {
          return <span key={i} className="text-emerald-300">{token}</span>;
        }
        if (/^(const|let|var|function|return|import|export|from|async|await|class|interface|type|public|private|if|else|for|while|try|catch|new|def|lambda)$/.test(token)) {
          return <span key={i} className="text-amber-400 font-medium">{token}</span>;
        }
        if (/^(true|false|null|undefined)$/.test(token)) {
          return <span key={i} className="text-purple-400 font-medium">{token}</span>;
        }
        if (/^\d+$/.test(token)) {
          return <span key={i} className="text-sky-300">{token}</span>;
        }
        return <span key={i}>{token}</span>;
      })}
    </>
  );
}

// Formatter for markdown prose
const TextMarkdownBlock: React.FC<{ text: string }> = ({ text }) => {
  const paragraphs = text.split(/\n\s*\n/);

  return (
    <>
      {paragraphs.map((para, pIdx) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Headings
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={pIdx} className="text-lg font-bold text-amber-300 pt-2 pb-1 border-b border-[#24242e]/60 flex items-center gap-2">
              <span className="text-amber-400">❖</span>
              {parseInlineMarkdown(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={pIdx} className="text-xl font-bold text-white pt-3 pb-1 border-b border-[#2b2b36]">
              {parseInlineMarkdown(trimmed.slice(3))}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={pIdx} className="text-2xl font-extrabold text-amber-400 pt-3 pb-1">
              {parseInlineMarkdown(trimmed.slice(2))}
            </h1>
          );
        }

        // Blockquote
        if (trimmed.startsWith('> ')) {
          return (
            <blockquote key={pIdx} className="border-l-4 border-amber-500/80 bg-amber-500/5 px-4 py-2 italic text-[#d1d5db] rounded-r-lg my-2">
              {parseInlineMarkdown(trimmed.slice(2))}
            </blockquote>
          );
        }

        // Unordered or ordered list
        const lines = trimmed.split('\n');
        const isBulletList = lines.every((l) => /^\s*[-*•]\s+/.test(l));
        const isNumberedList = lines.every((l) => /^\s*\d+\.\s+/.test(l));

        if (isBulletList) {
          return (
            <ul key={pIdx} className="space-y-1.5 pl-5 list-disc marker:text-amber-400">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="text-[#e2e8f0]">
                  {parseInlineMarkdown(l.replace(/^\s*[-*•]\s+/, ''))}
                </li>
              ))}
            </ul>
          );
        }

        if (isNumberedList) {
          return (
            <ol key={pIdx} className="space-y-1.5 pl-5 list-decimal marker:text-amber-400 font-medium">
              {lines.map((l, lIdx) => (
                <li key={lIdx} className="text-[#e2e8f0]">
                  {parseInlineMarkdown(l.replace(/^\s*\d+\.\s+/, ''))}
                </li>
              ))}
            </ol>
          );
        }

        // Regular paragraph with potential soft linebreaks
        return (
          <p key={pIdx} className="text-[#d8dbe2] leading-relaxed">
            {lines.map((line, lIdx) => (
              <React.Fragment key={lIdx}>
                {parseInlineMarkdown(line)}
                {lIdx < lines.length - 1 && <br />}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
};

// Inline helper for **bold**, *italic*, `inline code`
function parseInlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
      return (
        <strong key={idx} className="font-semibold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
      return (
        <em key={idx} className="italic text-amber-200/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      return (
        <code
          key={idx}
          className="rounded bg-[#1e1e27] px-1.5 py-0.5 font-mono text-[13px] text-amber-300 border border-[#2d2d3b]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
