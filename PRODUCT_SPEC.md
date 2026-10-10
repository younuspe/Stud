# Supru Generative Studio — Product Specification

## 1. Product goal

Build a high-quality, installable macOS desktop AI creation studio inspired by the workflow capabilities of Google AI Studio, not a browser-only clone. Users must be able to create and iteratively improve real applications by describing changes in chat, inspect resulting files and diffs, preview runnable output, test it, and export the project.

The product shell is a Tauri desktop application. The UI may use React/TypeScript, but desktop capabilities, project access, secret storage, process execution, and permission enforcement belong to the Rust/native layer. A development web server is for development only and must not be a runtime dependency of the packaged app.

## 2. Core user journey

1. Open Supru as an installed desktop application.
2. Choose or create a project folder.
3. Select a provider and model; test with a real request.
4. Describe a new application or a change in natural language.
5. See the agent's plan, target files, assumptions, and requested permissions.
6. Review a proposed multi-file patch before it changes the project.
7. Apply or reject the patch; preserve undo/checkpoints.
8. Preview the real project in an isolated local preview surface.
9. Run approved checks/builds and see actual output, exit codes, and errors.
10. Ask for follow-up changes in chat, compare diffs, retest, and export/share the project.

## 3. Product surfaces

- **Project workspace:** open/create project, file tree, search, file creation/rename/delete with confirmation, editor tabs, dirty state, save, undo/redo.
- **Build chat:** conversation history, attachments, project-aware context, model selection, streaming responses, cancel/retry, follow-up prompts, clear progress and errors.
- **Change review:** multi-file diff, per-file summary, apply/reject, conflict detection, checkpoint/rollback.
- **Preview:** embedded desktop preview, reload, viewport presets, console/runtime errors, safe origin isolation. Preview is not the app shell.
- **Run and verify:** project scripts, build/test/lint results, logs, process cancellation, explicit permission prompts.
- **Provider manager:** named model profiles, endpoint URL, model ID, key status without exposing secret values, real connection/model-generation tests, latency and error detail.
- **Generation tools:** text/code as the universal baseline; image, video, audio, and 3D only when a real compatible provider/runtime is implemented. Unsupported modes must say so clearly and must never show fabricated success or placeholder results.
- **History and recovery:** prompts, patch history, checkpoint restore, export/import, diagnostic bundle with secrets redacted.
- **Settings:** provider profiles, privacy, permissions, preview policy, appearance, diagnostics.

## 4. Provider support contract

Implement a provider adapter layer, not provider-specific conditionals scattered through UI components.

Minimum supported provider families:
- OpenAI API
- OpenAI-compatible Chat Completions APIs, including OpenRouter, NVIDIA NIM/Integrate, and compatible custom endpoints
- Anthropic Messages API
- Google Gemini API
- Ollama local API
- LM Studio OpenAI-compatible API

Provider requirements:
- Store endpoint base URL and model ID separately. Normalize base URLs and full endpoint URLs without duplicate path segments.
- Store secrets in OS-protected storage where supported; never persist raw keys in browser localStorage, logs, error messages, screenshots, or generated source.
- Never silently send one provider's key to another provider.
- Test connection with a real authenticated request. A model-list mismatch is a warning, not proof that generation will fail; offer a real generation test.
- Preserve upstream HTTP status and useful, redacted error details.
- Support cancellation, timeouts, streaming where available, token/context limits where known, and provider-specific request/response parsing.
- Report capabilities per model/provider. Do not imply every provider supports image, video, audio, tools, JSON mode, or streaming.
- Do not hardcode a short fixed model list as the only way to use a model. Permit user-entered model IDs and refreshable model catalogs.

## 5. Desktop and security requirements

- Package as a native Tauri desktop app for macOS Apple Silicon first.
- Rust is the authority for filesystem, process execution, secrets, permissions, and privileged operations.
- Keep Tauri commands typed and validate every argument at the Rust boundary.
- Apply least privilege. Deny by default for dangerous or unrecognized actions; permission priority is deny > ask > allow.
- Require explicit user approval for destructive filesystem changes, shell commands, network access outside provider calls, package installation, and project execution.
- Run generated project code in a restricted preview/process environment. Never execute generated code with the application's own privileges.
- Do not claim the OS sandbox is effective unless configured and tested on the target platform. Fail closed when isolation cannot be established.
- Use restrictive CSP and Tauri capabilities; avoid broad filesystem/network permissions.
- Show masked key status (configured/not configured), never a partially revealed key by default.
- No account/signing credentials are required to build an unsigned local macOS artifact. Clearly explain Gatekeeper limitations rather than pretending it is signed/notarized.

## 6. Reliability and truthful UI

- No fake provider success, fake generated media, fake test results, fabricated latency, or hardcoded success responses.
- Every test/build result must include the actual command/request, timestamp, status, and useful output.
- Preserve the current project if a model returns malformed or incomplete code.
- Validate generated patches before applying; do not overwrite project manifests or unrelated files without explicit approval.
- Distinguish **generated**, **applied**, **previewed**, **tested**, and **verified** states.
- Errors must be actionable and must not be swallowed.
- A successful CI build proves compilation/build checks only; it does not prove every provider or runtime flow works.

## 7. Performance and quality targets

- Start the desktop shell without downloading or bundling local LLM weights.
- Keep memory and CPU usage bounded; cancel superseded requests and dispose of preview/process resources.
- Stream text when the provider supports it and show progress for long operations.
- Avoid full-project prompts by using indexed, relevant context and explicit token budgets.
- Use deterministic parsing and structured patches where possible instead of fragile code-fence-only extraction.
- Maintain responsive UI while requests, indexing, builds, and previews run.
- Add regression tests for URL normalization, provider routing, secret isolation, malformed responses, patch application, and permissions.

## 8. Acceptance gates

A release candidate is not accepted until all applicable gates pass:
1. TypeScript and Rust checks pass on CI.
2. Provider adapter tests pass, including base URL, /v1, /models, and full /chat/completions URL cases.
3. Live provider tests are explicitly marked as optional/manual when secrets are unavailable; no CI test may fake live success.
4. Packaged Tauri app launches from the DMG on macOS.
5. A user can create a project, prompt a change, review/apply a patch, preview it, and run an approved check.
6. API keys survive app restart securely and remain masked; reinstalling the app does not expose their values.
7. Invalid model IDs, 401/403/404/429/5xx responses, timeouts, malformed JSON, and cancellation produce clear errors.
8. No unsupported generation mode reports success.
9. Security review confirms project path boundaries, shell permissions, preview isolation, and CSP.
10. Documentation matches actual implemented features and known limitations.
