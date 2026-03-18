from pydantic import BaseModel
from datetime import datetime
from typing import Any


class PresentationBase(BaseModel):
    name: str
    description: str | None = None
    order_index: int = 0
    debug: bool = False


class PresentationCreate(PresentationBase):
    pass


class PresentationUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order_index: int | None = None
    debug: bool | None = None
    guion: dict[str, Any] | None = None


class PresentationOut(PresentationBase):
    id: int
    module_id: int
    guion: dict[str, Any] | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ResourceOut(BaseModel):
    id: int
    type: str
    original_name: str
    stored_path: str
    mime_type: str | None = None
    size_bytes: int | None = None

    model_config = {"from_attributes": True}
