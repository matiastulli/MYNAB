from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, status, Query, Body, HTTPException
import base64

from fastapi.responses import JSONResponse

from src.auth_user.dependencies import require_role
from src.auth_user.schemas import JWTData
from src.budget.schemas import BudgetEntryCreate, BudgetSummary, BudgetResponseWithMeta, BudgetResponse, FilesResponseWithMeta, FilesResponse, BudgetSummaryByCurrency
from src.budget.service import (
    create_budget_entry,
    get_budget_summary,
    get_budget_summary_by_currency,
    get_budget_entries,
    delete_budget_entry,
    delete_file,
    process_bank_statement,
    create_file,
    list_files
)
from src.budget.utils import generate_xlsx


router = APIRouter()


@router.post("/entry", status_code=status.HTTP_201_CREATED)
async def post_entry(
    entry: BudgetEntryCreate,
    jwt_data: JWTData = Depends(require_role([]))
):
    await create_budget_entry(jwt_data.id_user, entry)
    return {"message": "Entry added successfully"}


@router.post("/import-file", status_code=status.HTTP_200_OK)
async def post_file(
    bank_name: str = Body(...),
    file_content: str = Body(...),  # Base64 encoded file content
    file_name: str = Body(...),
    currency: str = Body(...),  # Currency code, e.g., "USD", "EUR"
    jwt_data: JWTData = Depends(require_role([]))
) -> dict[str, str | int]:
    """
    Import transactions from file (Base64 encoded) based on the bank format.
    Supported banks: santander_rio, ICBC, mercado_pago
    """
    # Define bank-specific file formats
    bank_formats = {
        "santander_rio": [".xlsx"],
        "ICBC": [".csv"],
        "mercado_pago": [".pdf"]
    }

    # Validate bank name first
    supported_banks = list(bank_formats.keys())
    if bank_name.lower() not in map(str.lower, supported_banks):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported bank. Supported banks: {', '.join(supported_banks)}"
        )

    # Get expected formats for the selected bank (case insensitive match)
    expected_format = bank_formats[[
        k for k in bank_formats.keys() if k.lower() == bank_name.lower()][0]]

    # Validate file type based on bank selection
    if not any(file_name.lower().endswith(ext.lower()) for ext in expected_format):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"For {bank_name}, file must be in format: {', '.join(expected_format)}"
        )

    file_id = await create_file(
        user_id=jwt_data.id_user,
        file_name=file_name,
        file_content=file_content,
        currency=currency
    )

    try:
        # Process bank statement in the service layer
        entry_count = await process_bank_statement(jwt_data.id_user, file_id, bank_name, currency, file_content)

        return {
            "message": f"Successfully imported {entry_count} transactions from {bank_name}",
            "imported_count": entry_count
        }

    except Exception as e:
        error_msg = str(e)

        # Provide more user-friendly error messages for common errors
        if "Excel file format cannot be determined" in error_msg:
            error_detail = f"Invalid Excel file format for {bank_name}. Please make sure you're uploading a valid Excel file (.xlsx) from {bank_name}."
        elif "No columns to parse from file" in error_msg:
            error_detail = f"Could not extract data from the {bank_name} file. Please make sure you're uploading the correct file format."
        else:
            error_detail = f"Error processing file: {error_msg}"

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail
        ) from e


@router.get("/files", response_model=List[FilesResponseWithMeta])
async def get_files(
    jwt_data: JWTData = Depends(require_role([])),
    currency: str = Query(...),
    limit: Optional[int] = Query(
        default=100, description="Number of items to return per page"),
    offset: Optional[int] = Query(
        default=0, description="Offset from the beginning of the result set"),
) -> JSONResponse:
    result = await list_files(user_id=jwt_data.id_user, limit=limit, offset=offset, currency=currency)

    files_data = result["data"]
    metadata = result["metadata"]

    if not files_data:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"data": files_data, "metadata": metadata})

    files_response = [
        FilesResponse(**file_data) for file_data in files_data
    ]

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"data": [file.model_dump()
                          for file in files_response], "metadata": metadata}
    )


@router.get("/details", response_model=List[BudgetResponseWithMeta])
async def get_budget_details(
    jwt_data: JWTData = Depends(require_role([])),
    currency: str = Query(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: Optional[int] = Query(
        default=100, description="Number of items to return per page"),
    offset: Optional[int] = Query(
        default=0, description="Offset from the beginning of the result set"),
) -> JSONResponse:
    today = date.today()

    # Default to current month if no dates provided
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    result = await get_budget_entries(
        jwt_data.id_user,
        start_date,
        end_date,
        limit,
        offset,
        currency
    )

    budgets_data = result["data"]
    metadata = result["metadata"]

    if not budgets_data:
        return JSONResponse(status_code=status.HTTP_200_OK, content={"data": budgets_data, "metadata": metadata})

    budget_response = [
        BudgetResponse(**budget_data) for budget_data in budgets_data
    ]

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={"data": [budget.model_dump()
                          for budget in budget_response], "metadata": metadata}
    )


@router.get("/summary", response_model=BudgetSummary)
async def get_monthly_summary(
    jwt_data: JWTData = Depends(require_role([])),
    currency: str = Query(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Get budget summary with income/outcome totals and category breakdowns.

    Example URL: {{ENV_URL}}/budget/summary?currency="ARS"&start_date=2023-01-01&end_date=2023-01-31
    """
    today = date.today()

    # Default to current month if no dates provided
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    summary = await get_budget_summary(jwt_data.id_user, start_date, end_date, currency)
    return summary


@router.get("/summary-by-currency", response_model=BudgetSummaryByCurrency)
async def get_summary_by_currency(
    jwt_data: JWTData = Depends(require_role([])),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
):
    """
    Get budget summary grouped by currency with income/outcome totals.
    Only includes currencies that have transactions with non-zero income or outcome.

    Example URL: {{ENV_URL}}/budget/summary-by-currency?start_date=2023-01-01&end_date=2023-01-31
    """
    today = date.today()

    # Default to current month if no dates provided
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    summary = await get_budget_summary_by_currency(jwt_data.id_user, start_date, end_date)
    return summary


@router.delete("/entry/{entry_id}", status_code=status.HTTP_200_OK)
async def remove_entry(
    entry_id: int,
    jwt_data: JWTData = Depends(require_role([]))
):
    deleted = await delete_budget_entry(jwt_data.id_user, entry_id)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entry not found or not authorized to delete this entry"
        )

    return {"message": "Entry deleted successfully"}


@router.delete("/file/{file_id}", status_code=status.HTTP_200_OK)
async def remove_file(
    file_id: int,
    jwt_data: JWTData = Depends(require_role([]))
):
    deleted = await delete_file(file_id, jwt_data.id_user)

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or not authorized to delete this file"
        )

    return {"message": "File deleted successfully"}


@router.get("/export-xlsx")
async def export_xlsx(
    jwt_data: JWTData = Depends(require_role([])),
    currency: str = Query(...),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: Optional[int] = Query(
        default=100, description="Number of items to return per page"),
    offset: Optional[int] = Query(
        default=0, description="Offset from the beginning of the result set"),
):
    """
    Export all transactions as an .xlsx file for the given date range and currency.
    Returns JSON with base64 encoded file and filename.
    """
    today = date.today()

    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    result = await get_budget_entries(
        jwt_data.id_user,
        start_date,
        end_date,
        limit,
        offset,
        currency
    )

    budgets_data = result["data"]

    if not budgets_data:
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "message": "No transactions found for the specified criteria",
                "file_data": None,
                "filename": None,
                "metadata": result["metadata"]
            }
        )

    xlsx_bytes = generate_xlsx(budgets_data)

    file_base64 = base64.b64encode(xlsx_bytes).decode('utf-8')

    filename = f"MYNAB_{currency}_{start_date.strftime('%Y%m%d')}_{end_date.strftime('%Y%m%d')}.xlsx"

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "File generated successfully",
            "file_data": file_base64,
            "filename": filename,
            "file_size": len(xlsx_bytes),
            "record_count": len(budgets_data)
        }
    )
