<div align="center">

# 🐾 Supru Ecosystem

**A generative AI studio, autonomous engineering workbench, and sovereign multi-agent arena.**

React 19 · Vite · Express · Tailwind 4 · Tauri 2

</div>

## What it is

Supru Ecosystem is a single-page platform that bundles eight modules behind one shell:

| Module | Purpose |
| --- | --- |
| **Chat** | Streaming assistant with persona modes and provider switching |
| **AI Studio** | Google-AI-Studio-style generative workspace (chat, image, video, 3D world, UI code) |
| **Code IDE** | Editor with a sandboxed live HTML preview and console bridge |
| **CLI** | In-app sovereign shell (built-in commands + provider diagnostics) |
| **Hunter** | Autonomous multi-agent engineering pipeline with evidence ledger |
| **Warrior (Git)** | GitHub repository explorer and file browser |
| **Akhada** | Multi-agent arena / orchestrator with real tool calls |
| **Galaxy** | Stratified-stack topology viewer |

## Zero-key by default

The app runs immediately with **no API keys** using the built-in **Supru Smart Core**
and keyless providers (**Pollinations** for text + image). Add keys in-app (stored in
`localStorage`) to unlock Google Gemini, NVIDIA NIM, Ollama, LM Studio, and Veo video.

## Run locally

**Prerequisites:** Node.js 20+

```bash
npm install
npm run dev          # Express + Vite dev server on http://localhost:3000
```

No `.env` is required. To customize ports, providers, or the optional Gemini key,
copy `.env.example` to `.env` — every value is optional.

## Build & test

```bash
npm run build        # Vite production bundle
npm run lint         # tsc --noEmit (0 errors expected)
npm test             # vitest unit suite
```

## Desktop app (Tauri 2)

```bash
npm run tauri:dev    # native dev shell
npm run tauri:build  # packaged macOS/Windows/Linux app
```

