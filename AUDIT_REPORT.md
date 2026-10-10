# Repository Audit — Supru Generative Studio

Audit date: 2026-10-10  
Audit branch: rebuild/native-generative-studio  
Base commit: 6bbb98c646840e45e0a7da405eeafc9f2b559251  
Scope: repository structure, provider contracts, native boundary, app-building flow, security configuration, and CI configuration. This is a static repository audit; no local build or live provider call was run by this audit.

## Executive summary

The latest successful workflow observed in the repository was run 172 on branch rebuild/native-coding-core at commit 6bbb98c646840e45e0a7da405eeafc9f2b559251. Its commit message is “Delete the obsolete nonfunctional Generative Studio prototype.” That proves the focused app-builder build passed on that commit; it does not prove the requested Generative Studio exists or works.

The new rebuild/native-generative-studio branch is intentionally based on that successful commit and adds the product specification, skill, roadmap, and Claude execution contract before feature implementation. No CI run has yet verified this new documentation-only branch.

## Findings

### P0 — Product scope is not implemented yet

**Evidence:** The base commit explicitly removed the previous Generative Studio prototype. Its App.tsx no longer imports SupruGenerativeStudioView. The remaining CodeEditorView contains a chat-driven app-builder flow.

**Impact:** The current successful build is not a high-end Generative Studio. It is a narrower desktop app builder. Treating that CI success as delivery of the requested product would be misleading.

**Required action:** Implement the product from PRODUCT_SPEC.md in milestone order. Restore media creation only through real, capability-aware integrations; do not restore the old prototype as-is.

### P1 — The prior provider type error indicates a shared-contract defect

**Evidence:** The user reported TS2322 at SupruGenerativeStudioView.tsx line 464: string is not assignable to AIProviderType. In the earlier code, the selected provider came from a resolved external-model profile, while AIProviderType represented only the primary app configuration values. The external model profiles have additional provider values such as openai, anthropic, deepseek, and groq.

**Impact:** The UI's primary-provider type and the runtime provider adapter ID were conflated. A local cast would hide the contract mismatch and risk incorrect routing.

**Required action:** Keep distinct explicit types for primary provider selection, external profile provider, and native adapter ID. Resolve through one typed registry and add compile-time and runtime tests. The new baseline no longer contains the deleted Generative Studio file, so the exact old line cannot be fixed in place without reintroducing the feature.

### P1 — Provider support exists at the text/chat layer, not across every generation mode

**Evidence:** src/lib.rs exposes chat_completion and test_provider_connection with provider-specific branches. The shared providerRegistry maps OpenAI, Anthropic, DeepSeek, Groq, Gemini, Ollama, LM Studio, and custom compatible profiles. The provider tests cover resolution and credential separation for OpenRouter, NVIDIA, OpenAI, Gemini, and Ollama.

**Impact:** Text/code compatibility is a plausible foundation, but it does not establish image/video/audio/3D parity. The old Generative Studio's image command was hardcoded to a Gemini image model and accepted a Gemini API key; the old motion mode explicitly reported that native video generation was not connected. Its world3D canvas was a visual simulation while displaying a “GPU-NATIVE BEVY/WGPU 120 FPS” label, which was not evidence of a real Bevy/WGPU renderer. Those behaviors must not be presented as real universal generation.

**Required action:** Model capabilities per provider and modality. Implement and test each real media adapter independently; hide or clearly disable unsupported modes.

### P1 — Build-by-chat currently lacks the full safe multi-file workflow

**Evidence:** CodeEditorView's app-builder path asks a model for complete source and updates editor content. Its preview uses an iframe-based sandbox. The current workflow is centered on one active/generated HTML file rather than a structured multi-file change proposal with a reviewable diff, checkpoint, conflict detection, and rollback.

**Impact:** This is enough for a basic prototype, not the requested AI Studio-like project-building loop for real projects.

**Required action:** Introduce structured patch proposals, file allowlists/path validation, diff review, explicit Apply/Reject, checkpoints, and approved build/test execution. Preserve project manifests and unrelated files.

### P1 — Secret storage must be verified and hardened

**Evidence:** App.tsx stores the primary provider configuration under a localStorage key. The native provider command accepts an API key passed from the UI. Cargo.toml does not currently declare a dedicated keychain/credential-store crate. The shared provider tests verify that one provider profile does not inherit another provider's key, but they do not prove OS-protected storage.

**Impact:** localStorage is not an appropriate authoritative store for long-lived provider secrets in a desktop app. An API key can also be accidentally included in UI state, error output, or diagnostics if every path is not audited.

**Required action:** Move secrets to OS-protected storage through the native layer, expose only masked/configured state to the UI, redact diagnostics, and add migration tests. Verify reinstall/upgrade behavior separately from key visibility.

### P1 — Native and development-server paths are still mixed in the codebase

**Evidence:** package.json includes an Express server and Tauri commands; the Tauri config bundles server.ts as a resource, while the native chat and filesystem paths use Tauri invoke. The workflow has separate server type-checking and native build steps.

**Impact:** A feature that works through an Express route in development may fail in the packaged desktop app if the packaged path does not start that server. This has been a source of inconsistent behavior in prior iterations.

**Required action:** For every feature, choose one production path. Prefer the Rust/native path for desktop capabilities and provider calls. Keep Express routes development-only unless there is a documented, tested packaged-server lifecycle.

### P1 — Desktop security policy is broader than ideal

**Evidence:** tauri.conf.json permits unsafe-inline and unsafe-eval for scripts and allows broad http:/https:/ws:/wss: connections. Cargo.toml includes Tauri shell and filesystem plugins. src/lib.rs includes a macOS sandboxed-command path that fails closed if sandbox-exec is unavailable, but the normal execute_terminal_command is a separate unrestricted shell command.

**Impact:** Broad CSP and powerful plugins enlarge the attack surface. A fail-closed sandboxed path does not make the unrestricted terminal path safe; callers must use the right command and permission gate.

**Required action:** Reduce CSP allowances where feasible, audit Tauri capabilities, ensure autonomous or model-triggered work can only use permission-gated sandboxed execution, and require explicit approval for normal shell execution and destructive operations.

### P2 — CI success needs clearer coverage boundaries

**Evidence:** The macOS workflow runs dependency installation, server/frontend type checks, provider registry tests, Rust URL tests, frontend build, Tauri DMG build, and a packaged-app startup smoke test. It does not perform authenticated live provider calls because no API secrets are supplied to the workflow. The smoke test checks that the packaged executable remains alive for a short startup window; it does not exercise a complete user journey.

**Impact:** CI can catch compile/package regressions, but cannot by itself prove a provider can generate or a user can build, preview, test, and recover a project.

**Required action:** Keep CI deterministic; add integration tests with mock servers for request/response behavior, and maintain a separate explicit manual live-provider checklist plus an end-to-end packaged-app checklist.

### P2 — Workflow configuration has maintenance issues

**Evidence:** The workflow on the base branch repeats rebuild/native-coding-core in its branch list. The workflow comment says push builds are limited to explicit Rust entry-point changes, but the path filter also includes frontend TS/TSX. It checks that the app starts but does not automatically exercise the UI.

**Impact:** This is not the cause of the reported TS2322, but the mismatch can confuse expectations about which commits trigger builds.

**Required action:** Remove duplicate branch entries, align comments with actual path filters, and use clear required gates for changes to frontend, provider registry, Rust commands, and packaging.

## Known failure from the prior workstream

The reported TypeScript failure is:
src/components/workbench/SupruGenerativeStudioView.tsx line 464: TS2322, Type string is not assignable to type AIProviderType.

Root-cause direction: the provider ID produced by the external model/provider resolver is wider than the primary configuration union. The correct fix belongs in the shared type/adapter contract, not a cast at the failing line. Because the latest successful baseline removed that prototype, reintroducing it should use the new typed provider registry rather than copying the old component wholesale.

## Verification status

- **Observed successful CI:** workflow run 172, branch rebuild/native-coding-core, commit 6bbb98c646840e45e0a7da405eeafc9f2b559251.
- **New branch CI:** not yet run for rebuild/native-generative-studio; its initial changes are product/engineering documentation.
- **Live provider requests in this audit:** not run.
- **Local build/test commands in this audit:** not run.
- **Packaged-app interaction test in this audit:** not run.

## Recommended sequence

1. Agree on the source-of-truth documents now present on this branch.
2. Define and test provider contracts first.
3. Implement secure native workspace operations and OS-protected key storage.
4. Implement chat planning and structured multi-file patches with review/checkpoint/rollback.
5. Implement isolated preview and real verification.
6. Add media modalities only when real integrations exist.
7. Run the full macOS workflow and verify a packaged end-to-end scenario before calling the milestone complete.
