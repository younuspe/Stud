# Supru Desktop — Deep Audit and Unified Product Plan

Audit date: 2026-10-10  
Repository: `younuspe/Stud`  
Audited branch: `fix/functional-implementation-audit`  
Scope: installable macOS desktop app, provider routing, chat-driven app/code building, project files, and shared workspace behavior.

## Executive decision

**Keep the existing Tauri + Rust + React desktop app. Do not migrate to a browser-only app or start over from another repository.** The current repository already has a Tauri application shell, native Rust commands, an editor, Generative Studio, a persistent floating chat pill, terminal, and Hunter. The right work is to consolidate their shared state and execution paths—not to rebuild them as separate apps.

The latest observed macOS workflow, run [#136](https://github.com/younuspe/Stud/actions/runs/38020710574), passed. Earlier run [#122](https://github.com/younuspe/Stud/actions/runs/38016841558) failed with a TypeScript provider-type error; later runs #123 and #136 passed. A passing build is necessary, but it does not prove all providers, secrets, file workflows, or chat-driven changes behave correctly at runtime.

## Verified current architecture

- The desktop entry point is Tauri 2 with Rust commands in `src/lib.rs`, React UI from `src/main.tsx`, and a root `tauri.conf.json`.
- The Rust layer already provides native model chat, provider connection testing, image generation, workspace folder selection, and bounded file list/read/write operations.
- OpenAI-compatible endpoint normalization already covers base URLs and full `/chat/completions` URLs; the Rust unit tests cover common OpenRouter/NVIDIA URL forms.
- `FloatingChatPill` has a Build mode. In the current app it routes a prompt into Code Copilot, and Code Copilot can return a proposed complete file for review.
- Code Editor, Generative Studio, Terminal, and Hunter are separate views inside the same desktop shell. The selected project root is shared at the app level, but individual views still keep separate buffers and some local state.
- The repository still contains browser/server fallback paths (`server.ts` and `fetch('/api/...')`) in addition to native Tauri paths. This is duplicate behavior, not the desired long-term desktop architecture.
- Provider metadata is inconsistently typed: `AIProviderType` only covers internal IDs, while custom model configuration uses vendor IDs and several components map these values with untyped `Record<string, string>` objects. This mismatch contributed to the earlier TS2322 failure.
- Provider keys are currently included in local UI configuration persisted through `localStorage` (`supru_ai_local_config_v1` and custom-model state). Password inputs mask entry, but localStorage is not an operating-system credential vault. Reinstalling the app normally does not erase its per-user application data, so saved settings can remain.
- The Rust project-file APIs canonicalize paths and enforce workspace boundaries, but the normal terminal command is an unrestricted shell command. The separate sandboxed command is fail-closed, yet the UI must deliberately choose it for operations that require isolation.
- The discovered repository tree contains Rust URL unit tests but no obvious TypeScript component/provider regression test suite. The CI workflow checks TypeScript, Rust tests, frontend build, DMG packaging, and a packaged-process smoke test; it does not perform a live authenticated provider test.

## Main risks to fix before adding more features

### P0 — One typed provider contract
Create one canonical provider registry and normalizer shared by Chat, Code Copilot, Generative Studio, and connection testing. Separate:
- user-facing provider/vendor ID,
- native runtime ID,
- endpoint URL,
- authentication method,
- model ID,
- supported capabilities.

Do not silently route an unknown provider to another vendor or invent a successful connection. Provider test should make a real, minimal generation request, and its result should clearly distinguish endpoint reachability from successful model generation.

### P0 — Secrets must not live in localStorage
Move provider credentials to native OS credential storage. Persist only non-secret model metadata in ordinary app settings. The UI should show a masked/partial key fingerprint and an explicit Replace/Remove action; it should never render the stored secret in plain text. A settings migration must preserve existing configurations without copying secrets into new plaintext stores.

### P0 — Desktop is the supported runtime
The installed product must use Tauri/Rust for provider requests, filesystem operations, and shell execution. Browser-only API fallbacks must not be treated as equivalent to the desktop runtime. Keep browser preview only where it is an intentional sandbox for generated web content. Remove or isolate duplicate server provider paths after every consumer is migrated and tested.

### P1 — One project/artifact state
Create one project context for root folder, open files, dirty buffers, selected artifact, chat context, preview, terminal cwd, and change history. Tabs are views of the same project, not independent project copies. Loading another folder must not overwrite an unrelated demo buffer or silently discard unsaved changes.

### P1 — Reviewable chat-driven development
The default Build-by-Chat flow should:
1. use the selected project and active file(s) as context;
2. ask the selected provider for a structured change proposal;
3. show a diff/preview and affected-file list;
4. require confirmation before writing real project files;
5. apply edits atomically through Rust;
6. run the relevant formatter/type checker/tests when available;
7. show actual output and keep the change marked unverified if checks were not run.

Generating code, displaying a preview, saving a file, and verifying an application are different statuses. Never present one as another.

### P1 — Safer tool execution
Route agent-initiated shell commands through an explicit permission gate and the fail-closed sandbox where applicable. Show command, working directory, affected paths, and expected effect before approval. Keep unrestricted interactive terminal use visibly distinct from autonomous agent execution.

### P2 — Xcode-like coding workspace
Make Code the primary development workbench:
- left: project navigator and search;
- center: tabbed editor with diagnostics and diff;
- right: AI Copilot/Inspector;
- bottom: terminal, problems, output, and test results;
- optional live preview for supported artifact types.
Keep the persistent Pill as a global natural-language command surface. Chat, Code, Generative Studio, and Hunter should be dockable tools connected to the same project rather than disconnected apps.

## Implementation order

1. **Stabilization and contracts:** record the baseline, type-check all entry points, add provider registry/types and regression tests, and verify each provider adapter against a real generation response.
2. **Credential migration:** introduce native secret storage and migrate existing keys without exposing them in logs or ordinary settings.
3. **Desktop-only privileged paths:** migrate remaining provider/file/shell consumers to native commands; prevent silent browser fallback; remove duplicate server routes only after usage is zero.
4. **Shared project state:** unify active project, file buffers, unsaved-change handling, selected artifact, and context sent to the Pill/Copilot/Studio/Hunter.
5. **Review-and-apply loop:** structured file-change proposals, diffs, confirmation, atomic writes, checkpoints, and real verification evidence.
6. **Xcode-like workbench:** improve navigator/editor/terminal/problems/preview layout after the shared state and change pipeline are stable.
7. **Release gates:** TypeScript checks, Rust tests, provider adapter tests with mock HTTP responses, packaged DMG smoke test, and a manual real-provider test (OpenRouter and NVIDIA) on the installed app.

## Acceptance checklist

- [ ] OpenRouter and NVIDIA base URLs and full chat-completion URLs both normalize correctly.
- [ ] Chat, Copilot, App Builder, and provider test all use the same provider adapter.
- [ ] A connection test only reports success after receiving non-empty generated text from the selected model.
- [ ] No API key is persisted in localStorage, logs, diagnostics, or project files.
- [ ] Reopening/reinstalling the app preserves intended settings without revealing a full key.
- [ ] Build-by-Chat uses the selected project and active source, shows a diff, and asks before writing project files.
- [ ] New files are created inside the selected workspace; path traversal and symlink escapes are rejected.
- [ ] Agent shell commands require explicit policy/approval and do not silently fall back to unrestricted execution.
- [ ] A generated preview is not described as a tested application unless checks actually ran.
- [ ] CI success is tied to the exact commit being released, and runtime provider verification is reported separately.

## Important implementation constraint

Do not combine the whole roadmap into a single unreviewable rewrite. Implement each phase as a coherent change set, run the checks once per set, and proceed only after its acceptance criteria pass. This is how we avoid the cycle of small patches followed by unrelated failures.
