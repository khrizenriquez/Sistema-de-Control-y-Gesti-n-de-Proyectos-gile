from sqlalchemy import Column, Integer, DateTime, Boolean
from sqlalchemy.sql import func
from app.database.base import Base

class BaseModel(Base):
    """
    Modelo base con campos comunes para todos los modelos
    """
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    is_active = Column(Boolean, default=True) 