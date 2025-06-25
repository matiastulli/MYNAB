from pydantic import BaseModel, validator
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List

class BudgetEntryCreate(BaseModel):
    amount: Decimal
    currency: str
    source: Optional[str] = None  # e.g., 'icbc', 'mercado_pago', 'manual'
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
    created_at: datetime
    updated_at: datetime
    
    @property
    def created_date(self) -> date:
        return self.created_at.date()
        
    @property
    def updated_date(self) -> date:
        return self.updated_at.date()

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