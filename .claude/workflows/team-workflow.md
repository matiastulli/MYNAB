# MYNAB Team Workflow

This document describes how the user, main Claude, PM agent, Architect agent, and Engineer agent collaborate to deliver features.

---

## Agent roles

| Agent | File | Responsibility |
|---|---|---|
| **Main Claude** | *(this session)* | Coordination hub. The only one that can spawn other agents. Translates between user intent and agent tasks. |
| **PM agent** | `.claude/agents/project-manager.md` | Breaks goals into scoped, sequenced tasks with acceptance criteria. Does not write code. |
| **Architect agent** | `.claude/agents/architect.md` | Resolves technical design decisions before implementation. Produces a design document covering DB schema, API contracts, component boundaries, and trade-offs. Does not write production code. |
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
       └─► [if cross-cutting concern] Main Claude spawns Architect agent
             └─► Architect returns: design doc (schema, API, components, trade-offs)
       └─► Main Claude spawns Engineer agent with self-contained task prompt
             └─► Engineer implements: edits files, runs migrations, writes tests
       └─► Main Claude reports what changed and what's next
```

### Key constraint

**Agents cannot spawn each other.** The PM, Architect, and Engineer agents only have file/search tools — not the `Agent` tool. All coordination flows through main Claude.

---

## What goes in a PM prompt

When spawning the PM agent, main Claude provides:
- The user's goal in plain language
- Current app state relevant to the feature (what exists, what's missing)
- Any decisions already made by the user
- A request for: plan, task list, open questions

## What goes in an Architect prompt

When spawning the Architect agent, main Claude provides:
- The feature goal and scope from the PM plan
- Which layers are affected (DB, backend, frontend, or all)
- Specific design questions that need a decision before coding starts
- A request for: design doc with schema changes, API contracts, component structure, and trade-offs

Invoke the Architect when the feature touches multiple layers, introduces a new domain/table, or when the right technical approach is genuinely unclear. Skip for small, contained tasks.

## What goes in an Engineer prompt

When spawning the Engineer agent, main Claude provides:
- The specific task (not the whole plan — one focused unit of work)
- The file(s) to edit and their current behavior
- The target behavior and acceptance criteria
- The Architect's design doc (if one was produced)
- Constraints (migration required? auth scoping? schema pattern to follow?)
- Any relevant code snippets or DB column names

The Engineer agent has no memory of prior conversations — the prompt must be 100% self-contained.

---

## When to use each agent

| Situation | Action |
|---|---|
| "I want a new feature" | Spawn PM first to scope it |
| "Feature touches DB + backend + frontend" | Spawn Architect after PM, before Engineer |
| "Fix this bug" | Spawn Engineer directly (no planning needed) |
| "What should we build next?" | Spawn PM for ideation |
| "Apply the plan" | Spawn Engineer with the PM's task (and Architect's doc if applicable) |
| Small UI tweak (< 5 lines) | Main Claude handles inline, no agent needed |

---

## Migration rule

Any task that adds or modifies a DB table **must** include in the Engineer prompt:
> "Generate an Alembic migration after editing `database.py`. Run `alembic revision --autogenerate -m '<description>'` from `app/service/`, review the generated file, then apply with `alembic upgrade head`."
