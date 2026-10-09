import React, { useState } from 'react';
import { X, Copy, Check, Code2, Terminal, FileCode, CheckCircle2 } from 'lucide-react';
import { ExternalAIModelConfig, StudioModelSettings } from '../../types/workbench';
import { soundFx } from '../../utils/audio';

interface GetCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeModel: ExternalAIModelConfig;
  settings: StudioModelSettings;
  currentPrompt: string;
}

export const GetCodeModal: React.FC<GetCodeModalProps> = ({
  isOpen,
  onClose,
  activeModel,
  settings,
  currentPrompt,
}) => {
  const [activeTab, setActiveTab] = useState<'typescript' | 'python' | 'curl' | 'rest'>('typescript');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const promptText = currentPrompt || 'Build a modern responsive web applet';

  const snippets: Record<string, string> = {
    typescript: `// Google AI Studio SDK: @google/genai
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '${activeModel.apiKey || 'YOUR_API_KEY'}',
});

async function main() {
  const response = await ai.models.generateContent({
    model: '${activeModel.modelId}',
    contents: '${promptText.replace(/'/g, "\\'")}',
    config: {
      systemInstruction: '${settings.systemInstruction.replace(/'/g, "\\'")}',
      temperature: ${settings.temperature},
      maxOutputTokens: ${settings.maxOutputTokens},
    },
  });

  console.log(response.text);
}

main().catch(console.error);
`,
    python: `# Google GenAI Python SDK
from google import genai
from google.genai import types
import os

client = genai.Client(
    api_key=os.environ.get("GEMINI_API_KEY", "${activeModel.apiKey || 'YOUR_API_KEY'}")
)

response = client.models.generate_content(
    model="${activeModel.modelId}",
    contents="${promptText.replace(/"/g, '\\"')}",
    config=types.GenerateContentConfig(
        system_instruction="${settings.systemInstruction.replace(/"/g, '\\"')}",
        temperature=${settings.temperature},
        max_output_tokens=${settings.maxOutputTokens},
    ),
)

print(response.text)
`,
    curl: `curl "https://generativelanguage.googleapis.com/v1beta/models/${activeModel.modelId}:generateContent?key=\${GEMINI_API_KEY}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "system_instruction": {
      "parts": [{ "text": "${settings.systemInstruction.replace(/"/g, '\\"')}" }]
    },
    "contents": [{
      "parts": [{ "text": "${promptText.replace(/"/g, '\\"')}" }]
    }],
    "generationConfig": {
      "temperature": ${settings.temperature},
      "maxOutputTokens": ${settings.maxOutputTokens}
    }
  }'
`,
    rest: `POST /v1beta/models/${activeModel.modelId}:generateContent HTTP/1.1
Host: generativelanguage.googleapis.com
Content-Type: application/json
x-goog-api-key: \${GEMINI_API_KEY}

{
  "system_instruction": {
    "parts": [{ "text": "${settings.systemInstruction.replace(/"/g, '\\"')}" }]
  },
  "contents": [{
    "parts": [{ "text": "${promptText.replace(/"/g, '\\"')}" }]
  }],
  "generationConfig": {
    "temperature": ${settings.temperature},
    "maxOutputTokens": ${settings.maxOutputTokens}
  }
}
`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    soundFx.playClick();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl border border-amber-500/30 bg-[#0e0e15] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1f1f2e] bg-[#12121b] px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Code2 size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">Get Code (Google AI Studio)</h2>
                <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9.5px] font-bold text-amber-300 border border-amber-500/30">
                  {activeModel.name}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Executable API invocation code for your current prompt and model configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language Tabs */}
        <div className="flex items-center justify-between border-b border-[#1c1c28] bg-[#101018] px-4 py-1.5 text-xs">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('typescript')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                activeTab === 'typescript'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              TypeScript
            </button>
            <button
              onClick={() => setActiveTab('python')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                activeTab === 'python'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              Python
            </button>
            <button
              onClick={() => setActiveTab('curl')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                activeTab === 'curl'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              cURL
            </button>
            <button
              onClick={() => setActiveTab('rest')}
              className={`rounded-lg px-3 py-1 font-semibold transition-all ${
                activeTab === 'rest'
                  ? 'bg-amber-500 text-neutral-950 font-bold'
                  : 'text-gray-400 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              REST API
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border border-[#2c2c3d] bg-[#161622] px-3 py-1 text-[11px] font-semibold text-gray-200 hover:bg-[#202030] hover:text-white transition-colors"
          >
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code View */}
        <div className="flex-1 overflow-auto p-4 bg-[#0a0a10]">
          <pre className="font-mono text-xs text-gray-200 leading-relaxed whitespace-pre selection:bg-amber-500/30 selection:text-amber-200">
            {snippets[activeTab]}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#1f1f2e] bg-[#12121b] px-5 py-2.5 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <span>Model: <strong className="text-amber-300 font-mono">{activeModel.modelId}</strong></span>
            <span>•</span>
            <span>Temp: <strong className="text-gray-300 font-mono">{settings.temperature}</strong></span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
