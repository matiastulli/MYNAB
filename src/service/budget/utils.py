import pandas as pd
import io
import pdfplumber
import re

def extract_pdf_to_dataframe(file_bytes: bytes) -> pd.DataFrame:
    """Extrae los movimientos del PDF MercadoPago y retorna un DataFrame limpio."""

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
