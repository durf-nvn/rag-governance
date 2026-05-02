from sqlalchemy import Column, String, Text, DateTime, Boolean, ForeignKey, Integer, Float
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

# --- NEW: ANNOUNCEMENT TABLE ---
class Announcement(Base):
    __tablename__ = "announcements"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    recipients = Column(String(255), nullable=False) 
    sent_date = Column(DateTime, default=datetime.utcnow)
    sent_by = Column(String(255), nullable=False)
    status = Column(String(50), default="Sent") # Sent, Scheduled, Draft
    read_count = Column(Integer, default=0)
    total_recipients = Column(Integer, default=0)

# --- NEW: SYSTEM SETTINGS TABLE ---
class SystemSettings(Base):
    __tablename__ = "system_settings"
    id = Column(Integer, primary_key=True, index=True, default=1) # Always ID 1
    
    # Profile Settings
    platform_name = Column(String(255), default="CTU Institutional Knowledge System")
    campus = Column(String(255), default="Argao Campus")
    admin_email = Column(String(255), default="admin@ctu.edu.ph")
    
    # Security Settings
    jwt_expiration = Column(Integer, default=30)
    otp_expiration = Column(Integer, default=10)
    
    # AI Engine Settings
    ai_model = Column(String(100), default="llama-3.1-8b-instant")
    ai_temperature = Column(Float, default=0.3)
    ai_system_prompt = Column(Text, default="You are the friendly and professional AI Policy Assistant for Cebu Technological University (CTU) Argao Campus. INSTRUCTIONS: 1. If the question is about university rules, grades, or handbooks, use the CONTEXT provided below to answer. 2. If NO CONTEXT is found, apologize and direct them to the campus office.")
    rag_max_chunks = Column(Integer, default=5)