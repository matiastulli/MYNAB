import unittest
import os
from datetime import date, datetime
from unittest.mock import AsyncMock, patch

import pandas as pd

os.environ.setdefault("ENV_JWT_ALG", "HS256")
os.environ.setdefault("ENV_JWT_SECRET", "test-secret")
os.environ.setdefault("ENV_DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test")
os.environ.setdefault("ENV_CORS_ORIGINS", '["http://localhost:5173"]')
os.environ.setdefault("ENV_CORS_HEADERS", '["Content-Type", "Authorization"]')

from src.budget import service
from src.budget.utils import identify_transaction_category
from src.budget_transaction_category.constants import CATEGORY_IDS, TRANSACTION_CATEGORIES


class BudgetServiceAsyncTests(unittest.IsolatedAsyncioTestCase):
    async def test_existing_reference_ids_are_scoped_by_user(self):
        with patch.object(
            service,
            "fetch_all",
            new=AsyncMock(return_value=[{"reference_id": "same-bank-ref"}]),
        ) as fetch_all:
            result = await service._get_existing_reference_ids(42, ["same-bank-ref", "new-ref"])

        self.assertEqual(result, {"same-bank-ref"})

        stmt = fetch_all.await_args.args[0]
        compiled = str(stmt.compile(compile_kwargs={"literal_binds": True}))

        self.assertIn("budget_entry.user_id = 42", compiled)
        self.assertIn("budget_entry.reference_id IN ('same-bank-ref', 'new-ref')", compiled)

    async def test_empty_reference_ids_skip_database_query(self):
        with patch.object(service, "fetch_all", new=AsyncMock()) as fetch_all:
            result = await service._get_existing_reference_ids(42, [])

        self.assertEqual(result, set())
        fetch_all.assert_not_awaited()

    async def test_list_files_excludes_file_base64_and_scopes_by_user_and_currency(self):
        file_row = {
            "id": 7,
            "user_id": 42,
            "file_name": "statement.csv",
            "created_at": datetime(2026, 1, 1, 12, 0),
            "updated_at": datetime(2026, 1, 1, 12, 0),
        }

        with (
            patch.object(service, "fetch_one", new=AsyncMock(return_value={"count_1": 1})) as fetch_one,
            patch.object(service, "fetch_all", new=AsyncMock(return_value=[file_row])) as fetch_all,
        ):
            result = await service.list_files(user_id=42, limit=25, offset=0, currency="ARS")

        self.assertEqual(result["data"], [file_row])
        self.assertNotIn("file_base64", result["data"][0])
        self.assertEqual(result["metadata"], {"total_count": 1, "limit": 25, "offset": 0})

        count_stmt = fetch_one.await_args.args[0]
        data_stmt = fetch_all.await_args.args[0]
        compiled_count = str(count_stmt.compile(compile_kwargs={"literal_binds": True}))
        compiled_data = str(data_stmt.compile(compile_kwargs={"literal_binds": True}))

        self.assertIn("files.user_id = 42", compiled_count)
        self.assertIn("files.currency = 'ARS'", compiled_count)
        self.assertIn("files.user_id = 42", compiled_data)
        self.assertIn("files.currency = 'ARS'", compiled_data)
        self.assertNotIn("file_base64", compiled_data)


class BudgetParserTests(unittest.TestCase):
    def test_icbc_parser_normalizes_income_and_outcome_rows(self):
        df = pd.DataFrame(
            [
                ["06/01/26", "Salary", "", "1000.50", "REF-1"],
                ["06/02/26", "Groceries", "42.25", "", "REF-2"],
            ]
        )

        entries = service._process_icbc_format(df, file_id=10, bank_name="ICBC", currency="ARS")

        self.assertEqual(len(entries), 2)
        self.assertEqual(entries[0].reference_id, "REF-1")
        self.assertEqual(entries[0].type, "income")
        self.assertEqual(entries[0].amount, 1000.50)
        self.assertEqual(entries[0].date, date(2026, 6, 1))
        self.assertEqual(entries[0].file_id, 10)

        self.assertEqual(entries[1].reference_id, "REF-2")
        self.assertEqual(entries[1].type, "outcome")
        self.assertEqual(entries[1].amount, 42.25)
        self.assertEqual(entries[1].date, date(2026, 6, 2))

    def test_category_identification_matches_expected_patterns(self):
        self.assertEqual(
            identify_transaction_category("Transferencia recibida de Juan"),
            "TRANSFER_RECEIVED",
        )
        self.assertEqual(
            identify_transaction_category("Pago Google Workspace"),
            "SERVICE_PAYMENT",
        )
        self.assertEqual(
            identify_transaction_category("Unknown merchant with no configured pattern"),
            None,
        )

    def test_category_ids_cover_all_configured_categories(self):
        category_names = {
            name
            for name in dir(TRANSACTION_CATEGORIES)
            if not name.startswith("_") and isinstance(getattr(TRANSACTION_CATEGORIES, name), list)
        }

        self.assertEqual(set(CATEGORY_IDS), category_names)
        self.assertEqual(len(set(CATEGORY_IDS.values())), len(CATEGORY_IDS))


if __name__ == "__main__":
    unittest.main()
