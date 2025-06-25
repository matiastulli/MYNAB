import pandas as pd
import io
import pdfplumber


def extract_pdf_to_dataframe(file_bytes: bytes) -> pd.DataFrame:
    """Extract table data from MercadoPago PDF and convert to DataFrame"""
    # Read PDF with pdfplumber
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        all_tables = []

        for page in pdf.pages:
            # Extract tables from each page
            tables = page.extract_tables()

            if tables:
                for table in tables:
                    # Convert table to DataFrame
                    if table and len(table) > 0:
                        # Filter out empty rows
                        clean_table = [row for row in table if row and any(
                            cell for cell in row if cell and str(cell).strip())]
                        if clean_table:
                            all_tables.extend(clean_table)
            else:
                # If no tables found, try to extract text and parse it
                text = page.extract_text()
                if text:
                    lines = text.split('\n')
                    for line in lines:
                        # Look for transaction lines (lines with dates)
                        if any(char.isdigit() for char in line) and ('-' in line or '/' in line):
                            # Split by whitespace but preserve multi-word descriptions
                            parts = line.split()
                            if len(parts) >= 3:  # At least date, description, amount
                                all_tables.append(parts)

        if all_tables:
            # Create DataFrame from extracted data
            df = pd.DataFrame(all_tables)
            return df
        else:
            # Return empty DataFrame if no data found
            return pd.DataFrame()
