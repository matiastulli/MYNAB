from sqlalchemy import select, insert, func, and_, delete
from datetime import date, datetime
from typing import Optional, Dict, Any, List
import pandas as pd
import io
import base64

from src.service.budget.utils import extract_pdf_to_dataframe
from src.service.database import fetch_all, fetch_one, execute, budget_entry
from src.service.budget.schemas import BudgetEntryCreate


async def create_budget_entry(user_id: int, entry: BudgetEntryCreate) -> None:
    stmt = insert(budget_entry).values(
        user_id=user_id,
        amount=entry.amount,
        type=entry.type,
        description=entry.description,
        date=entry.date,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await execute(stmt)


async def get_budget_summary(user_id: int, start_date: date, end_date: date) -> Dict[str, float]:
    stmt = select(
        budget_entry.c.type,
        func.sum(budget_entry.c.amount).label("total")
    ).where(
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date
    ).group_by(budget_entry.c.type)

    result = await fetch_all(stmt)
    summary = {"income": 0.0, "outcome": 0.0}
    for row in result:
        summary[row["type"]] = float(row["total"])

    return summary


async def get_budget_entries(
    user_id: int,
    start_date: date,
    end_date: date,
    limit: int,
    offset: int,
    type_filter: Optional[str]
) -> tuple[List[Dict[str, Any]], int]:
    # Build filter conditions
    conditions = [
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date
    ]

    # Add type filter if provided
    if type_filter and type_filter in ["income", "outcome"]:
        conditions.append(budget_entry.c.type == type_filter)

    # Count total entries for pagination info
    count_stmt = select(func.count()).select_from(
        budget_entry).where(and_(*conditions))
    total_count_result = await fetch_one(count_stmt)

    # Fix for the error - handle different possible return formats
    if total_count_result is None:
        total_count = 0
    elif isinstance(total_count_result, dict) and 'count' in total_count_result:
        total_count = total_count_result['count']
    elif isinstance(total_count_result, (list, tuple)) and len(total_count_result) > 0:
        total_count = total_count_result[0]
    else:
        # If we can't determine the format, convert to string and log for debugging
        total_count = 0
        print(
            f"Unexpected count result format: {type(total_count_result)} - {total_count_result}")

    # Get paginated entries
    stmt = select(budget_entry).where(and_(*conditions)) \
        .order_by(budget_entry.c.date.desc()) \
        .limit(limit).offset(offset)

    entries = await fetch_all(stmt)

    return entries, total_count


async def delete_budget_entry(user_id: int, entry_id: int) -> bool:
    """Delete a budget entry if it belongs to the user

    Args:
        user_id: ID of the user making the request
        entry_id: ID of the entry to delete

    Returns:
        bool: True if successful, False if entry not found or not owned by user
    """

    # First check if the entry exists and belongs to the user
    check_stmt = select(budget_entry.c.id).where(
        and_(budget_entry.c.id == entry_id, budget_entry.c.user_id == user_id)
    )

    entry = await fetch_one(check_stmt)

    if not entry:
        return False

    # Entry exists and belongs to the user, proceed with deletion
    delete_stmt = delete(budget_entry).where(
        and_(budget_entry.c.id == entry_id, budget_entry.c.user_id == user_id)
    )

    await execute(delete_stmt)
    return True


async def process_bank_statement(user_id: int, bank_name: str, file_content: str) -> int:
    """
    Process bank statements from different banks and add entries to the database
    Returns the number of entries imported
    """
    # Process based on bank format
    entries = []

    # Decode Base64 file content
    file_bytes = base64.b64decode(file_content)

    if bank_name.lower() == "santander_rio":
        # Load into pandas DataFrame
        df = pd.read_excel(io.BytesIO(file_bytes))

        entries = _process_santander_rio_format(df)
    elif bank_name.lower() == "mercado_pago":
        df = extract_pdf_to_dataframe(file_bytes)

        entries = _process_mercado_pago_format(df)
        
    elif bank_name.lower() == "icbc":
        # Load into pandas DataFrame
        df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8')

        entries = _process_icbc_format(df)

    # Filter out unwanted transactions
    ignored_descriptions = [
        "Ingreso de dinero Cuenta ICBC",
        "2041542604"
    ]

    # Filter out entries with large amounts that would exceed database limits
    filtered_entries = []
    for entry in entries:
        # Skip entries with descriptions in the ignore list
        if any(desc.lower() in entry.description.lower() for desc in ignored_descriptions):
            continue

        # Skip entries with amounts that would exceed database limits
        if entry.amount >= 100000000:  # NUMERIC(10,2) limit
            continue

        filtered_entries.append(entry)

    # Save filtered entries to database
    entry_count = 0
    for entry in filtered_entries:
        await create_budget_entry(user_id, entry)
        entry_count += 1

    return entry_count


def _process_santander_rio_format(df: pd.DataFrame) -> List[BudgetEntryCreate]:
    """Process Santander Rio bank statement format"""
    entries: List[BudgetEntryCreate] = []
    try:
        df = df.iloc[12:].copy()

        # Rename all 8 columns properly
        df.columns = [
            "Index",
            "Fecha",
            "Sucursal_origen",
            "Descripcion",
            "Referencia",
            "Caja_de_Ahorro",
            "Cuenta_Corriente",
            "Saldo"
        ]
        df = df.drop(columns=["Index"])  # drop the blank index column
        df = df.dropna(how="all")

        for _, row in df.iterrows():
            try:
                date_raw = pd.to_datetime(
                    row["Fecha"], dayfirst=True, errors="coerce")
                description = str(row["Descripcion"]).strip(
                ) or "Transacción sin descripción"
                amount = pd.to_numeric(
                    row.get("Caja_de_Ahorro"), errors="coerce")
                if pd.isna(amount):
                    amount = pd.to_numeric(
                        row.get("Cuenta_Corriente"), errors="coerce")

                if pd.isna(amount):
                    continue

                entry_type = "income" if amount > 0 else "outcome"
                entries.append(BudgetEntryCreate(
                    date=date_raw,
                    amount=abs(amount),
                    description=description,
                    type=entry_type,
                ))
            except Exception:
                continue
    except Exception as e:
        return []
    return entries


def _process_mercado_pago_format(df: pd.DataFrame) -> List[BudgetEntryCreate]:
    """Process MercadoPago bank statement format"""
    entries: List[BudgetEntryCreate] = []

    try:
        # MercadoPago statements typically have columns: Fecha, Descripción, ID de la operación, Valor, Saldo
        # Clean up the dataframe
        df = df.dropna(how="all")

        # Find the header row that contains "Fecha" and "Descripción"
        header_row_idx = None
        for idx, row in df.iterrows():
            if any("Fecha" in str(cell) and "Descripción" in str(cell) for cell in row if pd.notna(cell)):
                header_row_idx = idx
                break

        if header_row_idx is None:
            # Try to find individual column headers
            for idx, row in df.iterrows():
                row_str = ' '.join([str(cell)
                                   for cell in row if pd.notna(cell)])
                if "Fecha" in row_str and "Descripción" in row_str:
                    header_row_idx = idx
                    break

        if header_row_idx is not None:
            # Set the header and clean the dataframe
            df = df.iloc[header_row_idx + 1:].copy()

        # Expected columns: Fecha, Descripción, ID de la operación, Valor, Saldo
        # Rename columns to standard names
        expected_columns = ["Fecha", "Descripcion",
                            "ID_operacion", "Valor", "Saldo"]

        # If we have the right number of columns, rename them
        if len(df.columns) >= 4:
            # Take only the first 5 columns or as many as we have
            cols_to_use = min(5, len(df.columns))
            df = df.iloc[:, :cols_to_use]

            # Rename columns
            column_names = expected_columns[:cols_to_use]
            df.columns = column_names
        else:
            # If columns don't match expected format, try to identify them
            df.columns = [f"Col_{i}" for i in range(len(df.columns))]

        # Remove empty rows
        df = df.dropna(how="all")

        # Process each row
        for _, row in df.iterrows():
            try:
                # Skip rows that don't contain transaction data
                if pd.isna(row.iloc[0]) or str(row.iloc[0]).strip() == "":
                    continue

                # Extract date (first column)
                date_str = str(row.iloc[0]).strip()

                # Skip if it's not a date-like string
                if not any(char.isdigit() for char in date_str):
                    continue

                # Parse date - MercadoPago uses DD-MM-YYYY format
                try:
                    date_raw = pd.to_datetime(
                        date_str, format="%d-%m-%Y", errors="coerce")
                    if pd.isna(date_raw):
                        date_raw = pd.to_datetime(
                            date_str, dayfirst=True, errors="coerce")
                except:
                    continue

                if pd.isna(date_raw):
                    continue

                # Extract description (second column)
                description = str(row.iloc[1]).strip() if len(row) > 1 and pd.notna(
                    row.iloc[1]) else "Transacción MercadoPago"

                # Extract amount - look for the "Valor" column (usually 4th column, index 3)
                amount = None

                # Try to find amount in the expected position (index 3 for "Valor")
                if len(row) > 3:
                    amount_str = str(row.iloc[3]).strip()
                    # Remove currency symbols and clean the string
                    amount_str = amount_str.replace(
                        "$", "").replace(",", "").strip()

                    try:
                        amount = float(amount_str)
                    except:
                        amount = None

                # If amount not found in expected position, try other columns
                if amount is None:
                    for col_idx in range(2, len(row)):
                        try:
                            col_val = str(row.iloc[col_idx]).strip()
                            if "$" in col_val or any(char.isdigit() for char in col_val):
                                col_val = col_val.replace(
                                    "$", "").replace(",", "").strip()
                                # Handle negative values
                                if col_val.startswith("-"):
                                    amount = -float(col_val[1:])
                                else:
                                    amount = float(col_val)
                                break
                        except:
                            continue

                if amount is None or amount == 0:
                    continue

                # Determine entry type
                entry_type = "income" if amount > 0 else "outcome"

                # Create entry
                entries.append(BudgetEntryCreate(
                    date=date_raw,
                    amount=abs(amount),
                    description=description,
                    type=entry_type,
                ))

            except Exception as e:
                # Skip problematic rows
                continue

    except Exception as e:
        return []

    return entries


def _process_icbc_format(df: pd.DataFrame) -> List[BudgetEntryCreate]:
    """Process ICBC bank statement CSV file into BudgetEntryCreate list"""
    entries: List[BudgetEntryCreate] = []
    # Rename columns for clarity
    df.columns = ["Fecha", "Descripcion", "Credito", "Debito", "Saldo"]

    for _, row in df.iterrows():
        try:
            # Parse date
            date_val = datetime.strptime(str(row["Fecha"]), "%m/%d/%y").date()
            description = str(row["Descripcion"]).strip() or "Transacción sin descripción"
            credito = pd.to_numeric(row.get("Credito"), errors="coerce") or 0.0
            debito = pd.to_numeric(row.get("Debito"), errors="coerce") or 0.0

            # Determine amount and type
            if credito > 0:
                amount = credito
                entry_type = "income"
            else:
                amount = debito
                entry_type = "outcome"

            entries.append(BudgetEntryCreate(
                date=date_val,
                amount=abs(amount),
                description=description,
                type=entry_type
            ))
        except Exception:
            continue

    return entries