from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.models.ledger import LedgerEntryType


class LedgerEntryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    entry_type: LedgerEntryType
    amount: Decimal
    description: str | None
    reference_type: str | None
    reference_id: int | None
    occurred_at: datetime
    created_at: datetime




class LedgerSummaryResponse(BaseModel):
    total_in: Decimal
    total_out: Decimal
    net_movement: Decimal