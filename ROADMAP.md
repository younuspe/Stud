# Supru Generative Studio — Roadmap

This roadmap is execution order, not a claim that features already exist. Update each item only with evidence from code, tests, and CI.

## Stage 0 — Audit and baseline

- [ ] Confirm the authoritative branch and preserve the existing branch as a rollback point.
- [ ] Inventory UI routes, Tauri commands, provider adapters, settings/key storage, filesystem/process paths, preview mechanisms, and CI workflows.
- [ ] Identify duplicate implementations and dead/legacy code before editing.
- [ ] Reproduce and record current TypeScript, Rust, test, frontend build, and packaged-app status.
- [ ] Fix the known AIProviderType versus provider-ID type mismatch at the shared type boundary, not by casting string at the call site.
- [ ] Publish an audit report with severity, exact file/line, evidence, root cause, and remediation order.

**Exit gate:** baseline and failure are reproducible; no speculative patches.

## Stage 1 — Architecture and contracts

- [ ] Define shared provider/model/capability/error types.
- [ ] Define a single provider registry and URL normalizers.
- [ ] Define typed Rust commands for project operations, secrets, permissions, execution, and preview.
- [ ] Define patch format, validation, conflict detection, apply/reject, and checkpoint contracts.
- [ ] Define storage migration and secret-redaction rules.
- [ ] Map each requirement to an automated test or a documented manual verification.

**Exit gate:** interfaces are agreed before feature implementation; no duplicate provider logic.

## Stage 2 — Reliable desktop foundation

- [ ] Tauri app launches without an Express server or external development URL.
- [ ] Secure workspace selection and path-safe list/read/write/create/rename/delete.
- [ ] Monaco/editor with dirty state, save, tabs, and file operations.
- [ ] OS-protected provider secrets and masked key status.
- [ ] Restrictive CSP and narrowly scoped Tauri capabilities.
- [ ] No silent browser-mode fallback for native-only features.

**Exit gate:** packaged app opens a project and edits/saves a file with tests.

## Stage 3 — Provider layer

- [ ] OpenAI adapter.
- [ ] Generic OpenAI-compatible adapter (OpenRouter, NVIDIA, custom endpoints, LM Studio).
- [ ] Anthropic adapter.
- [ ] Gemini adapter.
- [ ] Ollama adapter.
- [ ] Real connection test and real minimal generation test.
- [ ] Model profiles, custom model IDs, endpoint normalization, request cancellation, timeouts, streaming where supported.
- [ ] Provider-specific capability declarations and redacted error handling.

**Exit gate:** unit tests cover every adapter; manual live tests documented for at least NVIDIA/OpenRouter and one other provider.

## Stage 4 — Chat-driven app building

- [ ] Project-aware build chat with conversation context.
- [ ] Planning summary and list of proposed file changes.
- [ ] Generate structured multi-file patch proposals; do not write directly to disk from model output.
- [ ] Diff review with Apply / Reject.
- [ ] Preserve manifests, lockfiles, secrets, and unrelated files unless the user explicitly approves the change.
- [ ] Checkpoint before apply; restore/undo after apply.
- [ ] Handle malformed or incomplete output without modifying the project.

**Exit gate:** a user can request a multi-file feature, inspect the diff, apply/reject it, and recover the previous state.

## Stage 5 — Preview and verification

- [ ] Sandboxed embedded preview for supported web projects.
- [ ] Console/runtime error reporting and reload.
- [ ] Explicitly approved build/test/lint execution with actual exit codes and logs.
- [ ] Cancel long-running tasks and clean up child processes.
- [ ] Distinguish generated/applied/previewed/tested/verified statuses.
- [ ] Project-specific detection for supported runtimes; unsupported projects receive a clear explanation.

**Exit gate:** create a sample app by chat, preview it, run a real check, and demonstrate error recovery.

## Stage 6 — Generative media capabilities

- [ ] Capability-driven image generation with actual image-capable providers.
- [ ] Video generation only through a real configured video API; report asynchronous job state.
- [ ] Audio generation only through a real audio-capable API/runtime.
- [ ] 3D generation distinguishes real exported assets from decorative canvas simulations.
- [ ] Save generated artifacts into the project with provenance metadata and explicit user action.
- [ ] Remove placeholder outputs and unsupported claims.

**Exit gate:** each shipped modality has a successful integration test or documented live test and truthful capability gating.

## Stage 7 — Production hardening

- [ ] Security audit of Rust commands, path handling, shell execution, secrets, CSP, preview, and dependency installation.
- [ ] Automated regression suite and macOS Apple Silicon packaging.
- [ ] Smoke test the actual packaged app, not just the web build.
- [ ] Test upgrades and settings migration without revealing or losing secrets.
- [ ] Verify DMG structure, app launch, and signature status.
- [ ] Add diagnostics/exportable support bundle with secrets redacted.
- [ ] Document actual support matrix, installation, known limits, and recovery.

**Exit gate:** all release acceptance criteria in PRODUCT_SPEC.md pass.

## Working rules

- One coherent change-set per milestone; avoid serial symptom patches.
- Audit all callers before changing a shared interface.
- Run relevant tests after each architectural change, then the full gate before merging.
- If CI fails, fix the root cause and rerun; do not add a later patch that masks the original failure.
- Never call a feature complete without evidence.
