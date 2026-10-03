
import calendar
from datetime import date
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.expense import Expense
from app.models.income import Income
from app.schemas.savings_schema import SavingsPerformanceResponse


CENT = Decimal("0.01")


def money(value) -> Decimal:
    return Decimal(str(value or 0)).quantize(
        CENT,
        rounding=ROUND_HALF_UP,
    )


class SavingsPerformanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_monthly_performance(
        self,
        user_id: int,
        year: int,
        month: int,
    ) -> SavingsPerformanceResponse:
        if month < 1 or month > 12:
            raise HTTPException(
                status_code=422,
                detail="Month must be between 1 and 12",
            )

        start = date(year, month, 1)
        end = date(
            year,
            month,
            calendar.monthrange(year, month)[1],
        )

        income_total = self.db.scalar(
            select(func.coalesce(func.sum(Income.amount), 0)).where(
                Income.user_id == user_id,
                Income.intended_period >= start,
                Income.intended_period <= end,
            )
        )

        expense_total = self.db.scalar(
            select(func.coalesce(func.sum(Expense.amount), 0)).where(
                Expense.user_id == user_id,
                Expense.expense_date >= start,
                Expense.expense_date <= end,
            )
        )

        budgets = self.db.scalars(
            select(Budget).where(
                Budget.user_id == user_id,
                Budget.start_date <= end,
                Budget.end_date >= start,
            )
        ).all()

        budget_total = Decimal("0.00")

        for budget in budgets:
            overlap_start = max(budget.start_date, start)
            overlap_end = min(budget.end_date, end)

            overlap_days = (overlap_end - overlap_start).days + 1
            budget_days = (
                (budget.end_date - budget.start_date).days + 1
            )

            if budget_days <= 0:
                continue

            allocated = (
                Decimal(str(budget.amount))
                * Decimal(overlap_days)
                / Decimal(budget_days)
            )

            budget_total += allocated

        income = money(income_total)
        actual = money(expense_total)
        budgeted = money(budget_total)

        potential = money(income - budgeted)
        real = money(income - actual)
        variance = money(real - potential)

        return SavingsPerformanceResponse(
            period_start=start,
            period_end=end,
            income=income,
            budgeted_amount=budgeted,
            actual_expenses=actual,
            potential_savings=potential,
            real_savings=real,
            savings_variance=variance,
        )