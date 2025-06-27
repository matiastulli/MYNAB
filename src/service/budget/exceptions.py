from src.service.budget.constants import ERRORCODE
from src.service.exceptions import BadRequest


class ExistentCattleHistoryForCattleStatic(BadRequest):
    DETAIL = ERRORCODE.EXISTING_CATTLE_HISTORY_FOR_CATTLE_STATIC
    ERROR_CODE = "EXISTING_CATTLE_HISTORY_FOR_CATTLE_STATIC"

    def __init__(self):
        super().__init__(detail=self.DETAIL)
        self.error_code = self.ERROR_CODE
