
from decimal import Decimal

from pydantic import BaseModel, Field

from datetime import date



class SavingsTransferCreate(BaseModel):
    amount: Decimal = Field(gt=0)


class SavingsBalancesResponse(BaseModel):
    available_funds: Decimal
    reserved_funds: Decimal
    savings_funds: Decimal




class SavingsPerformanceResponse(BaseModel):
    period_start: date
    period_end: date
    income: Decimal
    budgeted_amount: Decimal
    actual_expenses: Decimal
    potential_savings: Decimal
    real_savings: Decimal
    savings_variance: Decimal