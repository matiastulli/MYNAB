from sqlalchemy import select
import pandas as pd
import io
import pdfplumber
import re

from src.service.budget.constants import TRANSACTION_CATEGORIES
from src.service.database import fetch_one, budget_transaction_category

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