# Supru Ecosystem — Full Audit Report

**Version audited:** 2.6.0 · **Branch:** `fix/studio-functional-wiring` @ `ec3f1d3`
**Date:** 2026-10-12 · **Scope:** `server.ts`, `server.providers.ts`,
`server.ratelimit.ts`, `src/**`, build/CI, deployment.
**Method:** static review + live runtime probing against the running server
(including through the public reverse proxy).

---

## 1. Executive summary

Supru is a large, feature-rich single-page app (≈25.2k LOC across 60 TS/TSX
files + a 2.5k-line Express server) with a genuinely working dev/prod boot path,
a keyless fallback, and 42 passing tests. The production *plumbing* added
recently (health probe, request IDs, compression, CSP, graceful shutdown,
optional Redis rate limiting, CI) is sound.

It is **not safe to expose to the public internet today.** One critical
vulnerability was reproduced live: remote shell command execution reachable
through the reverse proxy. Several high-severity items compound it (a
default-open API, an SSRF-prone provider URL, secrets in `localStorage`).

| Severity | Count |
| --- | --- |
| Critical | 1 |
| High | 3 |
| Medium | 6 |
| Low / Info | 7 |

**Recommended posture until fixed:** keep Supru on loopback/desktop only, or
front it with a mandatory authenticated proxy that also blocks the exec routes.

---

## 0. Remediation status (update)

| ID | Finding | Status |
| --- | --- | --- |
| C1 | Remote command execution via proxy bypass | **Fixed** — forwarded requests are never treated as local; exec guard enforced as middleware. Verified live (403 via proxy, 200 for direct loopback). |
| H1 | API unauthenticated by default | **Fixed** — a non-loopback production bind now refuses to start without `SUPRU_ACCESS_TOKEN` (dev warns; `SUPRU_ALLOW_INSECURE_PUBLIC=1` overrides). |
| H2 | Access token in the public bundle | **Fixed** — client reads the token from `localStorage` at runtime only; the `VITE_` build-time path was removed. |
| H3 | SSRF via provider `endpointUrl` | **Fixed** — loopback/private/link-local/metadata (incl. DNS-resolved) rejected when `SUPRU_ALLOW_PRIVATE_ENDPOINTS=0`; metadata always rejected. |
| M4 | 50 MB body limit | **Fixed** — default 8 MB, `SUPRU_MAX_BODY_MB` override, clean 413. |
| M5 | 5xx echoes internal errors | **Fixed** — generic `Internal server error` + request id; details go to logs/webhook. |
| M6 | Hand-rolled sanitizer | **Fixed** — replaced with DOMPurify. |
| M1/M2/M3 | localStorage secrets / no identity layer / in-memory limits | Open (design-level). |
| L1-L7 | Dev advisories, a11y, `any`, file sizes, e2e, Node pin | Open. |

Tests: 42 → **52** passing. Live exploit re-test: blocked. Build/tsc clean.

---

## 2. Findings

### CRITICAL

#### C1 — Remote command execution via `requireLocal()` bypass
`server.ts` (`isLocalRequest`, ~L139-158). The guard allows any request whose
socket address is loopback **or any private range** (`10.`, `192.168.`,
`172.16-31.`). Behind the deployment's reverse proxy the socket address *is* a
private IP, so the check always passes for external callers.

**Reproduced live** against `https://work-1-…all-hands.dev`:

```
POST /api/terminal/execute  {"command":"id"}
→ {"output":"uid=10001(openhands) gid=10001(openhands) groups=…,27(sudo)"}
```

`/api/agent/step` is likewise reachable. This is full RCE on the host process
(which holds the Gemini key and the GitHub token) for anyone who can reach the
server.

**Fix direction:** gate exec routes on the *real* client identity — require
`SUPRU_ACCESS_TOKEN` for them, or compare `X-Forwarded-For`'s first hop against
an allowlist, or refuse exec entirely when `NODE_ENV=production` unless
`SUPRU_ALLOW_REMOTE_EXEC=1` is explicitly set *and* an auth gate is active.

---

### HIGH

#### H1 — API is unauthenticated by default
The `SUPRU_ACCESS_TOKEN` gate is opt-in and unset by default. Combined with C1,
a default deploy exposes shell execution and paid AI calls to the world. Public
deployments need the gate on by default (or a documented "you must set this").

#### H2 — Access token is baked into the public JS bundle
`src/utils/apiAuth.ts` reads `import.meta.env.VITE_SUPRU_ACCESS_TOKEN`, which
Vite inlines into `dist/assets/*.js` at build time. Anyone can download the
bundle and read the shared secret, defeating the gate. The `localStorage`
fallback is fine; the build-time env var should be removed, or the design
changed to a real session/identity flow.

#### H3 — Provider endpoint URL allows internal SSRF
`server.providers.ts` `isSafeEndpointUrl()` only rejects non-HTTP(S) and the
literal `169.254.169.254`. Every other internal target is allowed
(`127.0.0.1`, `localhost`, `10.x`, other link-local/metadata addresses, `file:`
via redirects). The client fully controls `endpointUrl`, so this is a
server-side request forgery primitive. The comment says local model servers are
intended — that is fine for desktop, but it must be blocked (or allowlisted)
when the server is remotely reachable.

---

### MEDIUM

#### M1 — Secrets stored in `localStorage`
`supru_studio_api_keys` (Studio keys) and custom-model keys persist in
`localStorage`, readable by any XSS or by a malicious dependency. Prefer an
in-memory store + server-side session, or at minimum document the risk. The
`srcdoc` preview iframes are sandboxed without `allow-same-origin`, which
contains the blast radius — good.

#### M2 — No authentication/authorization model
There is one optional shared secret and nothing else: no users, roles, or
per-route authorization. Multi-user or public use needs an identity layer.

#### M3 — Single-process state and rate limiting by default
Rate limits are in-memory unless `REDIS_URL` is set; the app is not horizontally
scalable without it. Documented, but the default is a production foot-gun.

#### M4 — Unbounded request bodies
`express.json({ limit: '50mb' })` and `urlencoded` at 50 MB. That is a large
DoS/allocation surface for an API. Lower to the few MB actually needed and set
per-route limits for uploads.

#### M5 — Error responses echo internal messages
The central handler returns `err.message` to clients for 5xx. This can leak
stack/paths/upstream details. Return a generic message + the `X-Request-Id`, and
keep details in logs/webhook only.

#### M6 — `sanitizeHtml` is a bespoke allow/deny filter
`src/utils/sanitize.ts` is the only thing between generated HTML and
`dangerouslySetInnerHTML` (Studio atomic-component preview). It blocks known-bad
tags/attrs but is hand-rolled (no DOMPurify, no CSS-value parsing, no
`srcset`/`data-*` URL handling). It has tests, but bespoke sanitizers are
notoriously bypassable. Replace with DOMPurify, or render the preview only in
the sandboxed iframe (which is already the pattern elsewhere).

---

### LOW / INFO

- **L1 — Dev-only advisories.** `npm audit`: 3 advisories (`@vitest/mocker`,
  `tinypool` ×2) in the test toolchain only; not in the production bundle. Fix is
  a breaking `vitest` major upgrade.
- **L2 — Accessibility gaps.** 19 `<img>` tags, only 4 with `alt`; 23
  `aria-label`s total across a 60-file UI. Icon-only buttons (many) lack
  accessible names.
- **L3 — Typed `any` density.** 86 `any`/`as unknown` casts; `req: any` in the
  error handler. Some are pragmatic, but the count invites runtime bugs.
- **L4 — Very large components.** `server.ts` 2,486 lines; `CodeEditorView.tsx`
  1,697; `App.tsx` 1,328; several 1.2k-line views. Hard to review/test safely.
- **L5 — No e2e/UI tests.** 42 unit/integration tests, zero browser tests. The
  CSP/SPA check during hardening was manual.
- **L6 — Node 24 / npm 11 in use.** CI pins Node 22; align the engines field and
  CI to avoid drift.
- **L7 — No source maps shipped** (good for prod), `X-Powered-By` removed
  (good), CSP present, gzip on, `X-Request-Id` on. These are genuine positives.

---

## 3. Positive findings (verified working)

- Production boot serves `dist/`, SPA fallback works, fails loudly if `dist/`
  is missing; runs keyless.
- `/api/health` (open) returns status/uptime/version; graceful `SIGTERM` drains.
- Server-side `GITHUB_TOKEN` wiring works (`hasGithubToken: true`, repo +
  contents routes succeed without a client PAT).
- CSP verified live in a browser — the SPA and Google Fonts render, previews
  unaffected.
- Request correlation, gzip, and Redis-backed rate limiting (fake-RESP tested).
- 42/42 tests pass; `tsc --noEmit` clean; build clean.

---

## 4. Priority remediation plan

| Order | Item | Effort |
| --- | --- | --- |
| 1 | **C1** — block exec routes behind auth / real-IP check | S |
| 2 | **H2** — stop baking the access token into the bundle | S |
| 3 | **H1** — make the API gate required for non-loopback binds | S |
| 4 | **H3** — SSRF guard: block private/link-local when remote | M |
| 5 | **M5/M4** — generic 5xx bodies + smaller body limits | S |
| 6 | **M6** — swap in DOMPurify | S |
| 7 | **M2/M3** — identity layer + Redis in prod compose | L |
| 8 | **L2/L5** — a11y pass + Playwright smoke test | M |
| 9 | **L4** — split the largest files | L |

S = hours, M = days, L = weeks.

---

## 5. Bottom line

The app is a **capable beta with solid operational plumbing, but currently
insecure for public exposure** because of the reproducible RCE (C1) and the
default-open API (H1). Items 1-5 above are the gate to a safe public deploy; the
rest is quality and scale. Nothing here is unfixable — C1 in particular is a
small, well-understood change.
