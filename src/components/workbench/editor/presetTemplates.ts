import type { EditorFile } from '../../../types/workbench';

// Preset interactive showcase applications for instant 1-click loading
export const PRESET_TEMPLATES: { name: string; icon: string; desc: string; file: EditorFile }[] = [
  {
    name: 'Neural Particle Galaxy',
    icon: '🌌',
    desc: 'Interactive 60FPS canvas galaxy with mouse gravity & shockwaves',
    file: {
      id: 'tpl-galaxy',
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supru Neural Galaxy</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; background: #08080f; overflow: hidden; font-family: system-ui, sans-serif; }
    canvas { display: block; }
    .glass { background: rgba(18, 18, 28, 0.8); backdrop-filter: blur(16px); border: 1px solid rgba(251, 191, 36, 0.25); }
  </style>
</head>
<body class="relative h-screen w-screen select-none">
  <!-- Interactive Floating HUD -->
  <div class="absolute top-4 left-4 z-10 glass rounded-2xl p-4 text-white shadow-2xl max-w-xs transition-all">
    <div class="flex items-center gap-2 mb-2">
      <span class="flex h-3 w-3 rounded-full bg-amber-400 animate-ping"></span>
      <h1 class="text-xs font-bold tracking-wider text-amber-300">SUPRU NEURAL GALAXY</h1>
    </div>
    <p class="text-[11px] text-gray-300 mb-3 leading-relaxed">
      Move cursor to attract neural particles. Click anywhere to trigger a hyper-energy shockwave!
    </p>
    <div class="flex items-center justify-between text-[10px] text-gray-400 border-t border-gray-800 pt-2">
      <span>Nodes: <strong id="nodeCount" class="text-amber-400">180</strong></span>
      <span>Speed: <strong class="text-emerald-400">60 FPS</strong></span>
      <button id="toggleColor" class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/40 text-[9.5px] font-bold">
        Morph Palette
      </button>
    </div>
  </div>

  <canvas id="galaxyCanvas"></canvas>

  <script>
    const canvas = document.getElementById('galaxyCanvas');
    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    window.addEventListener('resize', () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const mouse = { x: width / 2, y: height / 2 };
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
    window.addEventListener('touchmove', (e) => {
      if (e.touches[0]) { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }
    });

    let paletteIndex = 0;
    const palettes = [
      ['#f59e0b', '#fbbf24', '#d97706', '#ef4444', '#8b5cf6'],
      ['#06b6d4', '#3b82f6', '#6366f1', '#ec4899', '#10b981'],
      ['#10b981', '#34d399', '#059669', '#f59e0b', '#3b82f6'],
    ];

    document.getElementById('toggleColor').addEventListener('click', () => {
      paletteIndex = (paletteIndex + 1) % palettes.length;
      particles.forEach(p => p.color = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)]);
    });

    class Particle {
      constructor() {
        this.reset();
      }
      reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2.5 + 1;
        this.baseRadius = this.radius;
        this.color = palettes[paletteIndex][Math.floor(Math.random() * palettes[paletteIndex].length)];
      }
      update() {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180 && dist > 0) {
          const force = (180 - dist) / 180;
          this.vx += (dx / dist) * force * 0.45;
          this.vy += (dy / dist) * force * 0.45;
          this.radius = this.baseRadius * (1 + force * 1.5);
        } else {
          this.radius = this.baseRadius;
        }
        this.vx *= 0.96;
        this.vy *= 0.96;
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
      }
      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    const particles = Array.from({ length: 180 }, () => new Particle());

    window.addEventListener('click', (e) => {
      for (let i = 0; i < 40; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 8 + 3;
        particles.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          radius: Math.random() * 3 + 1.5,
          color: '#ffffff',
          update() {
            this.x += this.vx; this.y += this.vy;
            this.vx *= 0.92; this.vy *= 0.92;
            this.radius *= 0.95;
          },
          draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, Math.max(0.2, this.radius), 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
          }
        });
      }
    });

    function loop() {
      ctx.fillStyle = 'rgba(8, 8, 15, 0.25)';
      ctx.fillRect(0, 0, width, height);

      // Connect nearby particles with subtle laser filaments
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 85) {
            ctx.beginPath();
            ctx.strokeStyle = \`rgba(245, 158, 11, \${(85 - dist) / 85 * 0.25})\`;
            ctx.lineWidth = 0.75;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        p.draw();
        if (p.radius < 0.3) particles.splice(i, 1);
      }
      requestAnimationFrame(loop);
    }
    loop();
    console.log('🌌 Supru Neural Galaxy initialized with 60FPS physics loop.');
  </script>
</body>
</html>`
    }
  },
  {
    name: 'Web Audio Synthesizer',
    icon: '🎛️',
    desc: 'Real Web Audio API synthesizer with live frequency spectrum visualizer',
    file: {
      id: 'tpl-synth',
      name: 'index.html',
      language: 'html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Supru Audio Synth</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="flex flex-col items-center justify-center min-h-screen bg-[#09090f] text-gray-100 p-6 select-none font-mono">
  <div class="w-full max-w-lg bg-[#13131c] border border-amber-500/30 rounded-3xl p-6 shadow-2xl">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center gap-2">
        <span class="text-xl">🐾</span>
        <h1 class="text-sm font-bold text-amber-400">SUPRU SYNTHESIZER</h1>
      </div>
      <span class="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
        Web Audio API
      </span>
    </div>

    <!-- Visualizer Canvas -->
    <canvas id="visualizer" width="450" height="120" class="w-full bg-[#090912] rounded-xl border border-gray-800 mb-5"></canvas>

    <!-- Keypad -->
    <div class="grid grid-cols-7 gap-2 mb-4">
      <button onclick="playTone(261.63, 'C4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">C4</button>
      <button onclick="playTone(293.66, 'D4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">D4</button>
      <button onclick="playTone(329.63, 'E4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">E4</button>
      <button onclick="playTone(349.23, 'F4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">F4</button>
      <button onclick="playTone(392.00, 'G4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">G4</button>
      <button onclick="playTone(440.00, 'A4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">A4</button>
      <button onclick="playTone(493.88, 'B4')" class="key py-4 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black font-bold text-xs transition-colors">B4</button>
    </div>

    <p class="text-[11px] text-gray-400 text-center">
      Click keys to trigger harmonic synthesizer frequencies & live oscilloscope waveform.
    </p>
  </div>

  <script>
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        dataArray = new Uint8Array(analyser.frequencyBinCount);
        renderVisualizer();
        console.log('AudioContext activated.');
      }
    }

    function playTone(freq, note) {
      initAudio();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(analyser);
      analyser.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      console.log('Played note:', note, freq + 'Hz');
    }

    function renderVisualizer() {
      requestAnimationFrame(renderVisualizer);
      if (!analyser) return;

      analyser.getByteFrequencyData(dataArray);

      ctx.fillStyle = '#090912';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / dataArray.length) * 1.5;
      let x = 0;

      for (let i = 0; i < dataArray.length; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        ctx.fillStyle = \`hsl(\${i * 8 + 35}, 100%, 55%)\`;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    }
  </script>
</body>
</html>`
    }
  }
];
