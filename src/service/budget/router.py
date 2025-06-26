from fastapi import APIRouter, Depends, status, Query, Body, HTTPException
from datetime import date
from typing import List, Optional

from fastapi.responses import JSONResponse

from src.service.auth_user.dependencies import require_role
from src.service.auth_user.schemas import JWTData
from src.service.budget.schemas import BudgetEntryCreate, BudgetSummary, BudgetResponseWithMeta, BudgetResponse, FilesResponseWithMeta, FilesResponse
from src.service.budget.service import (
    create_budget_entry,
    get_budget_summary,
    get_budget_entries,
    delete_budget_entry,
    delete_file,
    process_bank_statement,
    create_file,
    list_files
)

router = APIRouter()


@router.post("/entry", status_code=status.HTTP_201_CREATED)
async def add_entry(
    entry: BudgetEntryCreate,
    jwt_data: JWTData = Depends(require_role([]))
):
    await create_budget_entry(jwt_data.id_user, entry)
    return {"message": "Entry added successfully"}


@router.post("/import-file", status_code=status.HTTP_200_OK)
async def import_file(
    bank_name: str = Body(...),
    file_content: str = Body(...),  # Base64 encoded file content
    file_name: str = Body(...),
    jwt_data: JWTData = Depends(require_role([]))
) -> dict[str, str | int]:
    """
    Import transactions from file (Base64 encoded) based on the bank format.
    Supported banks: santander_rio, ICBC, mercado_pago
    """
    # Validate file type
    if not file_name.endswith(('.xlsx', '.xls', '.csv', '.pdf')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel or PDF file (.xlsx, .xls, .csv, .pdf)"
        )

    # Validate bank name
    supported_banks = ["santander_rio", "ICBC", "mercado_pago"]
    if bank_name.lower() not in map(str.lower, supported_banks):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported bank. Supported banks: {', '.join(supported_banks)}"
        )

    file_id = await create_file(
        user_id=jwt_data.id_user,
        file_name=file_name,
        file_content=file_content
    )

    try:

        # Process bank statement in the service layer
        entry_count = await process_bank_statement(jwt_data.id_user, file_id, bank_name, file_content)

        return {
            "message": f"Successfully imported {entry_count} transactions from {bank_name}",
            "imported_count": entry_count
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file: {str(e)}"
        ) from e


@router.post("/files", response_model=List[FilesResponseWithMeta])
async def read_files(
    jwt_data: JWTData = Depends(require_role([])),
    limit: Optional[int] = Query(
        default=100, description="Number of items to return per page"),
    offset: Optional[int] = Query(
        default=0, description="Offset from the beginning of the result set"),
) -> JSONResponse:
    result = await list_files(user_id=jwt_data.id_user, limit=limit, offset=offset)

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


@router.post("/details", response_model=List[BudgetResponseWithMeta])
async def get_budget_details(
    jwt_data: JWTData = Depends(require_role([])),
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    type_filter: Optional[str] = None,
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
        type_filter
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
