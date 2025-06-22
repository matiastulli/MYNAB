from fastapi import APIRouter, Depends, status, Query, HTTPException
from datetime import date
from typing import Optional

from src.service.auth_user.dependencies import require_role
from src.service.auth_user.schemas import JWTData
from src.service.budget.schemas import BudgetEntryCreate, BudgetSummary, BudgetEntriesResponse
from src.service.budget.service import create_budget_entry, get_budget_summary, get_budget_entries, delete_budget_entry

router = APIRouter()


@router.post("/entry", status_code=status.HTTP_201_CREATED)
async def add_entry(
    entry: BudgetEntryCreate,
    jwt_data: JWTData = Depends(require_role([]))
):
    await create_budget_entry(jwt_data.id_user, entry)
    return {"message": "Entry added successfully"}


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
