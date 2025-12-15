from pydantic import BaseModel
from datetime import datetime
from app.models.chat import MessageRole

class ChatRequest(BaseModel):
    message: str

class MessageResponse(BaseModel):
    id: int
    role: MessageRole
    content: str
    created_at: datetime

class ChatResponse(BaseModel):
    user_message: MessageResponse
    assistant_message: MessageResponse
