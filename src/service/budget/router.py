from fastapi import APIRouter, Depends, status, Query, Body, HTTPException
from datetime import date
from typing import Optional
import pandas as pd
import io
import base64

from src.service.auth_user.dependencies import require_role
from src.service.auth_user.schemas import JWTData
from src.service.budget.schemas import BudgetEntryCreate, BudgetSummary, BudgetEntriesResponse
from src.service.budget.service import (
    create_budget_entry,
    get_budget_summary,
    get_budget_entries,
    delete_budget_entry,
    process_bank_statement
)

router = APIRouter()


@router.post("/entry", status_code=status.HTTP_201_CREATED)
async def add_entry(
    entry: BudgetEntryCreate,
    jwt_data: JWTData = Depends(require_role([]))
):
    await create_budget_entry(jwt_data.id_user, entry)
    return {"message": "Entry added successfully"}


@router.post("/import-excel", status_code=status.HTTP_200_OK)
async def import_excel(
    bank_name: str = Body(...),
    file_content: str = Body(...),  # Base64 encoded file content
    file_name: str = Body(...),
    jwt_data: JWTData = Depends(require_role([]))
) -> dict[str, str | int]:
    """
    Import transactions from an Excel file (Base64 encoded) based on the bank format.
    Supported banks: santander_rio, ICBC, mercado_pago
    """
    # Validate file type
    if not file_name.endswith(('.xlsx', '.xls')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx or .xls)"
        )
    
    # Validate bank name
    supported_banks = ["santander_rio", "ICBC", "mercado_pago"]
    if bank_name.lower() not in map(str.lower, supported_banks):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported bank. Supported banks: {', '.join(supported_banks)}"
        )
    
    try:
        # Decode Base64 file content
        file_bytes = base64.b64decode(file_content)
        
        # Load into pandas DataFrame
        df = pd.read_excel(io.BytesIO(file_bytes))
        
        # Process bank statement in the service layer
        entry_count = await process_bank_statement(jwt_data.id_user, bank_name, df)
        
        return {
            "message": f"Successfully imported {entry_count} transactions from {bank_name}",
            "imported_count": entry_count
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        )


@router.get("/summary", response_model=BudgetSummary)
async def get_monthly_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    jwt_data: JWTData = Depends(require_role([]))
):
    today = date.today()

    # Default to current month if no dates provided
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    summary = await get_budget_summary(jwt_data.id_user, start_date, end_date)
    return summary


@router.get("/details", response_model=BudgetEntriesResponse)
async def get_budget_details(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    type_filter: Optional[str] = None,
    jwt_data: JWTData = Depends(require_role([]))
):
    today = date.today()

    # Default to current month if no dates provided
    if not start_date:
        start_date = today.replace(day=1)
    if not end_date:
        end_date = today

    entries, total_count = await get_budget_entries(
        jwt_data.id_user,
        start_date,
        end_date,
        limit,
        offset,
        type_filter
    )

    return {
        "data": entries,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    }


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
