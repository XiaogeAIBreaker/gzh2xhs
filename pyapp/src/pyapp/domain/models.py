from typing import Optional
from pydantic import BaseModel

class Card(BaseModel):
    id: str
    title: str
    model: str
    style: str
    description: Optional[str] = None

