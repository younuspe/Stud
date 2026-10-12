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

## Production deployment

The server runs the same code in dev and production; production just serves the
built assets and enables graceful shutdown.

```bash
npm run build         # emits dist/
npm run start:prod    # NODE_ENV=production, serves dist/ + /api on PORT
```

Container:

```bash
docker compose up --build   # app + Redis on http://localhost:3000
```

Health probe: `GET /api/health` returns `{ status, uptimeSeconds, version }`
and is always unauthenticated, so point your orchestrator's liveness/readiness
check at it. The server drains in-flight requests on `SIGTERM`/`SIGINT` (10s
budget) before exiting.

Operational environment variables (all optional):

| Variable | Purpose |
| --- | --- |
| `PORT` / `SUPRU_HOST` | Listen port (default 3000) and interface (default 0.0.0.0). |
| `GEMINI_API_KEY` | Enables Gemini + image/video generation. Without it the app runs keyless. |
| `GITHUB_TOKEN` / `GH_TOKEN` / `GITHUB_PAT` | Server-side token for the Supru Git module. |
| `SUPRU_ACCESS_TOKEN` | Gates the whole API behind a bearer token (leave unset for local use). |
| `REDIS_URL` | Shares rate-limit counters across instances (needs `ioredis` + `rate-limit-redis`). |
| `SUPRU_ERROR_WEBHOOK` | Receives a JSON payload for every 5xx (Slack/Discord/Opsgenie/custom). |
| `SUPRU_TRUST_PROXY` | Reverse-proxy trust setting for correct client-IP rate limiting. |
| `SUPRU_ALLOW_REMOTE_EXEC` | Must be set (with an authenticated proxy) to expose exec routes off-box. |
| `LOG_LEVEL` | `debug` \| `info` \| `warn` \| `error` (default: `info`). |

Every response carries an `X-Request-Id` (inbound ids are preserved) and the
server logs one structured access line per request. Responses are gzip-compressed
and sent with a Content-Security-Policy that permits the SPA, Google Fonts, and
sandboxed Studio previews while blocking injected remote scripts.

### Security notes

- Command-executing endpoints (`/api/terminal/execute`, `/api/agent/*`,
  `/api/orchestrator/*`) are gated to local/private callers unless
  `SUPRU_ALLOW_REMOTE_EXEC` is set.
- For a public deployment, set `SUPRU_ACCESS_TOKEN`, terminate TLS at a proxy,
  and set `SUPRU_TRUST_PROXY` so rate limiting keys on the real client IP.
- Rate limits are in-memory per process by default; add Redis for a multi-instance
  deployment.
- `npm audit` currently flags three advisories in the `vitest`/`tinypool` dev
  toolchain only; they are not in the production bundle. The fix is a breaking
  `vitest` major upgrade.

