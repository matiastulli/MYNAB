from typing import Optional
from src.models import CustomModel


class TransactionCategoryResponse(CustomModel):
    id: int
    category_key: str
    category_name: str
    description: Optional[str] = None
