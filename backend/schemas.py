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

# --- NEW: CHED MONITORING SCHEMAS ---
class ChedRequirementCreate(BaseModel):
    program: str
    cmo_name: str
    description: str

class ChedEvidenceResponse(BaseModel):
    id: uuid.UUID
    document_name: str
    file_url: str
    uploaded_by: str
    upload_date: datetime

    class Config:
        from_attributes = True

class ChedRequirementResponse(BaseModel):
    id: uuid.UUID
    program: str
    cmo_name: str
    description: str
    status: str
    evidences: list[ChedEvidenceResponse] = [] # Automatically nests attached files!

    class Config:
        from_attributes = True

# --- NEW: PAPER TRAIL SCHEMAS ---
class PaperTrailCreate(BaseModel):
    title: str
    document_type: str
    office: str
    sender_name: str
    sender_email: str
    sender_role: str = "FACULTY"
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_role: Optional[str] = None
    remarks: Optional[str] = None
    file_url: Optional[str] = None

class PaperTrailStatusUpdate(BaseModel):
    status: str # "Received", "Under Review", "Approved", "Needs Revision", "Released"
    actor_name: str
    actor_email: str
    actor_role: str
    notes: Optional[str] = None

class PaperTrailLogResponse(BaseModel):
    id: uuid.UUID
    record_id: uuid.UUID
    action: str
    status: str
    actor_name: str
    actor_email: str
    actor_role: str
    notes: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class PaperTrailRecordResponse(BaseModel):
    id: uuid.UUID
    tracking_number: str
    title: str
    document_type: str
    office: str
    sender_name: str
    sender_email: str
    sender_role: str
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_role: Optional[str] = None
    status: str
    remarks: Optional[str] = None
    file_url: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    logs: list[PaperTrailLogResponse] = []

    class Config:
        from_attributes = True


class ISORequirementCreate(BaseModel):
    program: str
    iso_clause: str
    title: str
    description: str
    auditee_office: str
    risk_level: Optional[str] = "Medium"

class ISOEvidenceResponse(BaseModel):
    id: uuid.UUID
    iso_requirement_id: uuid.UUID
    document_name: str
    file_url: str
    uploaded_by: str
    upload_date: datetime

    class Config:
        from_attributes = True

class ISORequirementResponse(BaseModel):
    id: uuid.UUID
    program: str
    iso_clause: str
    title: str
    description: str
    auditee_office: str
    risk_level: str
    status: str
    created_at: datetime
    evidences: list[ISOEvidenceResponse] = []

    class Config:
        from_attributes = True

class ISOStatusUpdate(BaseModel):
    status: str # Compliant, Pending, Not Compliant
