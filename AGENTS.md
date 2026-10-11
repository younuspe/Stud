# Supru Ecosystem — Agent Notes

React + Vite + Express (`tsx server.ts`) + Tauri/Rust. Single dev server serves
the API and the Vite app on `PORT` (default 3000).

## Commands
- `npm run dev` — start Express + Vite (`tsx server.ts`), log to stdout.
- `npm run build` — `vite build`.
- `NODE_ENV=production npm start` — serve the built `dist/` with SPA fallback.
- `npm run lint` / `npx tsc --noEmit` — typecheck (must stay at 0 errors).
- `npm run tauri:dev|build|init` — desktop shell. No `src-tauri/` is committed
  and the image has no Rust toolchain, so run `npm run tauri:init` first.

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
Unit/integration tests use Vitest + supertest: `npm test` (23 tests) covers the
provider catalog, `normalizeProvider`/`isSafeEndpointUrl`, server route
validation and 404/400 handling, security headers, the GitHub default-branch
resolution, and the logger. Add new suites under `tests/`.

Headless e2e harnesses live in `/tmp/audit/` (puppeteer-core + `/usr/bin/chromium`,
launch with `--no-sandbox --disable-dev-shm-usage`). They click module buttons by
visible `<span>` text and assert real API traffic. Recreate with
`npm i puppeteer-core@23` if the directory is missing. All 8 modules (Chat,
AI Studio, Code, CLI, Hunter, Warrior, Akhada, Galaxy) load with zero console
errors; Chat, AI Studio, Code Copilot, and Warrior were exercised end-to-end.

## Reply attribution
Assistant chat messages carry the `provider`/`model` that produced them (from the
final `{done:true}` SSE frame) and the header renders those values. Never
hard-code a model name on a reply — the active provider varies per user.

## Logging
`src/utils/logger.ts` is the single logging entry point (debug/info/warn/error).
Level is controlled by `LOG_LEVEL` (server) or `VITE_LOG_LEVEL` (browser);
production builds default to `warn`. Do not call `console.*` directly in app or
server code — `console.*` only appears inside generated/sandboxed code strings.

## Security posture
Command-executing endpoints (`/api/terminal/execute`, `/api/agent/step`,
`/api/orchestrator/tool`) are gated to local/private callers by
`requireLocal()` in `server.ts`; set `SUPRU_ALLOW_REMOTE_EXEC=1` to opt out
(only behind an authenticated proxy). GitHub routes validate owner/repo/branch/
path segments. Provider `endpointUrl` is screened by `isSafeEndpointUrl()`.
`server.ts` applies `helmet` defaults and `express-rate-limit`: 120 req/min per
IP across `/api`, with a tighter 20/min budget on AI, exec, and key-test routes.
CSP is intentionally left off (Vite inline scripts + Studio sandboxed iframes).

## Known blockers
Pushing to `origin` (github.com/younuspe/Stud) fails with 403. The injected
`GITHUB_TOKEN` is a GitHub App installation token with **read-only** contents
access: repo metadata reports `push: true` (installation permission) but every
write — git push, `POST /git/refs`, `PUT /contents` — returns
"Resource not accessible by integration". A fine-grained PAT with Contents:
Read+Write (or a write-enabled App install) is required. Local commits are
safe and ready to push.
