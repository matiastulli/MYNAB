---
name: review
description: Review the current git diff for correctness, data isolation and convention drift. Use before opening any non-trivial PR.
allowed-tools:
  - Read
  - Bash
  - Grep
  - Agent
---

Review the working tree diff before it becomes a PR.

1. Get the diff:

```bash
git diff HEAD                 # uncommitted changes
git diff origin/main...HEAD   # if the tree is clean, review the whole branch
```

2. Delegate to the **`qa-tester`** agent with the diff and this instruction:

> "Review this diff against the checklist in your system prompt, plus `docs/conventions/00-naming.md` and `02-code-style.md`. Report findings as BLOCKER / MAJOR / MINOR with file:line references."

3. If the diff adds an endpoint, or touches auth, file upload, or secrets, also run the **`security-reviewer`** agent on it. Data isolation (`user_id` scoping on every `budget_entry`, `files` and `auth_user` query) is the highest-severity class in this codebase — a missing filter is a cross-user leak.

4. Summarise the findings and ask:

> "Any of these blockers before we continue?"

Fix every BLOCKER and MAJOR before handing off to `/pr`.

**Note:** Claude Code also ships a built-in `/code-review`. This skill is the MYNAB-specific pass that checks conventions and data isolation; the built-in is a general correctness review. They complement each other.
