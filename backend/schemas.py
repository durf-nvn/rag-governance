from pydantic import BaseModel, EmailStr
from datetime import datetime
import uuid
from typing import Optional

# What the user sends us when they sign up
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # NEW: We now accept the role from the frontend
    full_name: str
    course: Optional[str] = None  # NEW
    year: Optional[str] = None    # NEW

# What we send back to the user (Notice we DO NOT send the password back!)
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    full_name: Optional[str] = None  # NEW
    is_verified: bool                # NEW
    created_at: datetime

    class Config:
        from_attributes = True

# What we send back when the user successfully logs in
class Token(BaseModel):
    access_token: str
    token_type: str
    full_name: str  # NEW
    email: str      # NEW
    role: str       # NEW