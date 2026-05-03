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
    department: Optional[str] = None

# What we send back to the user (Notice we DO NOT send the password back!)
class UserResponse(BaseModel):
    id: uuid.UUID
    email: EmailStr
    role: str
    full_name: Optional[str] = None  # NEW
    department: Optional[str] = None
    is_verified: bool                # NEW
    status: Optional[str] = "Active"
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
    department: str or "BSIT"

# --- NEW: ANNOUNCEMENT SCHEMAS ---
class AnnouncementCreate(BaseModel):
    title: str
    content: str
    recipients: str
    schedule_date: Optional[str] = None
    status: str
    sent_by: str
    total_recipients: int

class AnnouncementResponse(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    recipients: str
    sent_date: datetime
    sent_by: str
    status: str
    read_count: int
    total_recipients: int

    class Config:
        from_attributes = True

class AnnouncementUpdate(BaseModel):
    title: str
    content: str
    recipients: str
    schedule_date: Optional[str] = None
    status: str
    total_recipients: int