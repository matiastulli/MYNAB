from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import JSONResponse
from datetime import date, datetime, timedelta
from sqlalchemy import select, insert, func, and_
from decimal import Decimal
from typing import Optional

from src.service.database import fetch_all, fetch_one, execute, budget_entry
from src.service.auth_user.dependencies import require_role
from src.service.auth_user.schemas import JWTData

router = APIRouter()


@router.post("/entry")
async def add_entry(
    entry: dict,  # Expected keys: amount, type, description, date
    jwt_data: JWTData = Depends(require_role([]))
):
    if entry["type"] not in ["income", "outcome"]:
        raise HTTPException(status_code=400, detail="Invalid type")

    stmt = insert(budget_entry).values(
        user_id=jwt_data.id_user,
        amount=Decimal(entry["amount"]),
        type=entry["type"],
        description=entry.get("description"),
        date=date.fromisoformat(entry["date"]),
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    await execute(stmt)
    return JSONResponse(status_code=201, content={"message": "Entry added successfully"})


@router.get("/summary")
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
        
    stmt = select(
        budget_entry.c.type,
        func.sum(budget_entry.c.amount).label("total")
    ).where(
        budget_entry.c.user_id == jwt_data.id_user,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date
    ).group_by(budget_entry.c.type)

    result = await fetch_all(stmt)
    summary = {"income": 0.0, "outcome": 0.0}
    for row in result:
        summary[row["type"]] = float(row["total"])

    return summary


@router.get("/details")
async def get_entries(
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
    
    # Build filter conditions
    conditions = [
        budget_entry.c.user_id == jwt_data.id_user,
        budget_entry.c.date >= start_date,
        budget_entry.c.date <= end_date
    ]
    
    # Add type filter if provided
    if type_filter and type_filter in ["income", "outcome"]:
        conditions.append(budget_entry.c.type == type_filter)
    
    # Count total entries for pagination info
    count_stmt = select(func.count()).select_from(budget_entry).where(and_(*conditions))
    total_count = await fetch_one(count_stmt)
    total_count = total_count[0] if total_count else 0
    
    # Get paginated entries
    stmt = select(budget_entry).where(and_(*conditions)) \
        .order_by(budget_entry.c.date.desc()) \
        .limit(limit).offset(offset)

    entries = await fetch_all(stmt)
    
    return {
        "data": entries,
        "pagination": {
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    }
