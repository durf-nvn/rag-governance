from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid

# What the user sends us when they sign up
class UserCreate(BaseModel):
    email: EmailStr
    password: str

# What we send back to the user (Notice we DO NOT send the password back!)
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    created_at: datetime

    class Config:
        from_attributes = True