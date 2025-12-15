from typing import Optional
from sqlmodel import SQLModel, Field
from enum import Enum

class InteractionType(str, Enum):
    LIKE = "like"
    FAVORITE = "favorite"

class Interaction(SQLModel, table=True):
    __tablename__ = "interactions"

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    post_id: int = Field(foreign_key="posts.id", index=True)
    type: InteractionType
