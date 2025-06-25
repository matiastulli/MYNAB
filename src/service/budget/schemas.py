from pydantic import validator
from src.service.models import CustomModel, convert_datetime_to_date
from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List


class BudgetEntryCreate(CustomModel):
    reference_id: str
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


class BudgetSummary(CustomModel):
    income: float = 0.0
    outcome: float = 0.0


class PaginationInfo(CustomModel):
    total: int
    limit: int
    offset: int


class BudgetEntriesResponse(CustomModel):
    data: List[BudgetEntry]
    pagination: PaginationInfo


class FilesResponse(CustomModel):
    id: int
    file_name: str
    id_user: int
    created_at: str
    updated_at: str

    @validator('created_at', 'updated_at', pre=True)
    def format_datetime(cls, value):
        if isinstance(value, datetime):
            return convert_datetime_to_date(value)
        return value


class Metadata(CustomModel):
    total_count: int
    limit: int
    offset: int


class FilesResponseWithMeta(CustomModel):
    data: List[FilesResponse]
    metadata: Metadata
