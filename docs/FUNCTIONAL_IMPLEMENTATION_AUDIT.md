# Supru AI Functional Implementation Audit

Branch: `fix/functional-implementation-audit`
Baseline: `fix/macos-app-bundle-signature`

## Rule

This branch is for making the existing product actually work. UI presence, timers, sample data, hard-coded success messages, and successful packaging are not proof that a capability is implemented. Do not mark the application complete until each advertised action reaches its real backend, handles failure honestly, and preserves user data.

## Confirmed blockers from source inspection

### 1. Packaged desktop API lifecycle — critical
- `tauri.conf.json` loads `dist` in production and lists `server.ts` as a resource.
- `src/lib.rs` starts only the Tauri shell and plugins; it does not launch or embed the Express API server.
- The frontend calls relative endpoints such as `/api/chat/stream`, `/api/local-chat`, `/api/terminal/execute`, `/api/generate-image`, `/api/generate-video`, and `/api/github/*`.
- Therefore the packaged app has no demonstrated mechanism to serve these API routes. Bundling a TypeScript file as a resource does not execute it.
- Required implementation: move app-critical operations behind real Tauri commands or package and lifecycle-manage a real backend process; do not rely on a development server in a release build.

### 2. Hunter pipeline is simulated — critical
- `src/components/workbench/HeadlessAgentView.tsx` advances agents with `setTimeout`.
- `src/utils/hunterMasterData.ts` fabricates researcher/coder/tester/reviewer/judge outputs, including claims that tests passed and Z3 proved invariants.
- Terminal commands and judge evaluation in the view return hard-coded success strings and fabricated evidence.
- Auto-approval defaults to enabled, and the workflow sets the policy to ALLOW.
- Required implementation: agents must call configured models; tools must execute through an authoritative permission gate; commands must return captured stdout/stderr and actual exit codes; file edits must produce real diffs; evidence and judge verdicts must reference real execution artifacts. No fabricated pass/verified status.

### 3. Terminal authority and runtime — critical
- `src/components/workbench/TerminalView.tsx` posts commands to `/api/terminal/execute`.
- `server.ts` runs commands through Node `exec`, using a client-provided cwd and a 15-second timeout. This is not a persistent PTY and is not a safe substitute for the advertised Rust-authoritative desktop execution layer.
- Hunter's own terminal helper is a separate fake implementation.
- Required implementation: one real execution service, explicit workspace root, validated/canonicalized paths, command permission decisions, actual process output/exit code, cancellation and timeouts, audit logging, and consistent UI status.

### 4. Provider configuration and chat
- Initial provider is `gemini_cloud`, while local endpoint/model fields default to Ollama/`llama3`; these values can appear configured without a connection being established.
- `src/App.tsx` initializes connection status as online and API-key status as true before the status request completes; a failed status request still leaves the UI marked connected.
- Chat depends on the API server. The packaged desktop has no demonstrated server lifecycle.
- Required implementation: provider-specific adapters, truthful connection/model status, real API-key handling, actionable errors, cancellation, attachment handling, and persisted configuration. Never display connected unless a connection was checked successfully.

### 5. Media generation
- `server.ts` includes simulated video operations that return a stock sample video after a timer, not generated video.
- A helper named `generateSimulatedImageSvg` fabricates artwork; every image-generation path must be checked to ensure it never reports that artwork as provider-generated output.
- Required implementation: real provider operation, polling, downloadable result, explicit unsupported/quota/configuration errors, and no simulated media presented as generated content.

### 6. Authentication and sample state
- `src/App.tsx` seeds sample conversations and defaults settings to `isLoggedIn: true` with a hard-coded identity.
- Required implementation: either implement real authentication/account persistence or remove the false logged-in state and label local-only profile settings honestly. First launch should not make demo conversations look like the user's own history.

### 7. GitHub workspace
- `src/components/workbench/GitHubView.tsx` uses real API routes for repository and content lookup, but those routes depend on the unavailable packaged API lifecycle described above.
- Required implementation: real read/write operations with correct GitHub auth handling, permission/error reporting, and clear distinction between public reads and authenticated actions.

## Implementation order (do not run final tests yet)

1. Establish the production desktop backend boundary and lifecycle.
2. Make provider/chat and status checks work through that boundary.
3. Implement safe, real terminal/filesystem operations with permission and audit records.
4. Replace Hunter's timer-driven fake agent pipeline, mock commands, fabricated evidence, and automatic success verdicts with actual model/tool execution.
5. Connect editor/workspace file operations, preview, GitHub, and persistent settings to real services.
6. Replace simulated image/video results with real provider calls or honest unavailable states.
7. Remove false login/demo defaults and make unsupported features explicit.
8. Only after the advertised features are implemented: run build, type-check, unit/integration tests, and packaged-app functional checks. Report each capability as verified, blocked, or not implemented based on evidence.

## Verification standard

A feature counts as implemented only when the action is connected end-to-end, succeeds on a real operation, exposes errors without pretending success, and has a test or reproducible manual verification path. A green CI build or a window staying open is only packaging/startup evidence.
