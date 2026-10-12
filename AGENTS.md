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
Unit/integration tests use Vitest + supertest: `npm test` (35 tests) covers the
provider catalog, `normalizeProvider`/`isSafeEndpointUrl`, server route
validation and 404/400 handling, security headers, the GitHub default-branch
resolution, the logger, the HTML sanitizer, and the `ModalShell` dialog
semantics (portal, Escape, focus trap, focus restore). Add new suites under
`tests/`. DOM suites opt into jsdom with a `// @vitest-environment jsdom`
pragma; `vitest.config.ts` keeps `esbuild.jsx = 'automatic'` so JSX needs no
React import.

## UI primitives
- `src/components/ui/Modal.tsx` — `ModalShell`, the single accessible dialog
  (portal, Escape, backdrop dismissal, Tab trap, focus restore, scroll lock).
  All modals render through it.
- `src/components/ui/ConfirmDialog.tsx` — destructive-action confirmation,
  built on `ModalShell`.
- `src/components/ui/Toast.tsx` — `ToastProvider`/`useToast` for transient
  success/error/warning/info feedback (portal, auto-dismiss, aria-live).
- `src/components/ui/ErrorBoundary.tsx` — catches render crashes so one faulty
  module cannot blank the app.
- `src/components/ui/LoadingFallback.tsx` — branded Suspense fallback.
- `src/utils/sanitize.ts` — `sanitizeHtml`; required before any
  `dangerouslySetInnerHTML`.
- `src/utils/clipboard.ts` — `copyText` with a `execCommand` fallback; use it
  instead of `navigator.clipboard` so copies work in non-secure contexts.

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

The Code IDE live preview renders untrusted generated code in an `<iframe
sandbox="allow-scripts allow-modals allow-forms">` — deliberately **without**
`allow-same-origin`, so previewed code is cross-origin and cannot read the
parent's `localStorage` (where provider keys live). The console bridge still
works because the iframe posts `postMessage` to `window.parent`; the parent
handler additionally drops any message whose `event.source` is not the sandbox
iframe's `contentWindow`.

## Desktop (Tauri) build

`src-tauri/` is a Tauri 2 shell (`supru-core`) that wraps the same web app.

- `npm run tauri:dev` — native window pointing at the Vite dev server (`devUrl`).
- `npm run build:desktop` — builds the web app, copies the Node runtime to
  `src-tauri/resources/node`, and bundles `server.ts` to
  `src-tauri/dist-server/server.mjs` with esbuild.
- `npm run tauri:build` — produces installers under
  `src-tauri/target/release/bundle/` (deb/AppImage on Linux, dmg, nsis).

Packaged runtime: `lib.rs` starts the bundled Node + `server.mjs` on
`127.0.0.1:43127` (`SUPRU_HOST`/`SUPRU_STATIC_DIR` set), waits for it, then
navigates the window to that origin so static assets and `/api` share one origin
— relative `fetch('/api/...')` calls need no rewrite. The server binds loopback
in desktop mode and `0.0.0.0` otherwise. The bundle ships `dist`, `node`, and
`server.mjs` as resources; `resources/` and `dist-server/` are gitignored.

A stray root-level `tauri.conf.json` used to shadow the real config; it was
removed. The real config lives at `src-tauri/tauri.conf.json` and paths inside it
(`frontendDist`, icons, resources) resolve relative to `src-tauri/`.

## Known blockers

The injected `GITHUB_TOKEN` is a GitHub App installation token with **read-only**
contents access: repo metadata reports `push: true` (installation permission) but
every write — git push, `POST /git/refs`, `PUT /contents` — returns
"Resource not accessible by integration" (403). Use a fine-grained PAT with
Contents: Read+Write as a one-off push URL (never stored in git config) to update
the branch. `feat/production-hardening` is pushed and current on origin.

`fix/studio-functional-wiring` (off `feat/production-hardening`) wires the dead
Generative Studio controls (3D World / UI Code Generate, header Presets +
directives, shared device viewport, in-chat "Open in Editor" signature) and
fixes the two server issues found while exercising them:
`app.set('trust proxy', ...)` (rate limiter threw
`ERR_ERL_UNEXPECTED_X_FORWARDED_FOR` behind the preview proxy) and
`allowedHosts: true` on the Vite dev middleware. `veo-3.1-fast-generate-preview`
is a valid Veo 3.1 Fast ID — do not "fix" it. This branch is pushed and current
on origin.

### Production-readiness hardening (commit 0832c15)

Supru Git now authenticates server-side: `server.ts` reads
`GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_PAT` (first set wins) and uses it for
`/api/github/*`, falling back to a client-supplied PAT only when one is passed.
`/api/status` returns `hasGithubToken`; `GitHubView` shows a "Server Token"
badge. The injected `GITHUB_TOKEN` in this sandbox has **empty OAuth scopes**
(limited fine-grained), so it can read the API but git push is still 403 — push
with a user PAT as a one-off URL.

Also added: unauthenticated `/api/health` (uptime + version) for probes;
optional `SUPRU_ACCESS_TOKEN` gate over `/api` (off by default, `/api/health`
and `/api/status` stay open; web client sends it via `src/utils/apiAuth.ts` from
`VITE_SUPRU_ACCESS_TOKEN` or localStorage `supru_access_token`); graceful
`SIGTERM`/`SIGINT` shutdown with a 10s drain; a boot warning for a malformed
`GEMINI_API_KEY`; `Dockerfile` + `.dockerignore`; `npm run start:prod`
(`NODE_ENV=production`).

### Production hardening (commit 4bd17f4)

- `compression()` gzips responses; every request gets an `X-Request-Id`
  (inbound id preserved) and one structured access log line.
- Explicit CSP in `server.ts` allows the Vite inline bootstrap, Google Fonts
  (`fonts.googleapis.com` / `fonts.gstatic.com` — loaded by `index.html`), and
  `srcdoc` Studio previews; blocks injected remote scripts (`object-src 'none'`).
  Verify SPA still renders if you touch it.
- `server.ratelimit.ts` — optional Redis store via `REDIS_URL`; `ioredis` +
  `rate-limit-redis` are `optionalDependencies`, so the code degrades to the
  in-memory store if they are absent. Covered by `tests/ratelimit-redis.test.ts`,
  which spins a fake RESP server over TCP (no Redis daemon needed).
- `unhandledRejection` / `uncaughtException` handlers; optional
  `SUPRU_ERROR_WEBHOOK` POSTs a JSON payload for every 5xx.
- `.github/workflows/ci.yml` runs typecheck, tests, build, and a prod boot
  smoke test. `docker-compose.yml` = app + Redis. README has a deployment section.
- `npm audit` still reports 3 dev-only advisories in vitest/tinypool; not in the
  production bundle.

### Security fixes (audit remediation)

Full audit in `AUDIT.md`. Fixed:

- **Exec guard (was C1/RCE).** `isLocalRequest` now requires the TCP peer to be
  loopback AND no `X-Forwarded-For`/`X-Real-IP` header. A same-host reverse proxy
  connects from loopback, so header presence is what distinguishes a real local
  client from a proxied remote one. `requireLocal` also requires
  `SUPRU_ALLOW_REMOTE_EXEC=1` **and** `SUPRU_ACCESS_TOKEN` for remote use, and is
  enforced as middleware on `EXEC_PATHS` (`/api/terminal/execute`, `/api/agent/*`).
- **Safe bind.** `assertSafeBind()` refuses a non-loopback bind in production
  without `SUPRU_ACCESS_TOKEN` (dev warns); override `SUPRU_ALLOW_INSECURE_PUBLIC=1`.
  The dev/canvas run uses that override — keep it when restarting the preview.
- **SSRF.** `isSafeEndpointUrl` is now async and rejects loopback/private/
  link-local/CGNAT/metadata (and DNS names resolving to them) when
  `SUPRU_ALLOW_PRIVATE_ENDPOINTS=0`. Metadata is always rejected.
- **Token in bundle (was H2).** `src/utils/apiAuth.ts` reads the token from
  localStorage at runtime only — never `import.meta.env` (Vite would inline it).
- **Bodies/errors.** `SUPRU_MAX_BODY_MB` (default 8) with a clean 413; 5xx bodies
  are generic (`Internal server error`) plus `requestId`.
- **Sanitizer.** `src/utils/sanitize.ts` now wraps DOMPurify.

Regression tests live in `tests/server.test.ts` (exec guard, body limits),
`tests/providers.test.ts` (SSRF), `tests/sanitize.test.ts` (DOMPurify bypasses).
