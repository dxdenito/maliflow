from decimal import Decimal

from pydantic import BaseModel


class FinancialPositionResponse(BaseModel):
    available_funds: Decimal
    total_in: Decimal
    total_out: Decimal
    net_movement: Decimal