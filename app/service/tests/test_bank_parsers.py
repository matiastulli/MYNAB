import base64
import io
import os
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pandas as pd
from openpyxl import Workbook

os.environ.setdefault("ENV_JWT_ALG", "HS256")
os.environ.setdefault("ENV_JWT_SECRET", "test-secret")
os.environ.setdefault("ENV_DATABASE_URL", "postgresql+asyncpg://user:pass@localhost:5432/test")
os.environ.setdefault("ENV_CORS_ORIGINS", '["http://localhost:5173"]')
os.environ.setdefault("ENV_CORS_HEADERS", '["Content-Type", "Authorization"]')
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")

from src.budget import service

FIXTURES = Path(__file__).parent / "fixtures"
USER_ID = 42
FILE_ID = 7
NATIONAL_ID = "20111111112"


def _xlsx_bytes(rows: list[list]) -> bytes:
    workbook = Workbook()
    sheet = workbook.active
    for row in rows:
        sheet.append(row)
    output = io.BytesIO()
    workbook.save(output)
    return output.getvalue()


def _row(reference_id, amount, entry_type, currency, source, description, category_id, entry_date):
    return {
        "user_id": USER_ID,
        "reference_id": reference_id,
        "amount": amount,
        "type": entry_type,
        "currency": currency,
        "source": source,
        "description": description,
        "category_id": category_id,
        "date": entry_date,
        "file_id": FILE_ID,
    }


class BankStatementGoldenTests(unittest.IsolatedAsyncioTestCase):
    """Full import path per bank (bytes -> reader -> parser -> filters -> categories -> insert rows)."""

    async def _import(self, bank_name: str, file_bytes: bytes, currency: str) -> list[dict]:
        with (
            patch.object(service, "get_user_by_id", new=AsyncMock(return_value={"national_id": NATIONAL_ID})),
            patch.object(service, "fetch_all", new=AsyncMock(return_value=[])),
            patch.object(service, "execute", new=AsyncMock()),
            patch.object(service, "insert") as insert,
        ):
            imported, skipped = await service.process_bank_statement(
                user_id=USER_ID,
                file_id=FILE_ID,
                bank_name=bank_name,
                currency=currency,
                file_content=base64.b64encode(file_bytes).decode(),
            )

        self.assertEqual(skipped, 0)
        rows = insert.return_value.values.call_args.args[0]
        self.assertEqual(imported, len(rows))
        for row in rows:
            self.assertIs(type(row["date"]), date)
            self.assertIsInstance(row["amount"], float)
        return [{k: v for k, v in row.items() if k not in ("created_at", "updated_at")} for row in rows]

    async def test_santander_rio_xlsx(self):
        preamble = [["Movimientos de cuenta", None, None, None, None, None, None, None]]
        preamble += [[None, f"Dato de cuenta ficticio {i}", None, None, None, None, None, None] for i in range(11)]
        preamble.append([None, "Fecha", "Sucursal origen", "Descripción", "Referencia", "Caja de Ahorro", "Cuenta Corriente", "Saldo"])
        data = [
            [None, "01/06/2026", "000 - Casa Central", "Transferencia recibida de ACME FAKE SA", "1111111", 50000.0, None, 150000.0],
            [None, "02/06/2026", "000 - Casa Central", "Compra con tarjeta de debito FAKE SHOP", "2222222", -1234.56, None, 148765.44],
            [None, "03/06/2026", "000 - Casa Central", "Pago tarjeta de credito VISA", "3333333", None, -20000.0, 128765.44],
            [None, None, None, None, None, None, None, None],
            [None, "04/06/2026", "000 - Casa Central", "Libreria Ficticia", "4444444", -99.9, None, 128665.54],
            [None, None, None, "Saldo al cierre", None, None, None, 128665.54],
        ]

        rows = await self._import("santander_rio", _xlsx_bytes(preamble + data), "ARS")

        self.assertEqual(rows, [
            _row("1111111", 50000.0, "income", "ARS", "santander_rio", "Transferencia recibida de ACME FAKE SA", 2, date(2026, 6, 1)),
            _row("2222222", 1234.56, "outcome", "ARS", "santander_rio", "Compra con tarjeta de debito FAKE SHOP", 8, date(2026, 6, 2)),
            _row("3333333", 20000.0, "outcome", "ARS", "santander_rio", "Pago tarjeta de credito VISA", 4, date(2026, 6, 3)),
            _row("4444444", 99.9, "outcome", "ARS", "santander_rio", "Libreria Ficticia", None, date(2026, 6, 4)),
        ])

    async def test_icbc_csv(self):
        rows = await self._import("ICBC", (FIXTURES / "icbc.csv").read_bytes(), "ARS")

        # "Ingreso de dinero Cuenta ICBC" and the row carrying the user's national_id are filtered out;
        # the row with both Debito and Credito blank is skipped.
        self.assertEqual(rows, [
            _row("10000001", 150000.5, "income", "ARS", "ICBC", "Transferencia recibida de ACME FAKE SA", 2, date(2026, 6, 1)),
            _row("10000002", 4250.75, "outcome", "ARS", "ICBC", "Compra con tarjeta de debito FAKE MARKET", 8, date(2026, 6, 2)),
            _row("10000005", 320.0, "outcome", "ARS", "ICBC", "Libreria Ficticia", None, date(2026, 6, 5)),
        ])

    async def test_mercado_pago_pdf(self):
        # No PDF writer is installed, so pdfplumber is faked at the text-extraction boundary;
        # the regex -> DataFrame -> parser path is still the real one.
        page_text = "\n".join([
            "RESUMEN DE CUENTA",
            "Saldo inicial $ 1.000,00",
            "DETALLE DE MOVIMIENTOS",
            "Fecha Descripción ID de la operación Valor Saldo",
            "01-06-2026 Transferencia recibida ACME FAKE SA 11111111111 $ 25.000,00 $ 26.000,00",
            "02-06-2026 Pago Google Workspace 22222222222 $ -1.234,56 $ 24.765,44",
            "03-06-2026 Rendimientos 33333333333 $ 12,34 $ 24.777,78",
            "04-06-2026 Ajuste sin movimiento 44444444444 $ 0,00 $ 24.777,78",
        ])
        pdf = MagicMock()
        pdf.pages = [MagicMock(**{"extract_text.return_value": page_text}),
                     MagicMock(**{"extract_text.return_value": None})]

        with patch("src.budget.utils.pdfplumber.open") as pdf_open:
            pdf_open.return_value.__enter__.return_value = pdf
            rows = await self._import("mercado_pago", b"%PDF-fake", "ARS")

        self.assertEqual(rows, [
            _row("11111111111", 25000.0, "income", "ARS", "mercado_pago", "Transferencia recibida ACME FAKE SA", 2, date(2026, 6, 1)),
            _row("22222222222", 1234.56, "outcome", "ARS", "mercado_pago", "Pago Google Workspace", 3, date(2026, 6, 2)),
            _row("33333333333", 12.34, "income", "ARS", "mercado_pago", "Rendimientos", 7, date(2026, 6, 3)),
        ])

    async def test_bbva_xls(self):
        # Production files are .xls (xlrd). No .xls writer is installed, so the same sheet is fed as
        # .xlsx: pd.read_excel sniffs the format from the bytes and header=2 is still exercised.
        sheet = [
            ["Últimos movimientos", None, None, None, None],
            ["Cuenta 0000-FAKE-0000", None, None, None, None],
            ["Fecha", "Concepto", None, "Importe", "Saldo"],
            ["01/06/2026", "Transferencia recibida", "ACME FAKE SA", "150.000,00", "200.000,00"],
            ["02/06/2026", "Pago de servicios", "FAKE ENERGIA", "-12.345,67", "187.654,33"],
            ["03/06/2026", "Compra en comercio", None, "-500,00", "187.154,33"],
            ["04/06/2026", "Ajuste", None, "0,00", "187.154,33"],
            [None, None, None, None, None],
            ["Saldo final", None, None, None, "187.154,33"],
        ]

        rows = await self._import("bbva", _xlsx_bytes(sheet), "ARS")

        self.assertEqual(rows, [
            _row("bbva_Transferencia recibida ACME FA_20260601", 150000.0, "income", "ARS", "bbva", "Transferencia recibida ACME FAKE SA", 2, date(2026, 6, 1)),
            _row("bbva_Pago de servicios FAKE ENERGIA_20260602", 12345.67, "outcome", "ARS", "bbva", "Pago de servicios FAKE ENERGIA", 3, date(2026, 6, 2)),
            _row("bbva_Compra en comercio_20260603", 500.0, "outcome", "ARS", "bbva", "Compra en comercio", 8, date(2026, 6, 3)),
        ])

    async def test_comm_bank_csv(self):
        rows = await self._import("comm_bank", (FIXTURES / "comm_bank.csv").read_bytes(), "AUD")

        self.assertEqual(rows, [
            _row("comm_bank_Fast Transfer From ACME FAKE P_20260601", 2500.0, "income", "AUD", "comm_bank", "Fast Transfer From ACME FAKE PTY LTD", 2, date(2026, 6, 1)),
            _row("comm_bank_WOOLWORTHS 1234 FAKETOWN_20260602", 45.9, "outcome", "AUD", "comm_bank", "WOOLWORTHS 1234 FAKETOWN", 8, date(2026, 6, 2)),
            _row("comm_bank_International Transaction Fee_20260604", 12.0, "outcome", "AUD", "comm_bank", "International Transaction Fee", 10, date(2026, 6, 4)),
        ])

    async def test_revolut_csv(self):
        rows = await self._import("revolut", (FIXTURES / "revolut.csv").read_bytes(), "EUR")

        # PENDIENTE, non-EUR and zero-amount rows are skipped; Comisión is added to the amount.
        self.assertEqual(rows, [
            _row("revolut_20260601091500_Payment from ACME Fak", 1200.0, "income", "EUR", "revolut", "Payment from ACME Fake Payroll", None, date(2026, 6, 1)),
            _row("revolut_20260602134510_Fake Cafe, Centro", 8.5, "outcome", "EUR", "revolut", "Fake Cafe, Centro", None, date(2026, 6, 2)),
            _row("revolut_20260603182000_Fake Airline", 151.5, "outcome", "EUR", "revolut", "Fake Airline", None, date(2026, 6, 3)),
            _row("revolut_20260607083000_Fake Plan Fee", 5.0, "outcome", "EUR", "revolut", "Fake Plan Fee", None, date(2026, 6, 7)),
        ])


class IcbcBlankAmountTests(unittest.TestCase):
    def _parse(self, csv_text: str):
        df = pd.read_csv(io.StringIO(csv_text))
        return service._process_icbc_format(df, file_id=FILE_ID, bank_name="ICBC", currency="ARS")

    def test_blank_debito_is_income_from_credito(self):
        entries = self._parse("Fecha,Descripcion,Debito,Credito,Referencia\n06/01/26,Sueldo,,1500.25,1\n")

        self.assertEqual([(e.type, e.amount) for e in entries], [("income", 1500.25)])

    def test_blank_credito_is_outcome_from_debito(self):
        entries = self._parse("Fecha,Descripcion,Debito,Credito,Referencia\n06/01/26,Compra,99.75,,1\n")

        self.assertEqual([(e.type, e.amount) for e in entries], [("outcome", 99.75)])

    def test_row_with_both_amounts_blank_is_skipped(self):
        entries = self._parse(
            "Fecha,Descripcion,Debito,Credito,Referencia\n"
            "06/01/26,Saldo anterior,,,1\n"
            "06/02/26,Compra,10.00,,2\n"
        )

        self.assertEqual([(e.reference_id, e.type, e.amount) for e in entries], [("2", "outcome", 10.0)])

    def test_row_with_both_amounts_zero_is_skipped(self):
        entries = self._parse("Fecha,Descripcion,Debito,Credito,Referencia\n06/01/26,Ajuste,0,0,1\n")

        self.assertEqual(entries, [])


if __name__ == "__main__":
    unittest.main()
