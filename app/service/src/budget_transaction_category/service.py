from sqlalchemy import select
from typing import Dict, Any, List

from src.database import fetch_all, budget_transaction_category



async def get_transaction_categories() -> List[Dict[str, Any]]:
    """
    Get all transaction categories for dropdown display in the client
    Returns a list of categories with their IDs, keys, and names
    """
    stmt = select(budget_transaction_category)
    categories = await fetch_all(stmt)
    return categories
