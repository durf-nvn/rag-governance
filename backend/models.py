from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=True)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)
    role = Column(String(50), default="STUDENT")
    department = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

    student_profile = relationship("StudentProfile", back_populates="user", uselist=False)

class StudentProfile(Base):
    __tablename__ = "student_profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    course = Column(String(255), nullable=True)
    year_level = Column(String(50), nullable=True)

    user = relationship("User", back_populates="student_profile")

# --- NEW: OTP VERIFICATION TABLE ---
class OTPVerification(Base):
    __tablename__ = "otp_verifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False)
    otp_code = Column(String(6), nullable=False)
    expires_at = Column(DateTime, nullable=False)