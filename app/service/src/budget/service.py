from sqlalchemy import select, insert, func, and_, delete
from datetime import date, datetime
from typing import Dict, Any, List
import pandas as pd
import io
import base64
from loguru import logger

from src.auth_user.service import get_user_by_id
from src.budget.utils import extract_pdf_to_dataframe, identify_transaction_category
from src.database import fetch_all, fetch_one, execute, budget_entry, files, budget_transaction_category
from src.budget.schemas import BudgetEntryCreate, CategorySummary
from src.budget_transaction_category.constants import CATEGORY_IDS


async def create_budget_entry(user_id: int, entry: BudgetEntryCreate) -> None:
    stmt = insert(budget_entry).values(
        user_id=user_id,
        reference_id=entry.reference_id,
        amount=entry.amount,
        type=entry.type,
        currency=entry.currency,
        source=entry.source,
        description=entry.description,
        category_id=entry.category_id if entry.category_id else None,
        date=entry.date,
        file_id=entry.file_id if entry.file_id else None,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await execute(stmt)


async def get_budget_summary(user_id: int, start_date: date, end_date: date, currency: str) -> Dict[str, Any]:
    # Get overall summary by income/outcome type
    type_stmt = select(
        budget_entry.c.type,
        func.sum(budget_entry.c.amount).label("total")
    ).where(
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date,
        budget_entry.c.currency == currency
    ).group_by(budget_entry.c.type)

    type_result = await fetch_all(type_stmt)
    summary = {"income": 0.0, "outcome": 0.0}
    for row in type_result:
        summary[row["type"]] = float(row["total"])

    # Get summary by category
    category_stmt = select(
        budget_entry.c.type,
        budget_transaction_category.c.category_key,
        budget_transaction_category.c.category_name,
        func.sum(budget_entry.c.amount).label("total")
    ).select_from(
        budget_entry.outerjoin(
            budget_transaction_category,
            budget_entry.c.category_id == budget_transaction_category.c.id
        )
    ).where(
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date,
        budget_entry.c.currency == currency
    ).group_by(
        budget_entry.c.type,
        budget_transaction_category.c.category_key,
        budget_transaction_category.c.category_name
    )

    category_result = await fetch_all(category_stmt)

    # Process category summaries
    categories = {
        "income": [],
        "outcome": []
    }

    for row in category_result:
        entry_type = row["type"]
        if entry_type not in categories:
            continue

        category_key = row["category_key"] if row["category_key"] else "uncategorized"
        category_name = row["category_name"] if row["category_name"] else "Uncategorized"

        categories[entry_type].append(
            CategorySummary(
                key=category_key,
                name=category_name,
                amount=float(row["total"])
            ).dict()
        )

    # Return combined summary that matches BudgetSummary schema
    return {
        "income": summary["income"],
        "outcome": summary["outcome"],
        "categories": categories
    }


async def get_budget_summary_by_currency(user_id: int, start_date: date, end_date: date) -> Dict[str, Any]:
    """
    Get budget summary grouped by currency with income/outcome totals.
    Only includes currencies that have transactions with non-zero income or outcome.
    """
    # Get summary by currency and type
    currency_stmt = select(
        budget_entry.c.currency,
        budget_entry.c.type,
        func.sum(budget_entry.c.amount).label("total")
    ).where(
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date
    ).group_by(
        budget_entry.c.currency,
        budget_entry.c.type
    )

    currency_result = await fetch_all(currency_stmt)

    # Process results into currency summaries
    currency_data = {}

    for row in currency_result:
        currency = row["currency"]
        entry_type = row["type"]
        total = float(row["total"])

        if currency not in currency_data:
            currency_data[currency] = {"income": 0.0, "outcome": 0.0}

        currency_data[currency][entry_type] = total

    # Convert to list format and filter out currencies with both income and outcome as 0
    currencies = []
    for currency, data in currency_data.items():
        if data["income"] != 0.0 or data["outcome"] != 0.0:
            currencies.append({
                "currency": currency,
                "income": data["income"],
                "outcome": data["outcome"]
            })

    return {"currencies": currencies}


async def get_budget_entries(
    user_id: int,
    start_date: date,
    end_date: date,
    limit: int,
    offset: int,
    currency: str
) -> dict[str, Any]:
    # Build filter conditions
    conditions = [
        budget_entry.c.user_id == user_id,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date,
        budget_entry.c.currency == currency
    ]

    # Count query to get total records
    count_query = select(func.count()).select_from(budget_entry)
    total_count_result = await fetch_one(count_query)
    total_count = total_count_result['count_1'] if total_count_result else 0

    # Get paginated entries
    stmt = select(budget_entry).where(and_(*conditions)) \
        .order_by(budget_entry.c.date.desc()) \
        .limit(limit).offset(offset)

    entries = await fetch_all(stmt)

    return {
        "data": entries,
        "metadata": {
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
    }


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


async def create_file(user_id: int, file_name: str, file_content: str, currency: str) -> int:
    """
    Create a new file entry in the database.
    Returns the ID of the created file.
    """
    stmt = insert(files).values(
        user_id=user_id,
        file_name=file_name,
        file_base64=file_content,
        currency=currency,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    ).returning(files.c.id)

    result = await fetch_one(stmt)
    return result['id'] if result else None


async def delete_file(file_id: int, user_id: int) -> bool:
    """
    Delete a file entry by its ID if it belongs to the user.
    Returns True if successful, False if file not found or not owned by user.
    """
    # Check if the file exists and belongs to the user
    check_stmt = select(files.c.id).where(
        and_(files.c.id == file_id, files.c.user_id == user_id)
    )

    file = await fetch_one(check_stmt)

    if not file:
        return False

    # First delete all budget entries that reference this file
    delete_entries_stmt = delete(budget_entry).where(
        and_(budget_entry.c.file_id == file_id,
             budget_entry.c.user_id == user_id)
    )

    await execute(delete_entries_stmt)

    # File exists and belongs to the user, proceed with deletion
    delete_stmt = delete(files).where(
        and_(files.c.id == file_id, files.c.user_id == user_id)
    )

    await execute(delete_stmt)
    return True


async def list_files(user_id: int, limit: int, offset: int, currency: str) -> dict[str, Any]:

    select_query = select(
        files.c.id.label('id'),
        files.c.user_id.label('user_id'),
        files.c.file_name.label('file_name'),
        files.c.created_at.label('created_at'),
        files.c.updated_at.label('updated_at'),
    ).select_from(files).where(and_(files.c.user_id == user_id, files.c.currency == currency))

    # Count query to get total records
    count_query = select(func.count()).select_from(select_query.alias())
    total_count_result = await fetch_one(count_query)
    total_count = total_count_result['count_1'] if total_count_result else 0

    # Apply limit and offset for pagination
    paginated_query = select_query.limit(limit).offset(offset)

    # Fetch data
    data = await fetch_all(paginated_query)

    return {
        "data": data,
        "metadata": {
            "total_count": total_count,
            "limit": limit,
            "offset": offset
        }
    }


async def process_bank_statement(user_id: int, file_id: int, bank_name: str, currency: str, file_content: str) -> int:
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

        entries = _process_santander_rio_format(
            df, file_id, bank_name, currency)
    elif bank_name.lower() == "mercado_pago":
        df = extract_pdf_to_dataframe(file_bytes)

        entries = _process_mercado_pago_format(
            df, file_id, bank_name, currency)

    elif bank_name.lower() == "icbc":
        # Load into pandas DataFrame
        df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8')

        entries = _process_icbc_format(df, file_id, bank_name, currency)

    elif bank_name.lower() == "bbva":
        # Load into pandas DataFrame
        df = pd.read_excel(io.BytesIO(file_bytes), header=2)

        entries = _process_bbva_format(df, file_id, bank_name, currency)

    elif bank_name.lower() == "comm_bank":
        df = pd.read_csv(io.BytesIO(file_bytes), encoding='utf-8', header=None)

        entries = _process_comm_bank_format(df, file_id, bank_name, currency)

    user_data = await get_user_by_id(user_id)

    # Filter out unwanted transactions
    ignored_descriptions = [
        "Ingreso de dinero Cuenta ICBC"
    ]

    # Add the user's national_id to ignored descriptions if available
    if user_data and user_data.get("national_id"):
        ignored_descriptions.append(user_data["national_id"])

    # Filter out entries with large amounts that would exceed database limits
    filtered_entries = []
    for entry in entries:
        # Skip entries with descriptions in the ignore list
        if any(desc.lower() in entry.description.lower() for desc in ignored_descriptions):
            continue

        # Identify category for the entry
        category_key = identify_transaction_category(entry.description)
        if category_key and category_key in CATEGORY_IDS:
            entry.category_id = CATEGORY_IDS[category_key]

        filtered_entries.append(entry)

    # Save filtered entries to database
    entry_count = 0
    for entry in filtered_entries:
        await create_budget_entry(user_id, entry)
        entry_count += 1

    return entry_count


def _process_santander_rio_format(df: pd.DataFrame, file_id: int, bank_name: str, currency: str) -> List[BudgetEntryCreate]:
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
                reference_id = str(row["Referencia"]).strip() or None
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
                    reference_id=reference_id,
                    date=date_raw,
                    amount=abs(amount),
                    currency=currency,
                    source=bank_name,
                    description=description,
                    type=entry_type,
                    file_id=file_id,
                    category_id=None  # Will be set in process_bank_statement
                ))
            except Exception:
                continue
    except Exception as ex:
        logger.error(f"Error processing Santander Rio statement: {ex}")
        return []
    return entries


def _process_mercado_pago_format(df: pd.DataFrame, file_id: int, bank_name: str, currency: str) -> List[BudgetEntryCreate]:
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
                except Exception as ex:
                    logger.error(f"Error parsing date: {date_str} - {ex}")
                    continue

                if pd.isna(date_raw):
                    continue

                # Extract reference ID (third column)
                reference_id = str(row.iloc[2]).strip() if len(row) > 2 and pd.notna(
                    row.iloc[2]) else None

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
                        "$", "").replace(".", "").strip()

                    # Replace comma with period for decimal separator
                    amount_str = amount_str.replace(",", ".")

                    try:
                        amount = float(amount_str)
                    except Exception as ex:
                        logger.error(
                            f"Error parsing amount: {amount_str} - {ex}")
                        amount = None

                if amount is None or amount == 0:
                    continue

                # Determine entry type
                entry_type = "income" if amount > 0 else "outcome"

                # Create entry
                entries.append(BudgetEntryCreate(
                    reference_id=reference_id or f"{bank_name}_{description[:30]}_{date_raw.strftime('%Y%m%d')}",
                    date=date_raw,
                    amount=abs(amount),
                    currency=currency,
                    source=bank_name,
                    description=description,
                    type=entry_type,
                    file_id=file_id,
                    category_id=None  # Will be set in process_bank_statement
                ))

            except Exception as e:
                # Skip problematic rows
                logger.error(f"Error processing MercadoPago row: {e}")
                continue

    except Exception as e:
        logger.error(f"Error processing MercadoPago statement: {e}")
        return []

    return entries


def _process_icbc_format(df: pd.DataFrame, file_id: int, bank_name: str, currency: str) -> List[BudgetEntryCreate]:
    """Process ICBC bank statement CSV file into BudgetEntryCreate list"""
    entries: List[BudgetEntryCreate] = []
    # Rename columns for clarity
    df.columns = ["Fecha", "Descripcion", "Debito", "Credito", "Referencia"]

    for _, row in df.iterrows():
        try:
            reference_id = str(row["Referencia"]).replace(
                ".", "").strip() or None
            # Parse date
            date_val = datetime.strptime(str(row["Fecha"]), "%m/%d/%y").date()
            description = str(row["Descripcion"]).strip(
            ) or "Transacción sin descripción"
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
                reference_id=reference_id or f"{bank_name}_{description[:30]}_{date_val.strftime('%Y%m%d')}",
                date=date_val,
                amount=abs(amount),
                currency=currency,
                source=bank_name,
                description=description,
                type=entry_type,
                file_id=file_id,
                category_id=None  # Will be set in process_bank_statement
            ))
        except Exception:
            continue

    return entries


def _process_bbva_format(df: pd.DataFrame, file_id: int, bank_name: str, currency: str) -> List[BudgetEntryCreate]:
    """Process BBVA bank statement Excel file with headers on line 3 (index 2)"""
    entries: List[BudgetEntryCreate] = []
    try:
        df.columns = ["Fecha", "Concepto", "Extra", "Importe", "Saldo"]
        df = df.dropna(how="all")
        for _, row in df.iterrows():
            try:
                # Parse date (format: d/m/Y)
                date_val = pd.to_datetime(
                    str(row["Fecha"]).strip(), format="%d/%m/%Y", errors="coerce")
                if pd.isna(date_val):
                    continue
                # Description: Concepto + Extra (if present)
                concepto = str(row["Concepto"]).strip(
                ) if pd.notna(row["Concepto"]) else ""
                extra = str(row["Extra"]).strip() if pd.notna(
                    row["Extra"]) else ""
                description = f"{concepto} {extra}".strip()
                # Parse amount (Importe, with comma as decimal separator)
                importe_str = str(row["Importe"]).replace(
                    ".", "").replace(",", ".").strip()
                try:
                    amount = float(importe_str)
                except Exception:
                    continue
                if amount == 0:
                    continue
                # Determine type
                entry_type = "income" if amount > 0 else "outcome"
                # Reference ID: use bank, description, date
                reference_id = f"{bank_name}_{description[:30]}_{date_val.strftime('%Y%m%d')}"
                # Create entry
                entries.append(BudgetEntryCreate(
                    reference_id=reference_id,
                    date=date_val,
                    amount=abs(amount),
                    currency=currency,
                    source=bank_name,
                    description=description,
                    type=entry_type,
                    file_id=file_id,
                    category_id=None  # Will be set in process_bank_statement
                ))
            except Exception as ex:
                logger.error(f"Error processing BBVA statement row: {ex}")
                continue
    except Exception as ex:
        logger.error(f"Error processing BBVA statement: {ex}")
        return []
    return entries


def _process_comm_bank_format(df: pd.DataFrame, file_id: int, bank_name: str, currency: str) -> List[BudgetEntryCreate]:
    """Process CommBank CSV file (no headers) into BudgetEntryCreate list"""
    entries: List[BudgetEntryCreate] = []
    try:
        # Assign columns: Date, Amount, Description, Balance
        df.columns = ["Date", "Amount", "Description", "Balance"]
        for _, row in df.iterrows():
            try:
                # Parse date (format: d/m/Y)
                date_val = pd.to_datetime(
                    str(row["Date"]).strip(), format="%d/%m/%Y", errors="coerce")
                if pd.isna(date_val):
                    continue
                # Parse amount
                amount = pd.to_numeric(row["Amount"], errors="coerce")
                if pd.isna(amount) or amount == 0:
                    continue
                # Determine type
                entry_type = "income" if amount > 0 else "outcome"
                # Description
                description = str(row["Description"]
                                  ).strip() or "CommBank Transaction"
                # Reference ID: can be None or generated
                reference_id = f"{bank_name}_{description[:30]}_{date_val.strftime('%Y%m%d')}"
                # Create entry
                entries.append(BudgetEntryCreate(
                    reference_id=reference_id,
                    date=date_val,
                    amount=abs(amount),
                    currency=currency,
                    source=bank_name,
                    description=description,
                    type=entry_type,
                    file_id=file_id,
                    category_id=None  # Will be set in process_bank_statement
                ))
            except Exception as ex:
                logger.error(f"Error processing CommBank statement row: {ex}")
                continue
    except Exception as ex:
        logger.error(f"Error processing CommBank statement: {ex}")
        return []
    return entries
