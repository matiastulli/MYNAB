# Service (FastAPI)

Patterns and checks: [docs/conventions/02-code-style.md](../../docs/conventions/02-code-style.md). Architecture: root [AGENTS.md](../../AGENTS.md).

## Data rules

- `CATEGORY_IDS` in `budget_transaction_category/constants.py` are hardcoded integers that must match DB rows. Adding a category needs a migration and a constants update; a mismatch is an FK violation at insert time.
- `files` stores the raw base64 content; deleting a file cascades to its `budget_entry` rows.
- `process_bank_statement()` drops rows matching `ignored_descriptions`: check a new parser doesn't silently skip valid transactions.

## Adding a bank parser

1. Add the bank and its file extension to `bank_formats` in `budget/router.py`.
2. Write `_process_<bank>_format(df, file_id, bank_name, currency)` in `budget/service.py`, returning `List[BudgetEntryCreate]`.
3. Add the dispatch case in `process_bank_statement()`.
4. Add regex patterns to `TRANSACTION_CATEGORIES` if needed.

Verify: column mapping, the bank's date format, amount sign mapped to `income` / `outcome`, rows with missing critical fields skipped (not crashed on), `reference_id` unique enough for duplicate detection, accented characters and comma decimals, the same file imported twice.
