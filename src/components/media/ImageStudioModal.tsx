import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Upload, 
  Download, 
  Film, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  Maximize2,
  Trash2,
  Send,
  Check
} from 'lucide-react';
import { ImageAspectRatio, ImageItem } from '../../types/media';
import { soundFx } from '../../utils/audio';

interface ImageStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimateWithVeo: (imageUrl: string, promptText?: string) => void;
  onSendToChat?: (imageUrl: string, promptText: string) => void;
  initialSourceImage?: string | null;
  initialPrompt?: string;
}

export const ImageStudioModal: React.FC<ImageStudioModalProps> = ({
  isOpen,
  onClose,
  onAnimateWithVeo,
  onSendToChat,
  initialSourceImage = null,
  initialPrompt = '',
}) => {
  const [tab, setTab] = useState<'create' | 'edit'>(initialSourceImage ? 'edit' : 'create');
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [sourceImage, setSourceImage] = useState<string | null>(initialSourceImage);
  const [aspectRatio, setAspectRatio] = useState<ImageAspectRatio>('1:1');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResult, setCurrentResult] = useState<ImageItem | null>(null);
  const [history, setHistory] = useState<ImageItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const stylePresets = [
    { label: 'Cyberpunk Feline', promptSuffix: ', sleek obsidian fur, glowing amber neon eyes, rainy neo-tokyo cyberpunk street, octane render 8k' },
    { label: 'Cinematic Noir', promptSuffix: ', dramatic chiaroscuro volumetric lighting, 35mm film grain, moody atmosphere, masterpiece' },
    { label: 'Holographic Gold', promptSuffix: ', translucent cybernetic geometry, radiant amber and liquid gold energy, futuristic luxury' },
    { label: 'Anime Synthwave', promptSuffix: ', vibrant retro synthwave color palette, anime key visual illustration, dynamic angles' },
    { label: 'Studio Macro', promptSuffix: ', hyper-realistic studio macro photography, sharp focus on whiskers and feline gaze, bokeh depth' },
  ];

  const aspectRatios: { id: ImageAspectRatio; label: string; ratioStyle: string }[] = [
    { id: '1:1', label: '1:1 Square', ratioStyle: 'aspect-square' },
    { id: '16:9', label: '16:9 Landscape', ratioStyle: 'aspect-video' },
    { id: '9:16', label: '9:16 Portrait', ratioStyle: 'aspect-[9/16]' },
    { id: '4:3', label: '4:3 Classic', ratioStyle: 'aspect-[4/3]' },
    { id: '3:4', label: '3:4 Tall', ratioStyle: 'aspect-[3/4]' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSourceImage(reader.result as string);
      setTab('edit');
      soundFx.playClick();
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);
    soundFx.playMeowChime();

    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          sourceImage: tab === 'edit' ? sourceImage : undefined,
          aspectRatio: aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to generate image');
      }

      const newItem: ImageItem = {
        id: `img-${Date.now()}`,
        url: data.imageUrl,
        prompt: prompt.trim(),
        isEdit: tab === 'edit',
        aspectRatio: aspectRatio,
        createdAt: Date.now(),
      };

      setCurrentResult(newItem);
      setHistory((prev) => [newItem, ...prev]);
      soundFx.playPurr();
    } catch (err: any) {
      console.error('Image gen error:', err);
      setErrorMessage(err.message || 'Error communicating with gemini-3.1-flash-image-preview');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, filename = 'supru-artwork.png') => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    soundFx.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-500/30 bg-[#101016] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#20202d] px-6 py-4 bg-[#14141c]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Wand2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Image Studio</h3>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                  gemini-3.1-flash-image-preview
                </span>
              </div>
              <p className="text-xs text-gray-400">Create new visuals or edit existing photos with text prompts</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Create vs Edit Mode Tab Switcher */}
            <div className="flex rounded-full bg-[#1e1e2b] p-1 border border-[#2b2b3a]">
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTab('create');
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  tab === 'create'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Create with Text
              </button>
              <button
                onClick={() => {
                  soundFx.playClick();
                  setTab('edit');
                }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  tab === 'edit'
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-bold'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Edit Photo
              </button>
            </div>

            <button
              onClick={onClose}
              className="ml-2 rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X size={19} />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Controls Panel */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#20202d] lg:col-span-5 p-5 overflow-y-auto space-y-4 bg-[#121219]">
            {/* If Edit Mode: Source Photo Upload */}
            {tab === 'edit' && (
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                  <span>Photo to Edit</span>
                  {sourceImage && (
                    <button
                      onClick={() => setSourceImage(null)}
                      className="text-[11px] text-rose-400 hover:underline"
                    >
                      Clear Photo
                    </button>
                  )}
                </label>

                {sourceImage ? (
                  <div className="relative rounded-2xl border border-amber-500/40 bg-[#161622] p-2 overflow-hidden group">
                    <img
                      src={sourceImage}
                      alt="Source for editing"
                      className="h-36 w-full rounded-xl object-contain bg-black/40"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="rounded-full bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-white/30"
                      >
                        Change Photo
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-32 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2d2d3e] bg-[#161622]/60 p-4 text-center cursor-pointer transition-colors hover:border-amber-500/50 hover:bg-[#1a1a27]"
                  >
                    <Upload size={22} className="text-amber-400 mb-1.5" />
                    <span className="text-xs font-semibold text-white">Click or drag a photo here</span>
                    <span className="text-[10px] text-gray-400 mt-0.5">Supports PNG, JPG, WebP</span>
                  </div>
                )}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>{tab === 'edit' ? 'Edit Instructions Prompt' : 'Visual Concept Prompt'}</span>
                <span className="text-[10px] text-gray-400">Natural language</span>
              </label>
              <div className="rounded-2xl border border-[#262636] bg-[#161622] p-3 focus-within:border-amber-500/60 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={4}
                  placeholder={
                    tab === 'edit'
                      ? 'e.g., "Add sleek cybernetic amber goggles to the cat, and change the background to high-tech rainy Shinjuku neon lights"'
                      : 'e.g., "A magnificent black panther-cat sitting atop a crystalline skyscraper in a neon cyber city, dramatic golden rim light"'
                  }
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Style Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Feline Aesthetic Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {stylePresets.map((style, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFx.playClick();
                      setPrompt((prev) => (prev ? `${prev.trim()}${style.promptSuffix}` : `A majestic feline${style.promptSuffix}`));
                    }}
                    className="rounded-full border border-[#2b2b3a] bg-[#181824] px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:border-amber-500/40 hover:text-amber-300 hover:bg-[#202030] transition-colors"
                  >
                    + {style.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Canvas Aspect Ratio
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {aspectRatios.map((item) => {
                  const isSelected = aspectRatio === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        setAspectRatio(item.id);
                      }}
                      className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-semibold shadow-sm'
                          : 'border-[#262635] bg-[#161622] text-gray-400 hover:border-gray-500 hover:text-white'
                      }`}
                    >
                      <div className={`h-4 w-4 rounded-sm border border-current mb-1 ${item.id === '16:9' ? 'w-5' : item.id === '9:16' ? 'h-5' : ''}`} />
                      <span className="text-[10px]">{item.id}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg ${
                  isGenerating || !prompt.trim()
                    ? 'bg-neutral-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-neutral-950" />
                    <span>Synthesizing with gemini-3.1-flash-image-preview...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    <span>{tab === 'edit' ? 'Apply Edit to Image' : 'Generate Image'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Showcase & Gallery Viewport */}
          <div className="flex flex-col lg:col-span-7 bg-[#0b0b10] p-6 overflow-y-auto">
            {currentResult ? (
              <div className="flex flex-1 flex-col items-center justify-center space-y-4">
                {/* Result Card */}
                <div className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-[#14141c] p-2 shadow-2xl group max-w-full">
                  <img
                    src={currentResult.url}
                    alt={currentResult.prompt}
                    className="max-h-[50vh] w-auto rounded-2xl object-contain mx-auto shadow-md"
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-md border border-amber-500/20">
                    <span>{currentResult.isEdit ? 'Edited' : 'Created'}</span>
                    <span>•</span>
                    <span>{currentResult.aspectRatio}</span>
                  </div>
                </div>

                {/* Prompt Caption */}
                <div className="w-full max-w-xl text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-200 italic">
                    "{currentResult.prompt}"
                  </p>
                </div>

                {/* Action Buttons: Animate with Veo, Download, Send to Chat */}
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                  {/* ANIMATE WITH VEO BUTTON */}
                  <button
                    onClick={() => {
                      soundFx.playMeowChime();
                      onAnimateWithVeo(currentResult.url, currentResult.prompt);
                    }}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Film size={15} />
                    <span>🎬 Animate into Video with Veo!</span>
                  </button>

                  <button
                    onClick={() => handleDownload(currentResult.url)}
                    className="flex items-center gap-1.5 rounded-full border border-[#2b2b3a] bg-[#181824] px-4 py-2 text-xs font-semibold text-gray-200 hover:border-amber-500/40 hover:text-white hover:bg-[#202030] transition-colors"
                  >
                    <Download size={14} />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      setSourceImage(currentResult.url);
                      setTab('edit');
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#2b2b3a] bg-[#181824] px-4 py-2 text-xs font-semibold text-gray-200 hover:border-amber-500/40 hover:text-white hover:bg-[#202030] transition-colors"
                  >
                    <Wand2 size={14} />
                    <span>Edit Further</span>
                  </button>

                  {onSendToChat && (
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        onSendToChat(currentResult.url, currentResult.prompt);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
                    >
                      <Send size={13} />
                      <span>Send to Chat</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  <ImageIcon size={30} />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-base font-bold text-white">Your Canvas is Ready</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Type a prompt on the left or upload a photo to edit with <span className="text-amber-400 font-semibold">gemini-3.1-flash-image-preview</span>. You can then animate your artwork into a video using <span className="text-amber-400 font-semibold">Veo</span>!
                  </p>
                </div>
              </div>
            )}

            {/* Recent Creations History strip */}
            {history.length > 0 && (
              <div className="border-t border-[#1e1e29] pt-4 mt-auto">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Session Gallery ({history.length})
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        setCurrentResult(item);
                      }}
                      className={`relative shrink-0 overflow-hidden rounded-xl border transition-all ${
                        currentResult?.id === item.id
                          ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                          : 'border-[#262635] hover:border-gray-500'
                      }`}
                    >
                      <img src={item.url} alt={item.prompt} className="h-16 w-16 object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
