from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from datetime import date, datetime
from sqlalchemy import select, insert, func
from decimal import Decimal

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
    jwt_data: JWTData = Depends(require_role([]))
):
    today = date.today()
    first_day = today.replace(day=1)

    stmt = select(
        budget_entry.c.type,
        func.sum(budget_entry.c.amount).label("total")
    ).where(
        budget_entry.c.user_id == jwt_data.id_user,
        budget_entry.c.date >= first_day,
        budget_entry.c.date <= today
    ).group_by(budget_entry.c.type)

    result = await fetch_all(stmt)
    summary = {"income": 0.0, "outcome": 0.0}
    for row in result:
        summary[row["type"]] = float(row["total"])

    return summary


@router.get("/details")
async def get_entries(
    jwt_data: JWTData = Depends(require_role([]))
):
    today = date.today()
    first_day = today.replace(day=1)

    stmt = select(budget_entry).where(
        budget_entry.c.user_id == jwt_data.id_user,
        budget_entry.c.date >= first_day,
        budget_entry.c.date <= today
    ).order_by(budget_entry.c.date.desc())

    entries = await fetch_all(stmt)
    return entries
