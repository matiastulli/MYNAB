---
name: review
description: Run the reviewer agent on the current git diff. Use before merging any non-trivial feature.
allowed-tools:
  - Read
  - Bash
  - Grep
---

Get the current diff and delegate a full review to the reviewer agent.

1. Run `git diff HEAD` to get the full diff of uncommitted changes. If the working tree is clean, run `git diff HEAD~1` to review the last commit instead.

2. Pass the diff to the **reviewer agent** with the instruction:
   > "Review this diff against the checklist in your system prompt. Report all findings as Critical / Major / Minor with file:line references."

3. After the reviewer responds, summarise the findings and ask:
   > "Any of these blockers before we continue?"
