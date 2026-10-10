# Supru Generative Studio

Supru Generative Studio is being rebuilt as an installable Tauri desktop AI development studio for macOS Apple Silicon. Its goal is to let users create and improve real applications through chat, review multi-file changes, preview projects, and run verified checks with a choice of AI providers.

## Product documents

- [Product specification](PRODUCT_SPEC.md) — required behavior, architecture, provider support, security, and release acceptance criteria.
- [Engineering skill](SKILL.md) — mandatory workflow and implementation constraints for coding agents.
- [Roadmap](ROADMAP.md) — milestone order and evidence-based exit gates.
- [Claude instructions](CLAUDE.md) — execution protocol for Claude Code.

## Current status

This branch is the architecture and rebuild workstream. The documents define the target; they do not mean all features are already implemented. Check GitHub Actions and the actual packaged application before treating any capability as complete.

## Architecture direction

- Native desktop shell: Tauri.
- Privileged operations and security boundary: Rust.
- UI and editor: React/TypeScript.
- Provider layer: OpenAI, OpenAI-compatible endpoints (including OpenRouter and NVIDIA), Anthropic, Gemini, Ollama, LM Studio, and custom compatible endpoints.
- Chat-driven building: plan, propose a patch, review diffs, apply/reject, preview, test, and roll back.
- No fake provider success, fabricated test results, or browser-only runtime dependency in the packaged app.

## Development

Prerequisites: Node.js 22, Rust stable, and the macOS development tools required by Tauri.

Install dependencies using the repository lockfile:

```sh
npm ci --legacy-peer-deps
```

Run the relevant checks:

```sh
npm run lint
npm run lint:server
npm run test:providers
cargo test --locked
npm run build
```

Run the desktop app in development with:

```sh
npm run tauri:dev
```

The packaged app and provider flows still require their own verification; passing a frontend build alone is not release proof.
