# Sync Policy

The `.claude` folder is the source of truth for MYNAB role definitions and team workflow.

Codex-compatible adapters live under `.codex/`:

- `.claude/agents/engineer.md` -> `.codex/agents/engineer.md`
- `.claude/agents/qa-tester.md` -> `.codex/agents/qa-tester.md`
- `.claude/agents/security-reviewer.md` -> `.codex/agents/security-reviewer.md`
- `.claude/agents/project-manager.md` -> `.codex/agents/project-manager.md`
- `.claude/workflows/team-workflow.md` -> `.codex/workflows/team-workflow.md`
- `.claude/CLAUDE.md` plus all role adapters -> `.codex/AGENTS.md`

When a `.claude` agent or workflow changes, update the matching `.codex` adapter in the same change. Keep the domain rules and checks semantically identical, but translate Claude-specific mechanics into Codex mechanics.

## Codex Mapping

Codex does not load Claude custom agents directly. Use this mapping when the user explicitly asks for agent delegation:

| Claude role | Codex handling |
|---|---|
| `engineer` | Spawn a Codex `worker` with exclusive file/module ownership. |
| `qa-tester` | Spawn a Codex `explorer` for independent verification, or review locally if no delegation was requested. |
| `security-reviewer` | Spawn a Codex `explorer` for independent security review, or review locally if no delegation was requested. |
| `project-manager` | Plan locally by default; use an `explorer` only for bounded codebase discovery. |

## Workflow Source

The active Claude workflow file is `.claude/workflows/team-workflow.md`.

`.claude/CLAUDE.md` currently references `.claude/WORKFLOW.md`, but that path does not exist. Treat that as a stale reference unless the file is later created.
