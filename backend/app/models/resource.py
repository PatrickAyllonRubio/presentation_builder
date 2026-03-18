from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.database import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    presentation_id = Column(Integer, ForeignKey("presentations.id"), nullable=False)
    # Tipos: svg | image | video | audio
    type = Column(String(20), nullable=False)
    original_name = Column(String(500), nullable=False)
    stored_path = Column(String(1000), nullable=False)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())

    presentation = relationship("Presentation", back_populates="resources")
