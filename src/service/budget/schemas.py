from pydantic import BaseModel, validator
from datetime import date
from decimal import Decimal
from typing import Optional, List

class BudgetEntryCreate(BaseModel):
    amount: Decimal
    type: str
    description: Optional[str] = None
    date: date
    
    @validator('type')
    def validate_type(cls, v):
        if v not in ["income", "outcome"]:
            raise ValueError("Type must be either 'income' or 'outcome'")
        return v

class BudgetEntry(BudgetEntryCreate):
    id: int
    user_id: int
    created_at: date
    updated_at: date
    
class BudgetSummary(BaseModel):
    income: float = 0.0
    outcome: float = 0.0
    
class PaginationInfo(BaseModel):
    total: int
    limit: int
    offset: int
    
class BudgetEntriesResponse(BaseModel):
    data: List[BudgetEntry]
    pagination: PaginationInfo