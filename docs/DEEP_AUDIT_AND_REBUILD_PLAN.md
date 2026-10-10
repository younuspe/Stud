# Supru Deep Audit and Rebuild Plan

Audit baseline: branch fix/functional-implementation-audit, commit 2aee321ae54105b2099efc80ffb80beab0fb3611.
Verified CI baseline: [macOS desktop build #140](https://github.com/younuspe/Stud/actions/runs/38022840976) succeeded, including frontend type-check, provider-resolution tests, Rust URL regression tests, frontend bundling, unsigned DMG packaging, and packaged-app smoke test.

## Executive assessment

Keep the existing UI inside Tauri v2 and keep Monaco as the embedded editor. Do not replace the desktop product with a browser-hosted app. Tauri uses a webview for its UI; project access, provider requests, permissions, and execution must be owned by the native Rust layer.

The repository is a useful UI prototype with a functioning native provider bridge, not yet a dependable autonomous coding platform. Work should be organized as verifiable milestones, not repeated one-line patches.

## Findings

### P0 — Hunter did not use the selected external model

Main chat/editor use a shared provider resolver, but Hunter mapped only the primary local provider and sent localConfig directly to Rust. Selecting a separate OpenRouter, NVIDIA, or custom model could send the wrong endpoint, model ID, or API key. This changeset connects Hunter to the shared resolver and passes the selected profile explicitly.

### P0 — Some UI actions fabricated verification results

The Sovereign Protocol screen generated a pretend Z3/SAT proof after timers and increased compiled-mutation counters without calling a solver or compiler. Those actions now report blocked/not-connected states instead of claiming proof or compilation. Other aspirational copy must be treated as design intent, not implemented capability.

### P1 — Orchestrator pipeline labels overstate what runs

The pipeline runner executes a small allowlist of project-check commands. AST parsing, SMT proof, fuzzing, token budgeting, and self-healing are not implemented in this runner. Its former browser/server fallback also bypassed the desktop-only execution policy. This changeset routes supported project checks through Tauri's macOS sandbox and makes the experimental stage map describe its limits honestly.

### P1 — No durable task ledger or resume contract

Hunter's plan, handoffs, approvals, and evidence mostly live in React component state. A process restart loses the session. There is no reliable durable task_plan.md/findings.md/progress.md lifecycle, checkpoint schema, or recovery protocol yet.

### P1 — API credentials are persisted in WebView localStorage

src/App.tsx stores primary provider settings and custom-model profiles, including API keys, in localStorage. Masking the key in the UI does not encrypt it at rest. A security milestone must move secrets to macOS Keychain (and an appropriate OS credential store on other platforms), keeping only secret references in ordinary app state. Do not claim credential-at-rest protection until implemented and tested.

### P1 — Shell execution has two different trust levels

The Rust layer exposes both direct terminal execution and a macOS Seatbelt-backed command. Direct execution is appropriate only for a deliberate user-operated terminal; autonomous orchestration, tests, and agents must use the sandboxed route and require explicit approval where policy says ask. Never silently fall back from sandboxed execution to unrestricted shell execution.

### P2 — Provider support needs a contract-driven regression matrix

The shared resolver and URL normalization tests cover OpenRouter, NVIDIA, OpenAI, Gemini, Ollama, endpoint normalization, and credential isolation. Still required: provider-specific error parsing, real connection tests for each selected profile, empty-content handling, timeout/cancellation, and live chat smoke tests. A successful models endpoint is not proof that a selected model can generate.

### P2 — New-file workflows and atomic edits are incomplete

Hunter currently proposes a replacement for one existing file; Rust workspace writing requires the parent directory to exist. A coding-platform workflow needs explicit create/edit/delete/rename operations, diff preview, checkpoints, approval scopes, rollback, and audit receipts. These should be native commands with path validation—not renderer-side filesystem access.

### P2 — Build success is not full product verification

CI #140 succeeded for the tested commit. It does not prove every provider, every workflow, secret storage, file editing, or long-running orchestration works end-to-end. Keep verification claims tied to named tests and actual command results.

## Third-party assessment and lawful reuse

- AGNT (agnt-gg/agnt): its repository declares the AGNT Community Core License, not a standard permissive open-source license. It permits personal use of AGNT but explicitly restricts forking and building a competing product, and restricts embedding/OEM use. Do not copy its source, workflow files, skills, or bundled assets into Supru.
- Codewhale (codewhale-hq/Codewhale): MIT licensed. Its architecture is useful for studying model-provider abstraction, tool execution, approvals, receipts, and durable workflow state. It is a large Rust workspace; do not transplant the entire engine. Any later copied code must retain the relevant copyright and MIT license notice and be reviewed for its own dependencies.
- Planning with Files (OthmanAdi/planning-with-files): MIT licensed. Its durable plan/findings/progress and completion-gate concepts fit Supru. Host-specific lifecycle hooks should not be installed blindly; implement a native, project-scoped equivalent and retain attribution if source is copied.
- Editor: Monaco is already integrated and is the appropriate embeddable code editor. Xcode is a native development/build toolchain, not a drop-in editor component. Use Apple tooling for native builds when needed; do not replace Monaco with the Xcode application.

No source code from these three repositories is copied by this audit changeset.

## Rebuild milestones

1. M0 — Stable desktop baseline: one clean macOS workflow; type-check, provider tests, Rust tests, frontend build, DMG build, and packaged smoke test. No feature work while this gate is red.
2. M1 — Provider contract: one resolver for chat, editor, generator, Hunter, and tests; correct selected model/key; no credential crossover; timeout/cancel; provider-specific response/error parsing.
3. M2 — Native secure state: OS credential store, persistent .supru task/session state, append-only audit/evidence receipts, atomic checkpointing, and recovery after restart.
4. M3 — Real coding loop: inspect workspace, create durable plan, propose diff, request human approval, native atomic write, run sandboxed checks, review diff/output, and issue a verdict linked to evidence. Include new files and rollback.
5. M4 — Honest orchestration: role/model assignment must affect real provider calls; tools are registered capabilities; unsupported tools are unavailable rather than decorative; pause/cancel/resume are durable and deterministic.
6. M5 — Integration hardening: provider live-smoke matrix, path traversal/symlink tests, sandbox denial tests, keychain migration tests, packaging verification, and a user-visible diagnostic report.

## Acceptance rule

A task is verified only when the requested artifact/change exists and required checks have recorded real output and exit status. Model text, a green connection indicator, a timer, a preset counter, or an unimplemented tool label is not evidence of completion.


## Additional visible-state audit (follow-up)

The follow-up removes the remaining green “verified” completion banner and static all-green verification ladder from Hunter. The final UI must reflect actual evidence records and leave missing checks as “not run”; completion of model handoffs alone is not task verification. The Orchestrator preset runner is limited to supported checks and explicitly labels skipped tools.


### P2 — Orchestrator templates displayed invented project telemetry

The project dashboard was seeded with nonzero token usage, token-saved totals, completed tasks, and model assignments that had not occurred in the current session. These are now initialized as pending templates with zero usage; the UI states that model-role labels do not yet route separate providers and fallback models are not configured.

## Rebuild source selection — desktop-first, not a browser migration

The implementation branch is `rebuild/native-coding-core`. Keep the current Tauri v2 shell, Rust authority layer, Monaco editor, and sandboxed live preview. Do not replace the app with a browser-hosted Google AI Studio clone.

### Selected upstreams for selective porting

- **Quests** (`quests-org/quests`, Apache-2.0): use its workspace/app-builder implementation as the primary source for multi-file project editing, file tools, previews, project/session lifecycle, and targeted edits. Port only modules that can be separated from its Electron shell and private workspace package graph. Preserve Apache-2.0 notices for any copied or adapted source. Upstream: https://github.com/quests-org/quests
- **Pi agent runtime** (`@earendil-works/pi-agent-core` / `@earendil-works/pi-ai`, MIT): evaluate as the orchestration/runtime source for tool-call loops, streaming events, and provider abstraction. The old `@mariozechner/*` package names are deprecated; the maintained project is https://github.com/earendil-works/pi. Do not add a dependency until its exact version, license, dependency graph, and lockfile are reviewed and CI can reproduce the lockfile.
- **SRInternet-Studio/AIStudio** (Apache-2.0): not the product base. Its stated goal is a self-hosted recreation of Google AI Studio, not a native project-editing coding agent. Reuse only an isolated, useful component after source and dependency review. Upstream: https://github.com/SRInternet-Studio/AIStudio
- **MindWorkAI/AI-Studio**: do not copy into Supru's competing product while its current FSL-1.1-MIT license restricts competing use. Its provider and desktop UX can be studied, not transplanted under that restriction. Upstream: https://github.com/MindWorkAI/AI-Studio

### Required integration boundaries

1. One selected-provider contract must drive chat, Code Copilot, app generation, Hunter, orchestration, connection status, and response attribution. The UI must display the model/provider actually selected for that response; no hard-coded Gemini identity.
2. All AI calls in the installed app go through the native Tauri/Rust bridge. Browser-only fallback routes must not silently switch the provider or become the production execution path.
3. Rust owns workspace path validation, file reads/writes, command execution, permission checks, and audit records. The renderer may present plans/diffs and request approval, but cannot bypass Rust policy.
4. App building must operate on a real project directory with multiple files, not only a single in-memory HTML string. Keep the isolated preview, but add explicit file creation/editing, diff review, save/checkpoint, rollback, and verification output.
5. Orchestration must be a real tool-call state machine with durable task/session state, cancellation, explicit approval gates, and recorded command/test results. A role label or model handoff is not evidence that a tool ran.
6. Keep the app small: do not transplant a full Electron shell, unrelated services, or a monorepo wholesale into the Tauri build. Port only dependency-audited modules and test each boundary before the next milestone.

### Newly confirmed UI defect

The assistant message header was hard-coded to display “Gemini 3.8 Core” regardless of which model actually generated the reply. That label was false for NVIDIA/OpenRouter and made routing impossible to verify from the conversation. The rebuild branch replaces it with response-level provider/model metadata and makes desktop connection status test the selected profile. These are UI/diagnostic corrections; they do not by themselves prove the whole coding workflow is complete.

### Dependency security observation

The macOS workflow's npm install reported **34 dependency advisories (including 2 critical and 5 high)** on the audited dependency set. This is an npm audit summary, not yet a reviewed list of affected production paths. Do not run `npm audit fix --force` blindly; capture the full audit JSON, separate production from development dependencies, identify the vulnerable dependency paths, and update with lockfile-backed tests before release.

### Rebuild branch progress (not a release claim)

- **Implemented, awaiting workflow #144:** the desktop connection test now resolves and tests the same selected provider profile as chat; assistant messages display response-level model/provider metadata instead of a fixed Gemini label.
- **Implemented, awaiting workflow #144:** generated Studio apps are given unique project filenames when opened in Monaco. Code generation on a real project file stages the edit for explicit Save; generation from a demo tab creates a separate file in the selected workspace rather than overwriting an existing project file.
- **CI scope:** workflow #144 is the first workflow configured to build this rebuild branch. Its result must be checked before treating these edits as build-verified.
- **Not yet implemented:** the Quests app-builder source and Pi agent runtime have been selected for evaluation, but no upstream orchestration/runtime has been integrated yet. Multi-file autonomous planning, durable sessions, keychain migration, permission-gated writes, rollback, and full app-level end-to-end tests remain open milestones.

### Additional editor-runtime risk found during follow-up

The production Tauri CSP in `tauri.conf.json` allows only same-origin scripts, but `@monaco-editor/react` defaults to downloading Monaco from a CDN. The app does not configure its loader to use the installed `monaco-editor` package or bundle Monaco workers. That conflicts with the production CSP and is a concrete cause of the editor remaining stuck/unavailable in the packaged app. The CSP also lacks explicit `worker-src` / `child-src` rules for Monaco's workers. Fix this by bundling Monaco and its Vite workers locally, configuring `loader.config({ monaco })`, and allowing only the required local/blob worker sources. A window-launch smoke test is insufficient; the packaged app must open Monaco, accept edits, and show language diagnostics.

