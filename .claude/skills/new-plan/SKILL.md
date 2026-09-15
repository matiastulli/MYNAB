---
name: new-plan
description: Scaffold a new dated plan file in docs/plans/ with the correct format. Usage -> /new-plan short-slug-name
allowed-tools:
  - Read
  - Write
  - Bash
---

Create a new implementation plan for: **$ARGUMENTS**

Steps:

1. Get today's date: run `date +%Y-%m-%d`
2. Slugify the argument (lowercase, spaces → hyphens)
3. Create `docs/plans/{date}-{slug}.md` with this template:

```
-----
Status: #TODO — 
-----

# {Title from $ARGUMENTS}

**Date:** {today YYYY-MM-DD}
**Branch:** {type}/{slug}
**Scope:** service | client | db | docs | deploy

## Context

## Tasks

## Acceptance criteria

## Reference
```

4. Report the file path created and the branch name it maps to (`<type>/<slug>` — see [01-git-workflow.md](../../../docs/conventions/01-git-workflow.md)), then confirm it's ready to fill in.

The status banner in the file is the only record of plan state — there is no separate index to keep in sync. Change it later with `/update-status <slug> <STATUS> [note]`.
