import pandas as pd
import io
import pdfplumber
import re
from typing import List, Dict, Any

from src.budget_transaction_category.constants import TRANSACTION_CATEGORIES


def extract_pdf_to_dataframe(file_bytes: bytes) -> pd.DataFrame:
    """
    Extract data from a PDF file and return it as a DataFrame.
    """

    # Leer el texto completo del PDF
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    # Tomar solo el bloque del detalle
    if "DETALLE DE MOVIMIENTOS" in full_text:
        full_text = full_text.split("DETALLE DE MOVIMIENTOS")[1]

    # Regex que captura: fecha, descripción, ID, valor y saldo
    pattern = re.compile(
        r"(\d{2}-\d{2}-\d{4})\s+"      # Fecha
        r"(.*?)\s+"                    # Descripción
        r"(\d+)\s+"                    # ID operación
        r"\$\s+([-\d\.,]+)\s+"         # Valor
        r"\$\s+([-\d\.,]+)"            # Saldo
    )

    matches = pattern.findall(full_text)

    if not matches:
        return pd.DataFrame()  # Vacío si no encontró nada

    # Armar el DataFrame
    df = pd.DataFrame(
        matches,
        columns=["Fecha", "Descripcion", "ID", "Valor", "Saldo"]
    )

    return df


def identify_transaction_category(description: str) -> str:
    """
    Identify the transaction category based on the description
    Returns the category key or None if no match found
    """
    description = description.lower()

    # Check each category's patterns
    for category_attr in dir(TRANSACTION_CATEGORIES):
        if category_attr.startswith('_'):
            continue

        patterns = getattr(TRANSACTION_CATEGORIES, category_attr)
        if not isinstance(patterns, list):
            continue

        for pattern in patterns:
            if re.search(pattern, description, re.IGNORECASE):
                return category_attr

    return None


def generate_xlsx(entries: List[Dict[str, Any]]) -> bytes:
    if not entries:
        df = pd.DataFrame()
    else:
        df = pd.DataFrame(entries)

        # Select only the specified columns for export
        columns_to_export = ['reference_id', 'amount',
                             'currency', 'source', 'type', 'description', 'date']

        # Filter to only include columns that exist in the dataframe
        available_columns = [
            col for col in columns_to_export if col in df.columns]

        if available_columns:
            df = df[available_columns]

    output = io.BytesIO()
    df.to_excel(output, index=False)
    return output.getvalue()
