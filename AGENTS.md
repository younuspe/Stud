# Supru Ecosystem — Agent Notes

React + Vite + Express (`tsx server.ts`) + Tauri/Rust. Single dev server serves
the API and the Vite app on `PORT` (default 3000).

## Commands
- `npm run dev` — start Express + Vite (`tsx server.ts`), log to stdout.
- `npm run build` — `vite build`.
- `npm run lint` / `npx tsc --noEmit` — typecheck (must stay at 0 errors).
- `npm run tauri:dev|build|init` — desktop shell.

## Architecture
- `server.ts` — all API routes (chat, stream, image/video, terminal, github,
  agent, orchestrator tool, studio generate/chat, keys).
- `server.providers.ts` — provider layer: `callProvider`, `testProvider`,
  `defaultModelFor`, `normalizeProvider`, `resolveBaseUrl`, `postWithRetry`.
  Never throws; failures returned as `{ ok: false, error }`.
- `src/lib/providers.ts` — `PROVIDER_CATALOG`, `PROVIDER_ORDER`,
  `FREE_MODEL_PRESETS`, `getProviderMeta`, `isOpenAICompatible`.
- `src/components/workbench/*` — the 8 workspace views, all lazy-loaded in
  `src/App.tsx` behind `<Suspense>`.

## Providers
OpenAI wire-compatible: pollinations (keyless), nvidia (build.nvidia.com NIM,
`https://integrate.api.nvidia.com/v1`), groq, openrouter, cerebras, mistral,
github, together, openai, deepseek, lmstudio, custom, ollama.
Free/keyless: Pollinations (`openai`, `mistral`) needs no API key. NVIDIA NIM
and the other free tiers need a key but cost nothing within their free credits.

## Module nav IDs
chat, terminal (CLI), agent (Hunter), github (Warrior), orchestrator (Akhada),
editor (Code Editor), generative (AI Studio), plus Galaxy/Topology.

## Testing
Headless e2e harnesses live in `/tmp/ptest/` (puppeteer-core + /usr/bin/chromium).
They click module buttons by visible `<span>` text and assert real API traffic.
