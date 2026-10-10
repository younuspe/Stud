# Supru Generative Studio — Claude Code Instructions

## Source-of-truth order

1. PRODUCT_SPEC.md defines the user-visible product contract and acceptance criteria.
2. SKILL.md defines mandatory engineering behavior and architectural constraints.
3. ROADMAP.md defines milestone sequence and exit gates.
4. This file defines how Claude should execute work in this repository.
5. The user's latest explicit request defines the immediate task, provided it does not weaken security or contradict the product's core desktop requirement.

If documents conflict, stop and report the conflict instead of guessing. Update the source documents when scope changes; do not let implementation drift silently.

## Product identity

Build an installable native desktop AI development studio inspired by Google AI Studio's chat-driven building workflow. Do not turn the product into a browser-only application. Tauri is the application shell; Rust owns privileged operations; React/TypeScript renders the interface. The packaged app must not depend on an Express development server.

## Mandatory execution protocol

Before changing code:
1. Confirm the branch and latest commit.
2. Read the relevant files, shared types, all call sites, tests, and workflow.
3. State the root cause and the smallest coherent fix.
4. Identify regression tests and rollback risks.
5. If the task spans architecture or several files, update the roadmap/spec first.

After changing code:
1. Inspect the full diff.
2. Run applicable TypeScript checks, provider tests, Rust tests, frontend build, and packaged desktop checks.
3. Read CI logs; do not infer success from a commit existing or a workflow starting.
4. Report exact evidence and explicitly list checks not performed.

## Engineering boundaries

- Rust is authoritative for project filesystem access, process execution, permissions, secret storage, and sandbox decisions.
- The model may propose a plan or patch; it must not directly mutate files or execute commands.
- Use typed contracts shared by UI, provider adapters, and Rust commands. Do not silence type errors with arbitrary casts.
- Use one shared provider registry and centralized URL normalization. Do not implement provider routing independently in each screen.
- Preserve the user's project and settings on malformed model output, failed requests, or rejected patches.
- Review multi-file diffs before applying; checkpoint before writes; support rollback.
- Require explicit approval for destructive changes, shell commands, package installation, and project execution.
- Validate all project-relative paths and reject traversal.
- Keep generated code isolated from the app's privileges. Fail closed if required sandboxing is unavailable.
- Never expose API keys in UI, localStorage, logs, errors, generated files, or diagnostic bundles. Show only configured/not configured.
- Do not report fake provider success, fake latency, fake generation, or fabricated tests.
- Distinguish generated, applied, previewed, tested, and verified.

## Provider baseline

Support OpenAI, OpenAI-compatible APIs (including OpenRouter and NVIDIA), Anthropic, Gemini, Ollama, LM Studio, and custom compatible endpoints. Provider capability differences must be explicit. Text/code is the baseline; image, video, audio, and 3D features must use real implementations and must not pretend to work on unsupported providers.

## Chat task format

For substantial work, first summarize:
- goal and acceptance criteria
- observed root cause and evidence
- files/interfaces involved
- proposed cohesive change-set
- tests and rollback

Then implement without asking the user to run terminal commands when repository tools can make the change directly. Do not ask repetitive questions when requirements are already explicit.

## Completion report

Always state:
- outcome and commit(s)
- root cause fixed
- tests/checks with actual status
- live-provider/package runtime checks not performed
- remaining risks and the next milestone

Never claim “done”, “verified”, or “works” without corresponding evidence.
