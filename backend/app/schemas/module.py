from pydantic import BaseModel
from datetime import datetime


class ModuleBase(BaseModel):
    name: str
    description: str | None = None
    order_index: int = 0


class ModuleCreate(ModuleBase):
    pass


class ModuleUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order_index: int | None = None


class ModuleOut(ModuleBase):
    id: int
    course_id: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
