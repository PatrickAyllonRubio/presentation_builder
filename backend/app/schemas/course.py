from pydantic import BaseModel
from datetime import datetime


class CourseBase(BaseModel):
    name: str
    description: str | None = None


class CourseCreate(CourseBase):
    pass


class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None


class CourseOut(CourseBase):
    id: int
    cover_image_path: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
