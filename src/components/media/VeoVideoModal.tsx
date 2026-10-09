import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Film, 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Sparkles, 
  RefreshCw, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Layers,
  ArrowRight,
  Eye,
  Cat
} from 'lucide-react';
import { VideoAspectRatio, VideoItem } from '../../types/media';
import { soundFx } from '../../utils/audio';

interface VeoVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhotoUrl?: string | null;
  initialPrompt?: string;
  apiKey?: string;
}

export const VeoVideoModal: React.FC<VeoVideoModalProps> = ({
  isOpen,
  onClose,
  initialPhotoUrl = null,
  initialPrompt = '',
  apiKey,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl);
  const [motionPrompt, setMotionPrompt] = useState<string>(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9'); // Must be 16:9 or 9:16
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentVideo, setCurrentVideo] = useState<VideoItem | null>(null);
  const [videoHistory, setVideoHistory] = useState<VideoItem[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pollingRef = useRef<number | null>(null);

  // Sync initial photo when modal opens with new props
  useEffect(() => {
    if (initialPhotoUrl) {
      setPhotoUrl(initialPhotoUrl);
    }
    if (initialPrompt) {
      setMotionPrompt(initialPrompt);
    }
  }, [initialPhotoUrl, initialPrompt]);

  // Clean up polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const motionPresets = [
    { label: 'Cinematic Dolly & Float', text: 'Fluid cinematic camera dolly forward with ambient dust motes and soft atmospheric lighting' },
    { label: 'Subtle Gaze & Blink', text: 'Gentle lifelike feline breathing, graceful blink, and subtle ear twitch with cinematic depth of field' },
    { label: 'Dynamic Action Pan', text: 'Dynamic lateral camera tracking shot with dramatic speed ramps and vibrant lighting reflections' },
    { label: 'Golden Rain & Embers', text: 'Magical golden embers and soft neon rain drifting past in slow motion, dreamlike atmosphere' },
    { label: 'Neon Cyber Drift', text: 'Holographic cybernetic lights pulsing smoothly with subtle glitch trails and dark noir atmosphere' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPhotoUrl(reader.result as string);
      soundFx.playClick();
    };
    reader.readAsDataURL(file);
  };

  const startAnimation = async () => {
    if (!photoUrl) {
      setErrorMessage('Please upload a photo first to animate into video.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);
    setProgressPercent(5);
    setGenerationStep('Connecting to Veo 3.1 Fast neural video pipeline...');
    soundFx.playMeowChime();

    try {
      // 1. Call POST /api/generate-video
      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: photoUrl,
          prompt: motionPrompt.trim() || undefined,
          aspectRatio: aspectRatio, // strictly '16:9' or '9:16'
          apiKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize Veo video generation');
      }

      const operationName = data.operationName;
      setGenerationStep('Provider accepted the job; waiting for completion...');
      setProgressPercent(0);

      // Start polling status
      pollingRef.current = window.setInterval(async () => {
        setGenerationStep('Waiting for the video provider to finish generation...');
        setProgressPercent(0);

        try {
          const statusRes = await fetch('/api/video-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operationName, apiKey }),
          });

          const statusData = await statusRes.json();
          if (statusData.error) {
            clearInterval(pollingRef.current!);
            throw new Error(statusData.error);
          }

          if (statusData.done) {
            clearInterval(pollingRef.current!);
            setProgressPercent(100);
            setGenerationStep('Video generation complete!');

            // Construct video stream URL
            const finalVideoUrl = `/api/video-download?op=${encodeURIComponent(operationName)}`;

            const completedItem: VideoItem = {
              id: `vid-${Date.now()}`,
              operationName,
              videoUrl: finalVideoUrl,
              thumbnailUrl: photoUrl,
              prompt: motionPrompt.trim() || 'Cinematic photo animation',
              aspectRatio: aspectRatio,
              status: 'completed',
              progressPercent: 100,
              createdAt: Date.now(),
            };

            setCurrentVideo(completedItem);
            setVideoHistory((prev) => [completedItem, ...prev]);
            setIsGenerating(false);
            soundFx.playPurr();
          }
        } catch (pollErr: any) {
          console.error('Polling error:', pollErr);
          clearInterval(pollingRef.current!);
          setErrorMessage(pollErr.message || 'Error checking video status');
          setIsGenerating(false);
        }
      }, 2500);

    } catch (err: any) {
      console.error('Video gen start error:', err);
      setErrorMessage(err.message || 'Error starting video animation');
      setIsGenerating(false);
    }
  };

  const handleDownloadVideo = (videoUrl: string) => {
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `supru-veo-${aspectRatio === '16:9' ? 'landscape' : 'portrait'}.mp4`;
    a.click();
    soundFx.playClick();
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-md">
      <div className="relative flex h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-amber-500/30 bg-[#101016] shadow-2xl">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-[#20202d] px-6 py-4 bg-[#14141c]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Film size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Veo Motion Studio</h3>
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-amber-300 border border-amber-500/30">
                  veo-3.1-fast-generate-preview
                </span>
              </div>
              <p className="text-xs text-gray-400">Animate static photos into cinematic video clips</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X size={19} />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="grid flex-1 grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Left Controls Panel */}
          <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-[#20202d] lg:col-span-5 p-5 overflow-y-auto space-y-4 bg-[#121219]">
            {/* Source Photo Upload */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Starting Photo
                </label>
                {photoUrl && (
                  <button
                    onClick={() => setPhotoUrl(null)}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    Change Photo
                  </button>
                )}
              </div>

              {photoUrl ? (
                <div className="relative rounded-2xl border border-amber-500/40 bg-[#161622] p-2 overflow-hidden group">
                  <img
                    src={photoUrl}
                    alt="Starting frame"
                    className="h-36 w-full rounded-xl object-contain bg-black/40"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-2xl gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-full bg-white/20 px-3 py-1.5 text-xs text-white backdrop-blur-md hover:bg-white/30"
                    >
                      Choose Different Photo
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-36 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#2d2d3e] bg-[#161622]/60 p-4 text-center cursor-pointer transition-colors hover:border-amber-500/50 hover:bg-[#1a1a27]"
                >
                  <Upload size={24} className="text-amber-400 mb-2" />
                  <span className="text-xs font-semibold text-white">Upload photo to animate</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP supported</span>
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

            {/* MANDATORY ASPECT RATIO: 16:9 or 9:16 */}
            <div className="space-y-2 rounded-2xl border border-[#262638] bg-[#161622] p-3.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>Video Aspect Ratio</span>
                <span className="text-[10px] text-gray-400 font-normal">Veo 3.1 requirement</span>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setAspectRatio('16:9');
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    aspectRatio === '16:9'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-sm'
                      : 'border-[#2d2d3e] bg-[#181824] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <div className="h-6 w-10 rounded border border-current flex items-center justify-center text-[9px] font-mono shrink-0">
                    16:9
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">16:9 Landscape</div>
                    <div className="text-[10px] text-gray-400">Cinematic desktop & TV</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundFx.playClick();
                    setAspectRatio('9:16');
                  }}
                  className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                    aspectRatio === '9:16'
                      ? 'border-amber-500 bg-amber-500/15 text-amber-300 font-bold shadow-sm'
                      : 'border-[#2d2d3e] bg-[#181824] text-gray-400 hover:border-gray-500 hover:text-white'
                  }`}
                >
                  <div className="h-10 w-6 rounded border border-current flex items-center justify-center text-[9px] font-mono shrink-0">
                    9:16
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">9:16 Portrait</div>
                    <div className="text-[10px] text-gray-400">Stories, Reels & Shorts</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Motion Prompt */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-between">
                <span>Motion Direction (Optional)</span>
                <span className="text-[10px] text-gray-400">Veo guided motion</span>
              </label>
              <div className="rounded-2xl border border-[#262636] bg-[#161622] p-3 focus-within:border-amber-500/60 focus-within:shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all">
                <textarea
                  value={motionPrompt}
                  onChange={(e) => setMotionPrompt(e.target.value)}
                  rows={3}
                  placeholder="Describe camera movement, character actions, wind, or lighting changes (e.g. 'Slow camera push into eyes, cinematic bokeh, floating embers')"
                  className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 outline-none resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Motion Presets */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Quick Motion Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {motionPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      soundFx.playClick();
                      setMotionPrompt(preset.text);
                    }}
                    className="rounded-full border border-[#2b2b3a] bg-[#181824] px-2.5 py-1 text-[11px] font-medium text-gray-300 hover:border-amber-500/40 hover:text-amber-300 hover:bg-[#202030] transition-colors"
                  >
                    ⚡ {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300 leading-relaxed">
                {errorMessage}
              </div>
            )}

            {/* Generate Action Button */}
            <div className="pt-2">
              <button
                onClick={startAnimation}
                disabled={isGenerating || !photoUrl}
                className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-xs sm:text-sm font-bold tracking-wide transition-all shadow-lg ${
                  isGenerating || !photoUrl
                    ? 'bg-neutral-800 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-neutral-950 hover:from-amber-400 hover:to-amber-500 active:scale-[0.99] shadow-[0_0_20px_rgba(245,158,11,0.35)] cursor-pointer'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-neutral-950" />
                    <span>Rendering Veo Video...</span>
                  </>
                ) : (
                  <>
                    <Film size={16} />
                    <span>Generate Video with Veo 3.1</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Video Showcase Viewport */}
          <div className="flex flex-col lg:col-span-7 bg-[#0b0b10] p-6 overflow-y-auto">
            {isGenerating ? (
              /* Generating Progress State */
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8 space-y-6">
                <div className="relative">
                  <div className="h-24 w-24 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Cat size={32} className="text-amber-400 animate-pulse" />
                  </div>
                </div>

                <div className="max-w-md space-y-2">
                  <h4 className="text-lg font-bold text-white">Veo Video Synthesis in Progress</h4>
                  <p className="text-xs text-amber-300 font-medium">
                    {generationStep || 'Processing temporal video frames...'}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    Model: <span className="font-mono text-gray-400">veo-3.1-fast-generate-preview</span> • Aspect Ratio: <span className="font-mono text-gray-400">{aspectRatio}</span>
                  </p>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-sm space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Rendering</span>
                    <span>{progressPercent === 100 ? '100% complete' : 'Provider progress unavailable'}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#1e1e2b]">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            ) : currentVideo ? (
              /* Video Player Display */
              <div className="flex flex-1 flex-col items-center justify-center space-y-4">
                <div className={`relative overflow-hidden rounded-3xl border border-amber-500/30 bg-[#14141c] p-2 shadow-2xl group max-w-full ${
                  currentVideo.aspectRatio === '9:16' ? 'max-h-[60vh] max-w-[320px]' : 'max-h-[55vh] max-w-2xl'
                }`}>
                  <video
                    ref={videoRef}
                    src={currentVideo.videoUrl}
                    controls
                    autoPlay
                    loop
                    muted={isMuted}
                    className={`rounded-2xl w-full object-contain ${
                      currentVideo.aspectRatio === '9:16' ? 'aspect-[9/16]' : 'aspect-video'
                    }`}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1 text-[11px] font-semibold text-amber-300 backdrop-blur-md border border-amber-500/20">
                    <span>Veo 3.1 Fast</span>
                    <span>•</span>
                    <span>{currentVideo.aspectRatio}</span>
                  </div>
                </div>

                {/* Prompt Caption */}
                <div className="w-full max-w-lg text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-200 italic">
                    "{currentVideo.prompt}"
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => currentVideo.videoUrl && handleDownloadVideo(currentVideo.videoUrl)}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-bold text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.35)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    <Download size={15} />
                    <span>Download MP4 Video</span>
                  </button>

                  <button
                    onClick={() => {
                      soundFx.playClick();
                      startAnimation();
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-[#2b2b3a] bg-[#181824] px-4 py-2 text-xs font-semibold text-gray-200 hover:border-amber-500/40 hover:text-white hover:bg-[#202030] transition-colors"
                  >
                    <RefreshCw size={13} />
                    <span>Generate Another Variation</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Empty Placeholder State */
              <div className="flex flex-1 flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  <Film size={30} />
                </div>
                <div className="max-w-md space-y-1">
                  <h4 className="text-base font-bold text-white">Veo Video Generator</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Upload a starting photo and select <span className="text-amber-400 font-semibold">16:9</span> (landscape) or <span className="text-amber-400 font-semibold">9:16</span> (portrait) aspect ratio to animate it using <span className="text-amber-400 font-semibold">veo-3.1-fast-generate-preview</span>.
                  </p>
                </div>
              </div>
            )}

            {/* History Strip */}
            {videoHistory.length > 0 && !isGenerating && (
              <div className="border-t border-[#1e1e29] pt-4 mt-auto">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Generated Videos ({videoHistory.length})
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {videoHistory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        soundFx.playClick();
                        setCurrentVideo(item);
                      }}
                      className={`relative shrink-0 overflow-hidden rounded-xl border transition-all ${
                        currentVideo?.id === item.id
                          ? 'border-amber-400 ring-2 ring-amber-400/30 scale-105'
                          : 'border-[#262635] hover:border-gray-500'
                      }`}
                    >
                      <img src={item.thumbnailUrl} alt={item.prompt} className="h-16 w-24 object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Play size={16} className="text-amber-400 fill-amber-400" />
                      </div>
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
