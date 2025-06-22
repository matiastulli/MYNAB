from sqlalchemy import select, insert, func, and_
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, Dict, Any, List

from src.service.database import fetch_all, fetch_one, execute, budget_entry
from src.service.budget.schemas import BudgetEntryCreate, BudgetSummary

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
    count_stmt = select(func.count()).select_from(budget_entry).where(and_(*conditions))
    total_count = await fetch_one(count_stmt)
    total_count = total_count[0] if total_count else 0
    
    # Get paginated entries
    stmt = select(budget_entry).where(and_(*conditions)) \
        .order_by(budget_entry.c.date.desc()) \
        .limit(limit).offset(offset)

    entries = await fetch_all(stmt)
    
    return entries, total_count