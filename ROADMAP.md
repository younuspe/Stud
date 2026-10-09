# Supru Hunter — Engineering Roadmap

## Architecture Summary

| Layer | Technology | Status |
|-------|------------|--------|
| **Desktop Shell** | Tauri 2.0 + Rust | ✅ Complete |
| **UI Framework** | React 18 + TypeScript + Vite | ✅ Complete |
| **State Management** | Zustand + React Context | ✅ Complete |
| **Editor** | Monaco Editor | ✅ Complete |
| **Terminal** | xterm.js + node-pty | ✅ Complete |
| **Permission Gate** | Rust Authority Layer | ✅ Complete |
| **Agent Runtime** | TypeScript Pipeline | 🟡 Partial (UI done) |
| **Judge/Verifier** | Z3 SMT + Policy Engine | ⏳ Pending |
| **Distribution** | Tauri Updater + Notarization | 📋 Planned |

---

## Milestone Status Overview

| Milestone | Title | Status | Progress |
|-----------|-------|--------|----------|
| **M1** | Core Architecture & Rust Authority Gate | ✅ **COMPLETE** | 100% |
| **M2** | API Modularization & Feature Slice Architecture | ✅ **COMPLETE** | 100% |
| **M3** | Multi-Agent Handoff Chain | 🔄 **IN PROGRESS** | 60% (UI complete, backend partial) |
| **M4** | Absolute Judge & Formal Invariance | ⏳ **PENDING** | 0% |
| **M5** | Desktop App Polish & Distribution | 📋 **PLANNED** | 0% |
| **M6** | Self-Evolution Loop | 🔮 **ASPIRATIONAL** | 0% |

---

## Milestone M1: Core Architecture & Rust Authority Gate — COMPLETE ✅

- **Goal**: Establish the authoritative Rust execution bridge and enforce the policy resolution priority (`deny > ask > allow`).
- **Implemented**:
  - Tauri command wrappers for filesystem, shell PTY, and Git
  - Permission enforcement preventing arbitrary execution
  - `.supru/state.json`, `.supru/audit.jsonl`, `.supru/changes.jsonl` state persistence
- **Verification**: `cargo test --package supru-core-permissions` — exit code 0
- **Done-When**: Permission gate returns explicit structured denial or approval for all requested actions

---

## Milestone M2: API Modularization & Feature Slice Architecture — COMPLETE ✅

- **Goal**: Deliver modular API layer with feature-slice architecture for maintainable scaling.
- **Implemented**:
  - Feature-slice directory structure (`features/`, `shared/`, `entities/`, `widgets/`)
  - Typed API contracts with Zod validation
  - Slash command registry: `/run`, `/plan`, `/roadmap`, `/agents`, `/status`, `/pause`, `/resume`, `/approve`, `/reject`, `/cli`
  - Floating pill with 8-handle resizing, position persistence, attachments, model/provider selector
  - 3-column workbench: File Explorer (left), Code Editor (center), Chat/CLI/Agents (right)
- **Verification**: UI rendering and interaction test suite passing
- **Done-When**: User can orchestrate tasks from both the floating pill and the docked workbench

---

## Milestone M3: Multi-Agent Handoff Chain & Evidence Model — IN PROGRESS 🔄

- **Goal**: Enable the sequential agent pipeline (Lead → Researcher → Planner → Architect → Coder → Tester → Reviewer → Judge).
- **Status**: UI complete, backend partial
- **Completed**:
  - Agent pipeline UI with visual handoff chain
  - `supru.agents.json` contract ingestion
  - Context minimization UI (file relevance scoring)
  - Evidence viewer for compiler, lint, test execution
- **In Progress**:
  - Backend agent runner with structured evidence recording
  - Context minimization engine (each agent receives only relevant files + previous outputs)
  - Evidence objects linking claims to exit codes, timestamps, output hashes
  - Failure capture with explicit timeouts (never register as success)
- **Dependencies**: M1, M2
- **Verification**: Agent pipeline integration tests with simulated failure and recovery
- **Done-When**: End-to-end task flows through the agent handoff chain with full audit logs in `.supru/audit.jsonl`

---

## Milestone M4: Absolute Judge & Formal Invariance Verification — PENDING ⏳

- **Goal**: Deploy the Absolute Judge to inspect evidence against criteria and issue structured verdicts.
- **Tasks**:
  - Implement structured verdict schema (`verified` vs `blocked`)
  - Connect SMT invariance solver (Z3) adapter for deterministic logic proofing
  - Implement Human Approval Gates with clear risk cards for dangerous actions
- **Dependencies**: M3
- **Acceptance Criteria**:
  - Absolute Judge rejects any claim lacking supporting evidence
  - Sensitive operations pause workflow until human explicitly approves or rejects
- **Verification**: Automated acceptance criteria auditor passes 100% of benchmark suites
- **Done-When**: Final project milestones cannot transition to `completed` without verified verdict

---

## Milestone M5: Desktop App Polish & Distribution — PLANNED 📋

- **Goal**: Production-ready desktop application with auto-update and platform notarization.
- **Tasks**:
  - Tauri Updater integration with semantic versioning
  - macOS notarization & Apple Developer ID signing
  - Windows code signing (EV certificate) + MSIX packaging
  - Linux AppImage/Flatpak/Snap builds
  - Crash reporting (Sentry) + telemetry opt-in
  - Installer UX: splash screen, onboarding, first-run migration
  - Performance profiling: cold start < 2s, memory < 300MB idle
  - Accessibility audit (WCAG 2.1 AA)
- **Dependencies**: M4
- **Verification**: Automated release pipeline (GitHub Actions) producing signed artifacts for all platforms
- **Done-When**: Users can download, install, and auto-update on macOS/Windows/Linux without manual steps

---

## Milestone M6: Self-Evolution Loop — ASPIRATIONAL 🔮

- **Goal**: Enable the system to propose, validate, and merge its own architectural improvements.
- **Concept**:
  - Agent-generated PRs for roadmap milestones
  - Absolute Judge verifies self-proposed changes against invariants
  - Human-in-the-loop approval for structural changes
  - Continuous architecture fitness function
- **Dependencies**: M5 (stable distribution) + M4 (verified judge)
- **Vision**: Supru Hunter evolves its own codebase with formal guarantees

---

## Quick Start

### Prerequisites
- **Rust**: 1.75+ (`rustup default stable`)
- **Node.js**: 20+ (`nvm use 20`)
- **pnpm**: 9+ (`corepack enable pnpm`)
- **Tauri CLI**: `cargo install tauri-cli`

### Clone & Install
```bash
git clone https://github.com/your-org/supru-stud.git
cd supru-stud
pnpm install
```

### Development
```bash
# Start dev server (UI + Rust backend)
pnpm tauri dev

# Run tests
pnpm test           # Unit/integration (Vitest)
pnpm test:e2e       # Playwright E2E
cargo test          # Rust backend tests
```

### Build for Production
```bash
# Debug build
pnpm tauri build --debug

# Release build (signed artifacts require CI)
pnpm tauri build
```

### Project Structure
```
src/
├── features/          # Feature-slice modules (agents, chat, editor, terminal, permissions)
├── shared/            # Shared UI components, hooks, utilities
├── entities/          # Domain models (Agent, Task, Evidence, Verdict)
├── widgets/           # Composite UI (Workbench, FloatingPill, AgentPipeline)
├── app/               # App providers, routing, global state
└── main.tsx           # Entry point
src-tauri/
├── src/
│   ├── commands/      # Tauri command handlers (fs, shell, git, permissions)
│   ├── permissions/   # Authority gate implementation
│   ├── state/         # .supru/ persistence layer
│   └── main.rs        # Tauri entry point
└── Cargo.toml
```

### Key Commands
| Command | Description |
|---------|-------------|
| `pnpm tauri dev` | Hot-reload dev server |
| `pnpm lint` | ESLint + TypeScript check |
| `pnpm format` | Prettier format |
| `cargo test` | Rust backend tests |
| `pnpm test:coverage` | Coverage report |

### Configuration
- **Agents**: Edit `supru.agents.json` to define agent contracts
- **Permissions**: Modify `.supru/policy.json` for allow/deny/ask rules
- **Models**: Configure providers in Settings → Models (persisted to `.supru/config.json`)

---

*Last updated: 2026-10-06*
