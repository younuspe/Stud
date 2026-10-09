# Supru AI Studio — Unified Creative Workspace Architecture

Status: implementation target, not a claim that every capability is already implemented.
Branch: `fix/desktop-app-launch`

## Product goal

Build one connected desktop workspace that combines:
- **AI Studio** — model/provider selection, prompt experiments, system instructions, parameters, side-by-side runs, reusable prompt/model presets.
- **Photoshop-like editing** — non-destructive, selection-based editing of images, text, code, layouts, documents, and other project artifacts. Editing is not limited to images.
- **Framer-like web creation** — visual page composition, responsive breakpoints, component tree, live preview, and code ownership/export.
- **Figma-like design** — pages, frames, reusable components, tokens, constraints, layers, variants, and inspectable properties.
- **Canva-like composition** — templates, typography, media placement, grids, brand kits, multi-page documents, and export.
- **Supru Pill** — persistent control room for text and voice; it routes user intent to the active artifact/workspace and never silently steals focus or changes the current workspace.

These are capabilities in one product and one project—not five disconnected apps.

## Core interaction model

1. A project owns all artifacts, assets, prompts, versions, and evidence.
2. The central **Studio canvas** is the primary work surface. It changes editing tools based on the selected artifact, while the project and selection remain stable.
3. A single **Inspector** shows properties and contextual actions for the current selection.
4. A **Layers/Structure** panel represents the selected artifact: image layers, design frames, web DOM/components, code symbols/files, document blocks, audio/video tracks, or 3D objects.
5. **AI Studio** is a dock/panel available from the same workspace. Model experiments can use the selected artifact as context and return results as reviewable variants.
6. The **Pill** can ask questions, create/edit artifacts, run previews, and request tools. Every action targets the current project and selected artifact unless the user specifies otherwise.
7. All AI-proposed changes are previews/patches until applied. Preserve undo/redo and version history.
8. English is the default language for all written output. Voice recognition can be switched between English and Malayalam; Malayalam speech must still produce English output unless the user explicitly asks for Malayalam.

## Architectural boundary

The existing React UI is presentation and interaction only. Do not let a model directly access arbitrary files, shell, secrets, or network.

Target request path:

```text
Pill / Canvas / Inspector
  -> typed Intent + ProjectContext + Selection
  -> Rust command/API boundary
  -> permission and capability policy (deny > ask > allow)
  -> provider/model router OR deterministic artifact operation
  -> validated structured result / patch / tool request
  -> preview and user approval where required
  -> artifact adapter applies change
  -> verification + evidence + version checkpoint
  -> shared project state refreshes every connected panel
```

Rust is the authority for filesystem, shell/PTY, git, provider secrets, permissions, and privileged execution. React components must not invent successful results. A missing provider or unimplemented capability must show an explicit unavailable/error state.

## Shared project data model

Introduce a typed, versioned project state rather than passing unrelated strings between tabs:

- `Project`: id, name, root, settings, provider profiles, current selection.
- `Artifact`: id, kind, name, source, metadata, version, status.
- Artifact kinds: `image`, `video`, `audio`, `web-page`, `design-document`, `code-file`, `document`, `presentation`, `3d-scene`, `data`, `unknown`.
- `Asset`: id, media type, local URI, dimensions/duration when relevant, provenance, hash.
- `Selection`: artifact id plus optional node/layer/range/region.
- `Operation`: typed intent, target selection, input references, provider/tool, permissions, preview, status, evidence.
- `Version`: parent version, changed artifacts, diff/patch, timestamp, author/provider, verification.
- `ModelRun`: provider, model, system instruction, parameters, input artifact refs, output artifact refs, latency/tokens/cost, errors.
- `Evidence`: actual tool output, exit status, verification result, timestamps, and referenced files.

Do not duplicate the source artifact as unrelated copies in each tool. Different editors operate on the same artifact and create versions/variants with traceable provenance.

## Workspace modules

### 1. Control room / Pill
- Persistent across all views and window sizes.
- Text and voice input, attachments, stop/cancel, target indicator, and permission prompts.
- EN / മലയാളം speech-recognition selector; written responses in English by default.
- Commands route to the current selection or an explicitly named destination.
- Sending a prompt must not switch to Chat or lose the current tab.
- Show whether a request is queued, running, waiting for approval, completed with evidence, failed, or unsupported.

### 2. Model Lab
- Provider/model catalog with connection health, context limits, capabilities, and local/cloud labels.
- Editable system instruction, temperature, top-p, token limit, structured output, and reusable presets.
- Compare runs side by side using the same prompt/artifact inputs.
- Save experiments and attach outputs to the project as variants.
- Never fake provider output; display actual provider errors and metadata.

### 3. Universal Edit
- Selection-aware operations for any artifact type: transform, replace, annotate, restyle, refactor, reorganize, summarize, and generate variants.
- Adapters expose only supported operations for each artifact kind.
- Non-destructive operations create previews and reversible versions.
- No claim of pixel-level editing for non-image assets or semantic editing for files until that adapter exists.

### 4. Web Builder
- Visual canvas plus component/DOM tree, responsive breakpoints, styles, assets, and live preview.
- Changes must remain synchronized with generated HTML/CSS/JS or the chosen framework source.
- Keep a visible distinction between visual draft and source code; preserve round-trip changes where supported.

### 5. Design Studio
- Pages/frames, layers, components, variants, constraints, styles, variables/tokens, and inspector.
- AI-generated content is editable, selectable, and connected to the project asset graph.
- Use a structured design document; do not treat a screenshot as the only editable source.

### 6. Composition Studio
- Templates, multi-page layouts, text/image/video placement, grids, typography, brand assets, and export presets.
- Composition objects remain independently editable.
- Asset provenance and licenses/attribution should be retained where known.

### 7. Code / Agent / Orchestration
- Code editor, terminal, git, agents, and orchestration share project context and artifact references.
- Every tool call records its real command, result, duration, exit code, and evidence.
- Pipeline steps stop on failed prerequisites; no timer-based success, fake test results, or fake self-healing.
- A bug is not marked fixed until the actual change is applied and the relevant verification passes.

## Implementation sequence

### Phase 0 — Stabilize core and truthfulness
- Keep the desktop app as the product target.
- Disable automatic CI triggers during active repair; do not manually start workflows without explicit approval.
- Audit startup/backend lifecycle, IPC, provider configuration, and packaged-app resource paths.
- Remove fabricated successes and identify unavailable endpoints clearly.

### Phase 1 — Shared project/artifact spine
- Add typed project/artifact/selection/operation/version contracts.
- Create one project context store and a single command router.
- Route Pill events through typed commands with stable target context.
- Add operation state, error state, cancel semantics, and an evidence trail.

### Phase 2 — One connected Studio shell
- Create a unified Studio route with Canvas, Structure/Layers, Inspector, and AI Studio dock.
- Preserve current Generative Studio, Code Editor, and other existing views as capabilities during migration; avoid a destructive rewrite.
- Add explicit artifact open/create actions and pass artifact IDs, not just filenames or prompt strings, between panels.

### Phase 3 — Model Lab and creative artifact adapters
- Implement provider catalog/health and real model experiments first.
- Implement a minimal image adapter, then web-page/design-document/code/document adapters with honest capability declarations.
- Add preview, apply, undo/redo, and version history.

### Phase 4 — Web/design/composition tools
- Add structured design and web documents, layer/component trees, inspector, responsive preview, reusable templates, and export.
- Ensure editing in one panel updates the same underlying artifact in every other panel.

### Phase 5 — High-end orchestration
- Typed plans and tool schemas; permission gate; concurrent agents only when useful.
- Checkpoints, budgets, cancellation, retries with limits, deterministic verification, and evidence-backed completion.
- Expose planned, active, blocked, and completed agent roles accurately.

## Acceptance criteria

- A user can select an artifact and ask the Pill to modify it without losing the current workspace.
- Text and Malayalam voice input route to the same intent pipeline; written results default to English.
- The same artifact opens in supported editors without losing identity or version history.
- Model experiments can reference project artifacts and save outputs as variants.
- Unsupported operations explain what is missing and do not pretend to succeed.
- Every applied change has a preview/approval policy, a reversible version, and provenance.
- Real execution results—not hard-coded demo results—drive status, tests, and completion claims.
- The packaged desktop app can start and reach its backend without requiring a separate manually launched development server.
- No build or workflow is triggered automatically during this repair phase.


## Required File Explorer — first-class workspace panel

The desktop app must include a real, persistent **File Explorer**. It is a core feature, not an optional later enhancement and not a decorative/mock tree.

### Explorer UI
- A collapsible left sidebar with a project-root selector and expandable/collapsible directory tree.
- Show folders and files with names and appropriate icons; support refresh, expand/collapse, and loading/empty/error states.
- Context menu and toolbar actions: **New File**, **New Folder**, **Open**, **Rename**, **Duplicate** where safe, **Delete** with confirmation, **Copy Path**, and **Reveal in Finder** on macOS.
- Search/filter project files; show modified/unsaved indicators and unsaved-change confirmation before closing or switching files.
- Open selected files in the central editor/work surface without switching to Chat or losing the current Pill context.
- Keep explorer selection, open editor tabs, project root, and current artifact identity synchronized with the shared project state.
- Support common source, text, configuration, document, and asset files. Unknown formats must show a clear open/preview limitation, not silently fail.

### Functional and security requirements
- The tree must come from the actual project filesystem through the desktop backend, never from hard-coded sample entries.
- All filesystem operations must go through the Rust-authorized desktop boundary (or the explicitly configured secure backend bridge); the renderer must not gain unrestricted filesystem access.
- Enforce workspace scope, symlink/path traversal protection, permission checks, and clear errors.
- File creation/editing must write real files; rename/delete must affect the real filesystem only after policy checks and required confirmation.
- Editing must support save, dirty state, diff/review, and recoverable checkpoints/version history where applicable.
- Display actual operation results and errors. Do not show success when a backend call failed or the desktop backend is unavailable.

### Acceptance tests
1. Opening the installed desktop app shows the selected project’s real directory tree.
2. Expand/collapse, file selection, search, refresh, and open-in-editor work.
3. New file/folder, edit/save, rename, and delete perform real operations with correct confirmations and error handling.
4. The Pill can act on the selected file or selection without navigating away from the current workspace.
5. The explorer remains usable when no AI provider is configured; file browsing/editing must not depend on an LLM.
