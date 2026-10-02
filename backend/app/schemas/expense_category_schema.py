from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ExpenseCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ExpenseCategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    is_active: bool | None = None


class ExpenseCategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    is_active: bool
    created_at: datetime
    updated_at: datetime