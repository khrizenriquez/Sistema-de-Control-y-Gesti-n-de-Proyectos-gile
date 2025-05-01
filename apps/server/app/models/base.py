from sqlmodel import Field, SQLModel
from typing import Optional
from datetime import datetime
import uuid

class BaseModel(SQLModel):
    """
    Modelo base con campos comunes para todos los modelos
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = Field(default=True) 