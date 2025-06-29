from src.service.budget.constants import ERRORCODE
from src.service.exceptions import BadRequest


class DummyExample(BadRequest):
    DETAIL = ERRORCODE.DUMMY_EXAMPLE
    ERROR_CODE = "DUMMY_EXAMPLE"

    def __init__(self):
        super().__init__(detail=self.DETAIL)
        self.error_code = self.ERROR_CODE
