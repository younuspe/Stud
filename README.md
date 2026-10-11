# Supru AI — Native macOS Desktop App

Supru AI is a **Tauri 2 desktop application** with a React/TypeScript interface and a Rust authority layer. The interface is rendered in the operating system's WebView; it is not intended to be used as a hosted browser-only app.

## Current capabilities

- Native desktop chat through the Rust provider bridge.
- OpenAI-compatible chat endpoints, including OpenRouter, NVIDIA NIM, OpenAI, DeepSeek, Groq, and compatible local servers such as LM Studio. Availability depends on the provider's API compatibility, model access, and valid credentials.
- Gemini and Anthropic native request formats.
- Ollama local chat.
- macOS Keychain storage for provider API keys.
- Workspace file browsing, reading, editing, and saving through Rust commands.
- Supru Code Copilot for chat-driven edits to the active file.
- Generative Studio App Builder for iterative, chat-based creation and modification of a self-contained HTML/CSS/JavaScript app, with a sandboxed preview.
- Generated Studio apps are retained in local app storage. With a project workspace selected, **Open source in editor** creates a uniquely named HTML file in that workspace; without a selected workspace, it opens a temporary editor tab.

## Important limitations

- The Studio App Builder currently generates a single self-contained HTML document, not a multi-file native macOS application.
- Generated code is previewed in a sandbox but is **not automatically covered by a project-specific test suite**. Review and test it before relying on it.
- Image generation currently uses the configured Gemini image-generation endpoint; selecting a different chat provider does not automatically switch the image-generation backend.
- The built-in “Offline Core” does not contain its own model runtime. Use Ollama or another configured provider for actual inference.
- The current secure API-key storage implementation is macOS Keychain-specific.

## Configure an AI provider

1. Open **Provider Settings** in the installed Supru AI app.
2. Add or select a model and enter its exact model ID.
3. For a generic OpenAI-compatible provider, enter its API base URL or full `/chat/completions` URL and its API key.
   - OpenRouter base URL: `https://openrouter.ai/api/v1`
   - NVIDIA NIM base URL: `https://integrate.api.nvidia.com/v1`
   - Example NVIDIA model ID: `nvidia/nemotron-3.5-lightning-30b-a3b`
4. Run the connection test, then send an actual chat prompt. A successful connection check alone does not guarantee every model ID is available to the account.

API keys are stored in macOS Keychain by the desktop app and are excluded from the persisted provider settings JSON.

## Build on macOS

Prerequisites: Node.js 22, Rust stable, and the macOS build tools/SDK required by Tauri.

```sh
npm ci --legacy-peer-deps
npm run lint:server
npm run lint
npm run test:providers
cargo test --locked
npm run build
npm run tauri:build -- --bundles dmg
```

The GitHub Actions workflow **macOS desktop build** runs these checks, builds an unsigned macOS DMG, verifies the packaged app's code signature, performs a short startup smoke test, and uploads the DMG as a workflow artifact.

## Repository workflow

The active development branch is `fix/functional-implementation-audit`. See [GitHub Actions](https://github.com/younuspe/Stud/actions) for build status and downloadable workflow artifacts.
