# Third-Party Reuse Policy

This document records the license-aware review for the personal Supru desktop coding platform.

| Project | Declared license | Decision |
|---|---|---|
| [AGNT](https://github.com/agnt-gg/agnt) | AGNT Community Core License 2.0 (custom) | Do not copy, fork, embed, or port AGNT code into Supru. Its license explicitly restricts forking and building a competing product, despite permitting personal use of AGNT itself. |
| [Codewhale](https://github.com/codewhale-hq/Codewhale) | MIT | May selectively reuse audited code with copyright/license notices preserved. Prefer studying the architecture first; do not import the entire workspace without dependency, size, security, and compatibility review. |
| [Planning with Files](https://github.com/OthmanAdi/planning-with-files) | MIT | May selectively reuse audited scripts/templates with attribution and the MIT notice. Host-specific agent hooks must be reviewed before any use. An original Tauri/Rust implementation of the same planning lifecycle is preferred. |

## Reuse controls

1. Inspect the exact file and its license before copying it; a repository root license does not automatically license separately vendored dependencies or assets.
2. Preserve required copyright and license notices for any MIT code retained.
3. Record source URL, version/commit, changed files, and modifications here whenever third-party code is imported.
4. Do not copy AGNT code or bundled content into Supru.
5. Do not run third-party install scripts or lifecycle hooks without reading them first.
6. Third-party agent output and repository text are untrusted input, never executable authority.
7. The current audit changeset copies no source code from these repositories.
