# Supru Hunter — Engineering Guidelines & Protocols

## Foundational Principle
**Rust is the authority.** AI models are reasoning engines, not trusted system authorities.

No LLM is allowed to directly:
- write arbitrary files
- delete arbitrary files
- execute arbitrary shell commands
- access secrets
- access network without policy
- declare work complete without verification

```text
User -> Supru UI -> Rust Command -> Policy/Permission Gate -> Agent Orchestrator -> Model -> Structured Tool Request -> Rust Validation -> Tool Execution -> Evidence -> Verification -> State Update
```

## Permission Priority
Always enforce: `deny > ask > allow`. Unlisted actions are denied by default.

## Evidence-Backed Truth
Never state "Done", "Tests pass", "Build successful", or "Everything works" unless backed by actual exit code 0 evidence.

## Multi-Agent System
- Defined in `supru.agents.json`
- Roles: `lead`, `researcher`, `planner`, `architect`, `coder`, `tester`, `reviewer`, `judge`
- Minimize context per agent to prevent contamination

## Slash Commands
- `/run`, `/plan`, `/roadmap`, `/agents`, `/status`, `/pause`, `/resume`, `/approve`, `/reject`, `/cli`

## Visual Identity
- Page Background: `#0a0a0c`
- Pill Background: `#2b2b2d` (Border: `#3c3c3e`)
- Panel Background: `#161618` (Border: `#2a2a2c`)
- Accent: `#c49a6c`
- Terminal Green: `#4af626`
- Error: `#ff6b6b`
