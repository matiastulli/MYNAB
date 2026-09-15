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

1. Get today's date: run `date +%Y%m%d`
2. Slugify the argument (lowercase, spaces → hyphens)
3. Create `docs/plans/{date}-{slug}.md` with this template:

```
-----
Status: #TODO — 
-----

# {Title from $ARGUMENTS}

**Date:** {today YYYY-MM-DD}
**Scope:** 

## Context

## Tasks

## Acceptance criteria

## Reference
```

4. Add an entry to `plans` in `docs/plans/project-status.yaml`:
```yaml
  - file: docs/plans/{date}-{slug}.md
    slug: {slug}
    status: TODO
    started: "{today}"
    blocked_on: null
```

5. Report the file path created and confirm it's ready to fill in.
