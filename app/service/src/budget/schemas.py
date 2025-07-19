from datetime import date, datetime
from typing import Optional, List, Dict

from pydantic import validator
from src.models import CustomModel, convert_datetime_to_date


class Validators:
    @classmethod
    def format_datetime(cls, value):
        if value is None:
            return value
        if isinstance(value, date):
            return value.strftime("%Y-%m-%d")
        if isinstance(value, datetime):
            return convert_datetime_to_date(value)
        return value


class BudgetEntryCreate(CustomModel):
    reference_id: str
    amount: float
    currency: str
    source: Optional[str] = None  # e.g., 'icbc', 'mercado_pago', 'manual'
    type: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    file_id: Optional[int] = None
    date: date

    @validator('type')
    def validate_type(cls, v):
        if v not in ["income", "outcome"]:
            raise ValueError("Type must be either 'income' or 'outcome'")
        return v


class CategorySummary(CustomModel):
    key: str
    name: str
    amount: float


class BudgetSummary(CustomModel):
    income: float = 0.0
    outcome: float = 0.0
    categories: Optional[Dict[str, List[CategorySummary]]] = None


class Metadata(CustomModel):
    total_count: int
    limit: int
    offset: int


class BudgetResponse(CustomModel):
    id: int
    user_id: int
    reference_id: str
    amount: float
    currency: str
    source: Optional[str] = None  # e.g., 'icbc', 'mercado_pago', 'manual'
    type: str
    description: Optional[str] = None
    file_id: Optional[int] = None
    date: str
    created_at: str
    updated_at: str

    @validator('created_at', 'updated_at', 'date', pre=True, allow_reuse=True)
    def format_datetime(cls, value):
        return Validators.format_datetime(value)


class BudgetResponseWithMeta(CustomModel):
    data: List[BudgetResponse]
    metadata: Metadata


class FilesResponse(CustomModel):
    id: int
    file_name: str
    user_id: int
    created_at: str
    updated_at: str

    @validator('created_at', 'updated_at', pre=True, allow_reuse=True)
    def format_datetime(cls, value):
        return Validators.format_datetime(value)


class FilesResponseWithMeta(CustomModel):
    data: List[FilesResponse]
    metadata: Metadata
