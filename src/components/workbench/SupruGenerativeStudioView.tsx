import React, { useState } from 'react';
import {
  Settings, ArrowUpRight, Share2, Upload, ChevronDown, Folder, Search, Plus,
  ChevronUp, ChevronRight, Code2, Eye, RefreshCw, Maximize, Monitor, Smartphone,
  Pencil, Hand, MousePointer2, Eraser, ArrowRight, Square, Circle, Image as ImageIcon,
  Palette, FileText, Type, Mic, Sparkles, SlidersHorizontal, Shapes, MoreHorizontal,
  Undo2, Redo2, Play, Send, Cat, X
} from 'lucide-react';

interface SupruGenerativeStudioViewProps {
  onSendToChat?: (content: string, imageUrl?: string) => void;
  onOpenInEditor?: (fileName: string, content: string) => void;
  onRunInTerminal?: (cmd: string) => void;
  onOpenImageStudio?: (imageUrl?: string) => void;
  onOpenVeoStudio?: (imageUrl?: string) => void;
}

type CanvasTool = 'hand' | 'select' | 'pencil' | 'eraser' | 'arrow' | 'rectangle' | 'circle' | 'image' | 'text';

const toolItems: { id: CanvasTool; label: string; icon: React.ElementType }[] = [
  { id: 'hand', label: 'Pan canvas', icon: Hand },
  { id: 'select', label: 'Select', icon: MousePointer2 },
  { id: 'pencil', label: 'Draw', icon: Pencil },
  { id: 'eraser', label: 'Eraser', icon: Eraser },
  { id: 'arrow', label: 'Connector', icon: ArrowRight },
  { id: 'rectangle', label: 'Rectangle', icon: Square },
  { id: 'circle', label: 'Ellipse', icon: Circle },
  { id: 'image', label: 'Add image', icon: ImageIcon },
  { id: 'text', label: 'Text', icon: Type },
];

export const SupruGenerativeStudioView: React.FC<SupruGenerativeStudioViewProps> = ({
  onSendToChat,
  onOpenInEditor,
}) => {
  const [projectName, setProjectName] = useState('Project name');
  const [activeTopTab, setActiveTopTab] = useState('App.tsx');
  const [activeRightTab, setActiveRightTab] = useState<'code' | 'preview'>('code');
  const [activeTool, setActiveTool] = useState<CanvasTool>('hand');
  const [activeNode, setActiveNode] = useState('Main Idea');
  const [prompt, setPrompt] = useState('');
  const [showOmniCanvas, setShowOmniCanvas] = useState(false);
  const [showFileExplorer, setShowFileExplorer] = useState(true);
  const [showConcepts, setShowConcepts] = useState(true);
  const [zoom, setZoom] = useState(80);
  const [notice, setNotice] = useState('');

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const sendPrompt = () => {
    const text = prompt.trim();
    if (!text) return;
    onSendToChat?.(text);
    setPrompt('');
    notify('Prompt sent');
  };

  const openFile = (name: string) => {
    setActiveTopTab(name);
    onOpenInEditor?.(name, '');
  };

  const nodes = [
    { id: 'Idea', x: 50, y: 20, w: 86 },
    { id: 'Idea', x: 25, y: 32, w: 86 },
    { id: 'Idea', x: 70, y: 32, w: 86 },
    { id: 'Main Idea', x: 50, y: 48, w: 126 },
    { id: 'Idea', x: 25, y: 63, w: 86 },
    { id: 'Idea', x: 70, y: 63, w: 86 },
    { id: 'Idea', x: 50, y: 76, w: 86 },
  ];

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#292728] text-[#e8e5e5] font-sans">
      <header className="flex h-[70px] shrink-0 items-center border-b border-white/10 bg-[#302d2e]">
        <div className="flex h-full min-w-0 flex-1 items-center justify-center border-r border-white/10 px-4">
          <input
            aria-label="Project name"
            value={projectName}
            onChange={(event) => setProjectName(event.target.value)}
            className="w-full max-w-md bg-transparent text-center text-[22px] font-medium text-[#e7e3e4] outline-none placeholder:text-gray-500"
          />
        </div>
        <div className="flex h-full shrink-0 items-center gap-1 px-3">
          <button aria-label="Settings" onClick={() => notify('Settings')} className="rounded-lg p-3 hover:bg-white/10"><Settings size={25} /></button>
          <button onClick={() => notify('Remix project')} className="flex items-center gap-2 rounded-lg px-3 py-2 text-[18px] hover:bg-white/10"><ArrowUpRight size={20} /> Remix</button>
          <button onClick={() => notify('Share options')} className="rounded-full border border-white/5 bg-[#3a3738] px-5 py-2 text-[17px] hover:bg-white/10">Share</button>
          <button onClick={() => notify('Publish options')} className="rounded-full border border-white/5 bg-[#3a3738] px-5 py-2 text-[17px] hover:bg-white/10">Publish</button>
          <button onClick={() => notify('Export options')} className="flex items-center gap-2 bg-[#211f20] px-4 py-2 text-[17px] hover:bg-black/40">Export <ChevronDown size={16} /></button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-[1.62] flex-col border-r border-white/10 bg-[#111112]">
          <div className="flex h-[72px] shrink-0 items-center justify-between border-b border-white/10 px-4">
            <button onClick={() => setActiveTool('pencil')} className="flex items-center gap-3 bg-[#343132] px-4 py-2 text-[20px] font-medium hover:bg-[#454142]">
              <Pencil size={24} /> Edit tool
            </button>
            <div className="flex h-full items-end gap-1">
              <button onClick={() => setActiveTopTab('metadata.json')} className={`flex h-[54px] items-center gap-2 rounded-t-lg px-5 text-[16px] ${activeTopTab === 'metadata.json' ? 'bg-[#1c1b1d] text-gray-100' : 'text-gray-400 hover:bg-white/5'}`}>
                <span className="text-amber-300">{'{ }'}</span> metadata.json <X size={16} />
              </button>
              <button onClick={() => setActiveTopTab('App.tsx')} className={`flex h-[54px] items-center gap-2 rounded-t-lg px-5 text-[16px] ${activeTopTab === 'App.tsx' ? 'bg-[#3b3b4d] text-gray-100' : 'text-gray-400 hover:bg-white/5'}`}>
                <Code2 size={17} className="text-sky-300" /> App.tsx <X size={16} />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden bg-[#111112]">
            <div className="absolute right-4 top-3 z-10 flex items-center gap-2">
              <button onClick={() => setShowConcepts((v) => !v)} className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${showConcepts ? 'bg-[#33313b] text-gray-200' : 'bg-[#222124] text-gray-500'}`}>▤ Concepts</button>
              <button aria-label="Canvas settings" onClick={() => notify('Canvas settings')} className="rounded-full bg-[#28262a] p-1.5 hover:bg-[#3b3940]"><Settings size={14} /></button>
              <button aria-label="Canvas link" onClick={() => notify('Canvas link copied')} className="rounded-full bg-[#28262a] p-1.5 hover:bg-[#3b3940]"><Share2 size={14} /></button>
            </div>

            {showConcepts && <div className="pointer-events-none absolute inset-0 opacity-70">
              <svg className="h-full w-full" viewBox="0 0 1000 760" preserveAspectRatio="none" aria-hidden="true">
                <g stroke="#3e3b5f" strokeWidth="2" fill="none">
                  <path d="M500 390 L500 180 M500 390 L310 285 M500 390 L690 285 M500 390 L310 500 M500 390 L690 500 M500 390 L500 590" />
                  <path d="M500 180 L465 130 M500 180 L535 130 M310 285 L280 240 M310 285 L340 240 M690 285 L660 240 M690 285 L720 240 M310 500 L280 550 M310 500 L340 550 M690 500 L660 550 M690 500 L720 550 M500 590 L465 640 M500 590 L535 640" strokeDasharray="5 7" opacity=".6" />
                </g>
              </svg>
            </div>}

            <div className="absolute inset-0">
              {nodes.map((node, index) => {
                const isMain = node.id === 'Main Idea';
                const labels = ['Idea', 'Idea', 'Idea', 'Main Idea', 'Idea', 'Idea', 'Idea'];
                return (
                  <button
                    key={index}
                    onClick={() => setActiveNode(labels[index])}
                    style={{ left: `${node.x}%`, top: `${node.y}%`, width: node.w }}
                    className={`absolute z-[1] -translate-x-1/2 -translate-y-1/2 rounded-xl border px-3 py-3 text-center font-serif italic shadow-sm transition-colors ${isMain ? 'h-[60px] border-[#8c83ff] bg-[#8980ff] text-[#17152c] text-[19px] font-semibold' : 'h-[46px] border-[#292832] bg-[#222127] text-[#c7c2e2] text-[14px] hover:border-[#5c568c]'} ${activeNode === node.id && !isMain ? 'ring-1 ring-[#8c83ff]' : ''}`}
                  >{node.id}</button>
                );
              })}
              <div className="absolute left-1/2 top-[48%] z-0 w-[180px] -translate-x-1/2 translate-y-14 text-center text-[12px] leading-5 text-[#77738c]">
                Start typing... Use # for headings, • for lists, [] to link
              </div>
            </div>

            <div className="absolute bottom-3 left-4 z-20 flex max-w-[calc(100%-2rem)] items-center gap-1 overflow-x-auto rounded-xl border border-[#4b4964] bg-[#252432]/95 px-2 py-2 shadow-xl">
              <button onClick={() => setShowOmniCanvas((v) => !v)} className={`mr-1 flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold ${showOmniCanvas ? 'bg-[#8b80ff] text-[#151321]' : 'bg-[#373448] text-[#d9d5ff] hover:bg-[#45415d]'}`}><Sparkles size={15} /> Omni Canvas</button>
              <span className="mx-1 h-6 w-px bg-white/10" />
              <button aria-label="More canvas tools" onClick={() => notify('Canvas tools')} className="rounded-md p-2 text-gray-400 hover:bg-white/10"><MoreHorizontal size={17} /></button>
              <button aria-label="Undo" onClick={() => notify('Undo')} className="rounded-md p-2 text-gray-400 hover:bg-white/10"><Undo2 size={17} /></button>
              <button aria-label="Redo" onClick={() => notify('Redo')} className="rounded-md p-2 text-gray-400 hover:bg-white/10"><Redo2 size={17} /></button>
              <button onClick={() => setZoom((z) => Math.max(25, z - 10))} className="rounded-md px-2 py-2 text-[12px] text-gray-300 hover:bg-white/10">{zoom}%</button>
              {toolItems.map(({ id, label, icon: Icon }) => <button key={id} aria-label={label} title={label} onClick={() => setActiveTool(id)} className={`rounded-md p-2 transition-colors ${activeTool === id ? 'bg-[#6658ef] text-white' : 'text-gray-300 hover:bg-white/10'}`}><Icon size={16} /></button>)}
              <button onClick={() => setZoom((z) => Math.min(150, z + 10))} className="rounded-md px-2 py-2 text-[12px] text-gray-300 hover:bg-white/10">+</button>
            </div>
          </div>
        </main>

        <aside className="flex min-w-0 flex-[1] flex-col">
          <div className="flex h-[72px] shrink-0 items-center gap-2 border-b border-white/10 bg-[#302d2e] px-3">
            <button aria-label="Toggle file explorer" onClick={() => setShowFileExplorer((v) => !v)} className="rounded-lg p-2 hover:bg-white/10"><Folder size={24} /></button>
            <button onClick={() => setActiveRightTab('code')} className={`flex items-center gap-2 rounded-md px-4 py-2 text-[16px] ${activeRightTab === 'code' ? 'bg-[#242223] text-white' : 'text-gray-400 hover:bg-white/5'}`}><Code2 size={20} /> Code</button>
            <button aria-label="Preview" onClick={() => setActiveRightTab('preview')} className={`rounded-md p-2 ${activeRightTab === 'preview' ? 'bg-[#242223] text-white' : 'text-gray-400 hover:bg-white/5'}`}><Eye size={23} /></button>
            <button aria-label="Refresh preview" onClick={() => notify('Preview refreshed')} className="rounded-md p-2 hover:bg-white/10"><RefreshCw size={22} /></button>
            <button aria-label="Fullscreen" onClick={() => notify('Fullscreen preview')} className="rounded-md p-2 hover:bg-white/10"><Maximize size={21} /></button>
            <button aria-label="Device preview" onClick={() => notify('Device preview')} className="rounded-md p-2 hover:bg-white/10"><Monitor size={21} /></button>
          </div>

          <div className="flex min-h-0 flex-[1.12] border-b border-white/10">
            {showFileExplorer && <div className="w-[220px] shrink-0 overflow-auto border-r border-white/10 bg-[#292728] px-3 py-3 text-[14px]">
              <div className="mb-3 flex items-center justify-between text-gray-300"><span>File explorer</span><div className="flex gap-2"><Search size={16} /><Plus size={17} /></div></div>
              <div className="space-y-2 text-gray-300">
                <div className="flex items-center gap-2"><ChevronDown size={14} /><Folder size={16} /> public</div>
                <div className="flex items-center gap-2"><ChevronDown size={14} /><Folder size={16} /> src</div>
                <div className="ml-5 flex items-center gap-2"><ChevronRight size={13} /><Folder size={16} /> components</div>
                <div className="ml-5 flex items-center gap-2"><ChevronRight size={13} /><Folder size={16} /> hooks</div>
                <div className="ml-5 flex items-center gap-2"><ChevronRight size={13} /><Folder size={16} /> services</div>
                {['App.tsx', 'index.css', 'main.tsx', 'types.ts'].map((name, i) => <button key={name} onClick={() => openFile(name)} className={`ml-5 flex w-[calc(100%-1.25rem)] items-center gap-2 rounded px-1 py-1 text-left ${activeTopTab === name ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/5'}`}><span className={i === 0 ? 'text-sky-300' : i === 1 ? 'text-pink-400' : 'text-gray-400'}>{i === 1 ? '▰' : i === 0 ? '≡' : '⋯'}</span>{name}</button>)}
                <div className="mt-2 space-y-1 border-t border-white/10 pt-2">
                  {['.env.example', '.gitignore', 'bun.lock', 'cat_icon.png', 'icon.png', 'index.html', 'metadata.json', 'package.json', 'server.ts', 'tsconfig.json', 'vite.config.ts'].map((name) => <button key={name} onClick={() => openFile(name)} className={`flex w-full items-center gap-2 rounded px-1 py-1 text-left hover:bg-white/5 ${activeTopTab === name ? 'bg-white/10' : ''}`}><FileText size={14} className="text-gray-400" />{name}</button>)}
                </div>
              </div>
            </div>}
            <div className="min-w-0 flex-1 bg-[#2c292a]">
              {activeRightTab === 'code' ? (
                <div className="h-full w-full p-4 font-mono text-[12px] text-gray-500">
                  <div className="mb-3 text-gray-300">{activeTopTab}</div>
                  <div className="space-y-2 opacity-70"><div><span className="text-purple-300">import</span> React <span className="text-purple-300">from</span> 'react';</div><div className="pl-4"><span className="text-purple-300">export default function</span> App() {'{'}</div><div className="pl-8 text-gray-400">return (</div><div className="pl-12 text-sky-300">{'<main>'}</div><div className="pl-16 text-gray-400">{'/* Your app code */'}</div><div className="pl-12 text-sky-300">{'</main>'}</div><div className="pl-8">);</div><div className="pl-4">{'}'}</div></div>
                </div>
              ) : <div className="flex h-full items-center justify-center text-sm text-gray-500">Live preview will appear here</div>}
            </div>
          </div>

          <div className="flex min-h-0 flex-[0.88] flex-col bg-[#292728]">
            <div className="flex-1 p-4">
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Make changes, add new features, ask anything..." className="h-full min-h-[90px] w-full resize-none bg-transparent text-[16px] text-gray-200 outline-none placeholder:text-gray-500" />
            </div>
            <div className="flex shrink-0 items-center justify-between border-t border-white/10 px-4 py-2">
              <div className="flex items-center gap-2"><button onClick={() => notify('Attach file')} className="rounded-full border border-white/10 p-2 hover:bg-white/10"><Plus size={19} /></button><button onClick={() => notify('Build options')} className="rounded-lg bg-[#3a3738] px-4 py-2 text-[15px] hover:bg-[#464243]">Build <ChevronDown size={14} className="ml-2 inline" /></button><button aria-label="Voice input" onClick={() => notify('Voice input')} className="rounded-lg p-2 hover:bg-white/10"><Mic size={19} /></button></div>
              <button onClick={sendPrompt} className="flex items-center gap-2 rounded-lg border border-[#ff6a24] bg-[#f15a24] px-4 py-2 text-[14px] font-bold text-[#1f1714] shadow-[0_0_16px_rgba(241,90,36,.22)] hover:bg-[#ff7139]">Meow <Cat size={17} /></button>
            </div>
            <div className="flex h-[142px] shrink-0 items-center justify-center gap-4 border-t border-white/10 bg-[#181617] px-4">
              <div className="flex h-[100px] w-[100px] items-center justify-center overflow-hidden rounded-2xl border border-[#d69b25] bg-black shadow-[0_0_14px_rgba(214,155,37,.12)]"><img src="/cat_icon.png" alt="Supru cat icon" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><Cat size={32} className="text-amber-400" /></div>
              <div className="min-w-0">
                <div className="font-serif text-[30px] font-black tracking-[0.18em] text-[#d79b28] drop-shadow-[0_0_6px_rgba(215,155,40,.25)]">SUPRU</div>
                <div className="text-center text-[18px] leading-tight text-gray-200">Generative<br /><span className="text-[27px] font-light">Studio</span></div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {showOmniCanvas && <div className="absolute bottom-20 left-4 z-50 w-[280px] rounded-xl border border-[#5a5486] bg-[#242230] p-4 shadow-2xl">
        <div className="mb-2 flex items-center justify-between"><div className="flex items-center gap-2 font-semibold text-[#dcd7ff]"><Sparkles size={16} /> Omni Canvas</div><button aria-label="Close Omni Canvas" onClick={() => setShowOmniCanvas(false)} className="rounded p-1 hover:bg-white/10"><X size={14} /></button></div>
        <p className="mb-3 text-xs leading-5 text-gray-400">One workspace for ideas, visuals, layouts, and app concepts.</p>
        <button onClick={() => notify('Omni Canvas is ready')} className="w-full rounded-lg bg-[#8278f6] px-3 py-2 text-sm font-semibold text-[#171525] hover:bg-[#948cff]">Open Omni Canvas</button>
      </div>}

      {notice && <div role="status" className="absolute right-4 top-20 z-[60] rounded-lg border border-white/10 bg-[#1c1a1b] px-4 py-2 text-sm shadow-xl">{notice}</div>}
    </div>
  );
};
