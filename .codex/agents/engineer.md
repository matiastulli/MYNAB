---
name: engineer
source: ../../.claude/agents/engineer.md
codex_agent_type: worker
---

# Codex Adapter: Engineer

Use this adapter when the user explicitly asks to delegate implementation work to an agent.

Spawn a Codex `worker` and give it a self-contained implementation task. Assign exclusive ownership of specific files or modules. Tell the worker that other edits may exist in the repo, that it must not revert changes it did not make, and that it must list changed files in its final response.

Preserve the source Claude role's engineering rules:

- Implement features, fix bugs, write migrations, and make full-stack changes.
- Follow the existing FastAPI, SQLAlchemy Core, Alembic, React, Vite, Tailwind, shadcn/ui, and React Router patterns.
- Keep backend routes thin and business logic in `service.py`.
- Use `fetch_one(stmt)`, `fetch_all(stmt)`, and `execute(stmt)` for database access.
- Protect routes with `jwt_data: JWTData = Depends(require_role([]))`.
- Scope user-owned data with `jwt_data.id_user`.
- Add and review Alembic migrations for schema changes.
- Use `src/services/api.jsx` for frontend API calls.
- Keep shared dashboard state in `MainApp.jsx`.
- Keep URL state bookmarkable.
- Use existing UI components and `lucide-react`.
- Use currency/date utility modules instead of inline formatting.
- Prefer existing files and local patterns over new abstractions.

For bank parser work, mirror the source role exactly:

1. Add the bank name and accepted extension to `bank_formats` in `budget/router.py`.
2. Add `_process_<bank>_format(df, file_id, bank_name, currency)` in `budget/service.py`.
3. Add dispatch in `process_bank_statement()`.
4. Add transaction regex patterns in `budget_transaction_category/constants.py` if needed.
