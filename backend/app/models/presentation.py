from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Boolean, JSON, func
from sqlalchemy.orm import relationship
from app.database import Base


class Presentation(Base):
    __tablename__ = "presentations"

    id = Column(Integer, primary_key=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)
    # El guion completo se guarda como JSON (los IDs de recursos ya resueltos)
    guion = Column(JSON, nullable=True)
    debug = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    module = relationship("Module", back_populates="presentations")
    resources = relationship("Resource", back_populates="presentation", cascade="all, delete-orphan")
