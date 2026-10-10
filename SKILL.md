# Skill: Build and Maintain Supru Generative Studio

## Mission

Implement a reliable, high-end native desktop AI development studio. The app must let users build and modify real projects by chat, use a broad set of AI providers, review changes, preview results, and run verified checks. It is not a browser-only product, and the development server must not be required by the packaged app.

Read these files before any substantial task:
1. PRODUCT_SPEC.md — product contract and acceptance criteria.
2. ROADMAP.md — milestone order and exit gates.
3. CLAUDE.md — execution discipline and safety constraints.

## Required workflow

1. **Inspect first.** Read relevant files, their callers, types, tests, Tauri commands, and CI workflow. Check the current branch and rollback point before edits.
2. **Write a short plan.** Name affected interfaces/files, root cause, tests, risk, and rollback plan.
3. **Fix root causes.** Prefer one shared abstraction over repeated provider- or UI-specific patches. Do not cast away type errors or add defaults that hide missing configuration.
4. **Make the smallest coherent change-set.** Avoid unrelated redesigns, broad rewrites, or deleting working functionality without explicit rationale.
5. **Test at the right boundaries.** Run formatter/type checks, unit/regression tests, frontend build, Rust tests, and packaged-app checks as applicable.
6. **Inspect the diff.** Check accidental files, secrets, endpoint changes, permissions, generated artifacts, and consistency with the spec.
7. **Report evidence.** State exact commit/branch, commands and results, what was not tested, and remaining risks.

## Architecture rules

- Tauri + Rust is the native application boundary. React/TypeScript is the UI, not a substitute for native filesystem/process/secret control.
- Do not make the packaged app depend on localhost:3000, Express routes, or a running development server.
- Route provider requests through the shared provider adapter layer. UI components must not implement their own provider URL logic.
- Keep endpoint URL, model ID, provider identity, capabilities, and secret separate.
- Treat AIProviderType as the app's primary provider selection type, not as the complete list of every external model provider. Define explicit provider-ID types and use them consistently; do not pass arbitrary string values into narrow unions.
- Use the Rust boundary for secrets, project files, shell execution, permissions, and sandbox decisions.
- Models propose changes; the app validates and presents them. The model never directly writes files or runs shell commands.
- Use structured patches and path validation. Reject path traversal, unexpected file targets, invalid diffs, and writes outside the selected project.
- Never overwrite project manifests, lockfiles, key files, or unrelated files silently.
- Require user approval for shell commands, destructive actions, package installation, and risky network operations.
- Keep preview isolation separate from application authority; generated code must not inherit Supru's privileges.

## Provider rules

- Minimum families: OpenAI, generic OpenAI-compatible (including OpenRouter and NVIDIA), Anthropic, Gemini, Ollama, LM Studio, and custom compatible endpoints.
- Normalize base URLs, /v1, /models, and full /chat/completions forms centrally.
- Test actual request/response behavior; a model missing from /models is not by itself proof that the model cannot generate.
- Surface upstream status and sanitized error details. Do not replace errors with canned answers.
- Do not leak credentials across provider profiles or into localStorage, logs, source code, telemetry, or diagnostics.
- Declare capabilities. Never claim a provider supports image/video/audio/tool calling if it does not.
- Never fake a live test, latency, model availability, generated artifact, or successful build.

## Chat-driven development rules

- Preserve conversation context relevant to the project.
- Show the proposed plan and files before applying a multi-file change.
- Show diffs and let the user apply or reject them.
- Create a checkpoint before applying; support rollback.
- Do not claim code was applied when it was only generated.
- After apply, offer/run approved checks and show real results.
- If the response is malformed or incomplete, leave existing files untouched and provide a precise error.

## Prohibited shortcuts

- No unsafe casts to silence an interface mismatch without documenting and testing the actual contract.
- No duplicate provider maps or endpoint normalization scattered across components.
- No success response without a real request or command result.
- No fallback from native operation to a browser endpoint that exists only during development.
- No blanket permission grants to make a feature work.
- No declaring success based on TypeScript alone when the packaged app or provider flow is affected.
- No repeated single-line patching without inspecting the wider call graph.

## Completion report template

- **Outcome:** fixed / partially fixed / blocked.
- **Root cause:** concise, evidence-based explanation.
- **Changed:** files and purpose.
- **Verification:** exact checks and their actual results.
- **Not verified:** live APIs, packaged runtime, or other checks not performed.
- **Risks / next step:** only remaining blockers.
