# MYNAB Team Workflow

This document describes how the user, main Claude, PM agent, and Engineer agent collaborate to deliver features.

---

## Agent roles

| Agent | File | Responsibility |
|---|---|---|
| **Main Claude** | *(this session)* | Coordination hub. The only one that can spawn other agents. Translates between user intent and agent tasks. |
| **PM agent** | `.claude/agents/project-manager.md` | Breaks goals into scoped, sequenced tasks with acceptance criteria. Does not write code. |
| **Engineer agent** | `.claude/agents/engineer.md` | Implements tasks. Writes backend (Python/FastAPI) and frontend (React) code, generates migrations. |

---

## Standard feature workflow

```
User
 └─► describes goal to Main Claude
       └─► Main Claude spawns PM agent
             └─► PM returns: plan, task list, open questions
       └─► Main Claude presents plan to User
             └─► User confirms / adjusts / answers open questions
       └─► Main Claude spawns Engineer agent with self-contained task prompt
             └─► Engineer implements: edits files, runs migrations, writes tests
       └─► Main Claude reports what changed and what's next
```

### Key constraint

**Agents cannot spawn each other.** The PM agent and Engineer agent only have file/search tools — not the `Agent` tool. All coordination flows through main Claude.

---

## What goes in a PM prompt

When spawning the PM agent, main Claude provides:
- The user's goal in plain language
- Current app state relevant to the feature (what exists, what's missing)
- Any decisions already made by the user
- A request for: plan, task list, open questions

## What goes in an Engineer prompt

When spawning the Engineer agent, main Claude provides:
- The specific task (not the whole plan — one focused unit of work)
- The file(s) to edit and their current behavior
- The target behavior and acceptance criteria
- Constraints (migration required? auth scoping? schema pattern to follow?)
- Any relevant code snippets or DB column names

The Engineer agent has no memory of prior conversations — the prompt must be 100% self-contained.

---

## When to use each agent

| Situation | Action |
|---|---|
| "I want a new feature" | Spawn PM first to scope it |
| "Fix this bug" | Spawn Engineer directly (no planning needed) |
| "What should we build next?" | Spawn PM for ideation |
| "Apply the plan" | Spawn Engineer with the PM's task |
| Small UI tweak (< 5 lines) | Main Claude handles inline, no agent needed |

---

## Migration rule

Any task that adds or modifies a DB table **must** include in the Engineer prompt:
> "Generate an Alembic migration after editing `database.py`. Run `alembic revision --autogenerate -m '<description>'` from `app/service/`, review the generated file, then apply with `alembic upgrade head`."
