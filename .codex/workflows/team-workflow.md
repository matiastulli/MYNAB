# MYNAB Codex Team Workflow

Source workflow: `.claude/workflows/team-workflow.md`.

This file adapts the Claude workflow to Codex's available agent tools. Keep it semantically aligned with the Claude workflow when that source changes.

## Agent Roles

| Claude role | Codex handling | Responsibility |
|---|---|---|
| Main Claude | Main Codex session | Coordination hub. Translates user intent into local work or delegated Codex tasks. |
| PM agent | Local planning by default | Breaks goals into scoped tasks with acceptance criteria. |
| Engineer agent | Codex `worker` | Implements bounded code tasks with exclusive file/module ownership. |
| QA agent | Codex `explorer` | Reviews correctness and edge cases without editing files. |
| Security reviewer | Codex `explorer` | Reviews auth, data isolation, input handling, uploads, and sensitive data exposure without editing files. |

## Standard Feature Workflow

```text
User
  -> describes goal to Main Codex
       -> Main Codex plans locally, or spawns bounded discovery only when useful
       -> Main Codex presents plan if user asked for planning or if scope needs confirmation
       -> Main Codex implements directly, or spawns a worker when the user explicitly asked for agents/delegation
       -> Main Codex integrates/reviews worker output
       -> Main Codex verifies locally, or spawns QA/security explorers when explicitly requested or when already working in delegated mode
       -> Main Codex reports what changed and what was verified
```

## Key Constraint

Agents cannot coordinate the whole project. All coordination flows through the main session.

Codex sub-agents should be spawned only when the user explicitly asks for agents, delegation, or parallel agent work. Depth, thoroughness, or investigation requests alone do not authorize spawning.

## What Goes In A PM-Style Plan

Include:

- The user's goal in plain language.
- Current app state relevant to the feature.
- Affected files/modules.
- Sequenced tasks with acceptance criteria.
- Open questions, risks, and decisions.
- Whether migrations, auth scoping, category IDs, URL state, or deploy ordering are involved.

## What Goes In An Engineer Worker Prompt

Include:

- One focused task, not the whole plan.
- Exclusive file/module ownership.
- Current behavior and target behavior.
- Acceptance criteria.
- Constraints such as migration requirements, auth scoping, schema patterns, and formatting helpers.
- A reminder not to revert changes made by others.
- A requirement to list changed files in the final response.

The worker prompt must be self-contained.

## When To Use Each Role

| Situation | Codex action |
|---|---|
| "I want a new feature" | Plan locally first; ask only if scope decisions are genuinely needed. |
| "Use agents to plan this" | Use PM adapter locally, and optionally explorer for bounded codebase discovery. |
| "Fix this bug" | Implement locally unless the user asks for delegation. |
| "Use the engineer agent" | Spawn a Codex `worker` with the engineer adapter. |
| "Have QA check it" | Spawn a Codex `explorer` with the QA adapter. |
| "Security review this" | Spawn a Codex `explorer` with the security adapter. |
| Small UI tweak | Main Codex handles inline. |

## Migration Rule

Any task that adds or modifies a database table must include this instruction in the engineer worker prompt:

```text
Generate an Alembic migration after editing `database.py`. Run `alembic revision --autogenerate -m '<description>'` from `app/service/`, review the generated file, then apply with `alembic upgrade head`.
```
