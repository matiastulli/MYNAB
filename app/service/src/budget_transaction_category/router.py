from typing import List
from fastapi import APIRouter, Depends

from src.auth_user.dependencies import require_role
from src.auth_user.schemas import JWTData
from src.budget_transaction_category import schema
from src.budget_transaction_category import service


router = APIRouter()


@router.get("/budget-transaction-category", response_model=List[schema.TransactionCategoryResponse])
async def get_categories(
    jwt_data: JWTData = Depends(require_role([]))
):
    """
    Get all transaction categories for dropdown selection in the client
    
    Returns a list of all available transaction categories with their IDs, keys, and display names
    """
    categories = await service.get_transaction_categories()
    return categories
