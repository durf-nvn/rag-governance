import os
import io
import json
import time
from datetime import datetime, timedelta
from typing import List, Optional

# Third-party imports
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from groq import Groq
from supabase import create_client, Client
import PyPDF2
import groq

# Local module imports
import models
import schemas
import utils
import vector_store
from database import engine, get_db


load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize clients — single instances used throughout the file
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

SMTP_USER     = os.getenv("EMAIL_ADDRESS")
SMTP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION HELPERS
# ─────────────────────────────────────────────────────────────────────────────

VALID_NOTIF_TYPES = {"info", "success", "warning", "error"}


def _send_notification(user_email: str, n_type: str, title: str, message: str) -> None:
    """
    Insert one notification row for a specific user.
    Silent on failure — never blocks the main request.
    """
    if n_type not in VALID_NOTIF_TYPES:
        n_type = "info"
    try:
        supabase.table("notifications").insert({
            "user_email": user_email,
            "type":       n_type,
            "title":      title,
            "message":    message,
            "is_read":    False,
        }).execute()
    except Exception as exc:
        print(f"[_send_notification] silent failure — {exc}")


def _notify_all_admins(db: Session, n_type: str, title: str, message: str) -> None:
    """
    Send the same notification to every active ADMIN in the system.
    Only ADMINs receive this — faculty and students are excluded.
    """
    try:
        admins = (
            db.query(models.User)
            .filter(models.User.role == "ADMIN", models.User.status != "Disabled")
            .all()
        )
        for admin in admins:
            _send_notification(admin.email, n_type, title, message)
    except Exception as exc:
        print(f"[_notify_all_admins] silent failure — {exc}")


def _notify_role(db: Session, role: str, n_type: str, title: str, message: str) -> None:
    """
    Send the same notification to every active user of a given role.
    role: 'STUDENT' | 'FACULTY' | 'ADMIN'
    """
    try:
        users = (
            db.query(models.User)
            .filter(models.User.role == role, models.User.status != "Disabled")
            .all()
        )
        for user in users:
            _send_notification(user.email, n_type, title, message)
    except Exception as exc:
        print(f"[_notify_role:{role}] silent failure — {exc}")


def _notify_non_admin(db: Session, n_type: str, title: str, message: str) -> None:
    """
    Send to all active FACULTY and STUDENT users — excludes ADMINs.
    Used for document and announcement notifications.
    """
    try:
        users = (
            db.query(models.User)
            .filter(
                models.User.role.in_(["FACULTY", "STUDENT"]),
                models.User.status != "Disabled"
            )
            .all()
        )
        for user in users:
            _send_notification(user.email, n_type, title, message)
    except Exception as exc:
        print(f"[_notify_non_admin] silent failure — {exc}")


# ─────────────────────────────────────────────────────────────────────────────
# PYDANTIC SCHEMAS (request / response models)
# ─────────────────────────────────────────────────────────────────────────────

class QuestionRequest(BaseModel):
    question:   str
    user_email: str
    user_role:  str

class FeedbackRequest(BaseModel):
    question:   str
    answer:     str
    is_helpful: bool

class UpdateDocumentRequest(BaseModel):
    old_name:         str
    new_name:         str
    category:         str
    office:           str
    version:          str
    effectivity_date: str

class AccreditationUploadRequest(BaseModel):
    document_name: str
    program:       str
    area_code:     str
    category:      str = "Accreditation Evidence"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class UpdatePasswordRequest(BaseModel):
    email:        EmailStr
    new_password: str

class UserCreateRequest(BaseModel):
    full_name: str
    email:     str
    role:      str
    password:  str

class ChangePasswordRequest(BaseModel):
    email: str
    current_password: str
    new_password: str

class UpdateProfileRequest(BaseModel):
    email: str       # The current email (to find them in the database)
    new_email: str   # The new email they want to change to
    full_name: str
    program: str

class AccessLogRequest(BaseModel):
    document_name: str
    action_type:   str
    user_email:    str
    user_role:     str

# Notification schemas
class NotificationCreate(BaseModel):
    user_email: str
    type:       str
    title:      str
    message:    str

class NotificationOut(BaseModel):
    id:         int
    user_email: str
    type:       str
    title:      str
    message:    str
    is_read:    bool
    created_at: str

# ── FIXED BroadcastRequest ───────────────────────────────────────
# target_role = "ALL" | "STUDENT" | "FACULTY"
# Admin is excluded from mass broadcasts — they manage the system.
class BroadcastRequest(BaseModel):
    title:       str
    message:     str
    target_role: str = "ALL"   # default: send to everyone (non-admin)
    sender_email: str = ""


# ─────────────────────────────────────────────────────────────────────────────
# APP SETUP
# ─────────────────────────────────────────────────────────────────────────────

class SendOTPRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: EmailStr
    otp_code: str

class AccreditationReviewRequest(BaseModel):
    document_name: str
    status: str # "Approved" or "Needs Revision"
    feedback: str = ""


# --- SETTINGS SCHEMAS ---
class SettingsSchema(BaseModel):
    platform_name: str
    campus: str
    admin_email: str
    jwt_expiration: int
    otp_expiration: int
    ai_model: str
    ai_temperature: float
    ai_system_prompt: str
    rag_max_chunks: int

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CTU Institutional Knowledge System API",
    description="Backend for the RAG-Powered Quality Assurance System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────────────────────────────────────
# HEALTH
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/")
def read_root():
    return {"message": "Welcome to the CTU Knowledge System API! The server is running perfectly."}

@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        users_count = db.query(models.User).count()
        return {"status": "Success", "message": f"Connected to Supabase! Current users: {users_count}"}
    except Exception as e:
        return {"status": "Failed", "error": str(e)}
    
@app.post("/auth/send-otp")
def send_otp(req: SendOTPRequest, db: Session = Depends(get_db)):
    # 1. Check if email is already taken
    existing_user = db.query(models.User).filter(models.User.email == req.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="This email is already registered.")

    # 2. Generate OTP and Expiration
    otp = utils.generate_otp()
    expiration = datetime.utcnow() + timedelta(minutes=10)

    # 3. Update or create OTP record
    record = db.query(models.OTPVerification).filter(models.OTPVerification.email == req.email).first()
    if record:
        record.otp_code = otp
        record.expires_at = expiration
    else:
        record = models.OTPVerification(email=req.email, otp_code=otp, expires_at=expiration)
        db.add(record)
    db.commit()

    # 4. Send Email
    try:
        utils.send_otp_email(req.email, otp)
        return {"message": "Verification code sent to email."}
    except Exception as e:
        print(f"SMTP Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to send verification email. Please try again.")

@app.post("/auth/verify-otp")
def verify_otp(req: VerifyOTPRequest, db: Session = Depends(get_db)):
    record = db.query(models.OTPVerification).filter(models.OTPVerification.email == req.email).first()
    
    if not record or record.otp_code != req.otp_code:
        raise HTTPException(status_code=400, detail="Invalid verification code.")
    
    if datetime.utcnow() > record.expires_at:
        raise HTTPException(status_code=400, detail="This verification code has expired. Please request a new one.")

    return {"message": "Email verified successfully!"}
    

# ─────────────────────────────────────────────────────────────────────────────
# AUTH — REGISTER
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Duplicate check
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash password — students are auto-verified, faculty require admin approval
    hashed_pwd  = utils.hash_password(user.password)
    auto_verify = user.role.upper() == "STUDENT"

    # 3. Persist user
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role=user.role.upper(),
        department=user.department,
        is_verified=auto_verify
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. Student profile
    if user.role.upper() == "STUDENT":
        new_student_profile = models.StudentProfile(
            user_id=new_user.id,
            course=user.course,
            year_level=user.year
        )
        db.add(new_student_profile)
        db.commit()

    # 5. Audit log
    try:
        supabase.table("system_events_logs").insert({
            "user_email":  new_user.email,
            "event_type":  "Account Creation",
            "description": f"New {new_user.role} account registered: {new_user.full_name}"
        }).execute()
    except Exception as exc:
        print(f"[register] audit log failed: {exc}")

    # 6. Notifications — role-specific, correct recipients only
    role_upper = new_user.role  # already uppercased above

    if role_upper == "FACULTY":
        # ── Tell the registering faculty member their status ──
        _send_notification(
            user_email=new_user.email,
            n_type="info",
            title="Account Pending Verification",
            message=(
                f"Hi {new_user.full_name or 'there'}! Your faculty account has been registered "
                "and is awaiting administrator verification. You'll be notified once approved."
            ),
        )
        # ── Notify ONLY admins (NOT other faculty, NOT students) ──
        _notify_all_admins(
            db=db,
            n_type="warning",
            title="New Faculty Awaiting Verification",
            message=(
                f"{new_user.full_name} ({new_user.email}) has registered as Faculty "
                "and is pending your verification. Go to Users & Roles to accept or decline."
            ),
        )

    elif role_upper == "STUDENT":
        # ── Welcome the student ──
        _send_notification(
            user_email=new_user.email,
            n_type="success",
            title="Welcome to CTU Argao KMS!",
            message=(
                f"Hi {new_user.full_name or 'there'}! Your student account is active. "
                "You can now access the Knowledge Repository, Ask Policy, and more."
            ),
        )
        # ── Notify ONLY admins (NOT faculty, NOT other students) ──
        _notify_all_admins(
            db=db,
            n_type="info",
            title="New Student Registered",
            message=(
                f"{new_user.full_name} ({new_user.email}) has created a new student account."
            ),
        )

    return new_user


# ─────────────────────────────────────────────────────────────────────────────
# AUTH — LOGIN
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()

    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status == "Disabled":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been disabled. Please contact the system administrator."
        )

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Faculty account is currently pending Admin verification."
        )

    access_token = utils.create_access_token(data={"sub": user.email})

    # Audit log
    try:
        supabase.table("system_events_logs").insert({
            "user_email":  user.email,
            "event_type":  "Authentication",
            "description": "User successfully logged in"
        }).execute()
    except Exception as exc:
        print(f"[login] audit log failed: {exc}")

    user_dept = user.department
    if user.role == "STUDENT" and user.student_profile:
        user_dept = user.student_profile.course
    if not user_dept:
        user_dept = "ADMIN" if user.role == "ADMIN" else "Unassigned"

    return {
        "access_token": access_token,
        "token_type":   "bearer",
        "full_name":    user.full_name or "CTU User",
        "email":        user.email,
        "role":         user.role,
        "department":   user_dept,
    }


# ─────────────────────────────────────────────────────────────────────────────
# PASSWORD RESET
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/send-reset-email")
def send_reset_email(request: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Email not found")

    try:
        utils.send_forgot_password_email(user.email)
        return {"message": "Success! Please check your email for the reset link."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")


@app.post("/update-password")
def update_password(request: UpdatePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found in records")

    try:
        user.hashed_password = utils.hash_password(request.new_password)
        db.add(user)
        db.commit()
        db.refresh(user)

        _send_notification(
            user_email=request.email,
            n_type="warning",
            title="Password Changed",
            message=(
                "Your account password was recently changed. "
                "If you did not do this, contact the administrator immediately."
            ),
        )

        return {"message": "Password updated successfully!"}
    except Exception as e:
        db.rollback()
        print(f"CRITICAL DB ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update database")


# ─────────────────────────────────────────────────────────────────────────────
# USER MANAGEMENT
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


@app.put("/users/{user_id}/verify")
def verify_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_verified = True
    db.commit()

    # Notify the faculty member — their account is now active
    _send_notification(
        user_email=user.email,
        n_type="success",
        title="Account Verified — You Can Now Log In",
        message=(
            "Your faculty account has been verified by the administrator. "
            "You now have full access to the CTU Argao Knowledge Management System."
        ),
    )

    return {"message": "User approved successfully!"}


@app.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User rejected and removed successfully!"}


@app.put("/users/{user_id}/disable")
def disable_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "Disabled"
    db.commit()

    _send_notification(
        user_email=user.email,
        n_type="error",
        title="Account Disabled",
        message=(
            "Your account has been disabled by the system administrator. "
            "Please contact admin@ctu.edu.ph for assistance."
        ),
    )

    return {"message": f"Account for {user.full_name or user.email} has been disabled!"}


@app.put("/users/{user_id}/enable")
def enable_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.status = "Active"
    db.commit()

    _send_notification(
        user_email=user.email,
        n_type="success",
        title="Account Re-enabled",
        message=(
            "Your account has been re-enabled by the administrator. "
            "You can now log in to the system."
        ),
    )

    return {"message": f"Account for {user.full_name or user.email} has been re-enabled!"}


@app.post("/users")
def create_user_admin(request: UserCreateRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with that email already exists.")

    hashed_pwd = utils.hash_password(request.password)

    new_user = models.User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_pwd,
        role=request.role.upper(),
        department="ADMIN" if request.role.upper() == "ADMIN" else "Unassigned",
        is_verified=True
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if request.role.upper() == "STUDENT":
        new_student_profile = models.StudentProfile(
            user_id=new_user.id,
            course="BSIT",
            year_level=1
        )
        db.add(new_student_profile)
        db.commit()

    # Notify the new user their account is ready
    _send_notification(
        user_email=new_user.email,
        n_type="success",
        title="Account Created by Administrator",
        message=(
            f"Your {request.role.capitalize()} account was created by the Administrator. "
            "You can now log in to the CTU Argao Knowledge Management System."
        ),
    )

    return {"message": f"{request.role.capitalize()} {request.full_name} created successfully!"}


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS — UPLOAD
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/upload-document")
async def upload_document(
    file:             UploadFile = File(...),
    name:             str = Form(...),
    category:         str = Form(...),
    office:           str = Form(...),
    version:          str = Form(...),
    effectivity_date: str = Form(...),
    uploaded_by:      str = Form(None),   # pass userEmail from the frontend
    db: Session = Depends(get_db),        # ← added so we can fan-out notifications
):
    contents       = await file.read()
    extracted_text = ""

    try:
        filename_lower = file.filename.lower()

        if filename_lower.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        elif filename_lower.endswith(".txt"):
            extracted_text = contents.decode("utf-8")
        elif filename_lower.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(contents))
            extracted_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from document.")

        safe_filename   = file.filename.replace(" ", "_")
        unique_filename = f"{int(time.time())}_{safe_filename}"

        supabase.storage.from_("documents").upload(
            file=contents,
            path=unique_filename,
            file_options={"content-type": "application/pdf"}
        )
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)

        metadata = {
            "name":             name,
            "category":         category,
            "office":           office,
            "version":          version,
            "effectivity_date": effectivity_date,
            "upload_date":      datetime.now().isoformat(),
            "file_url":         public_url,
            "status":           "Active",
            "uploaded_by":      uploaded_by or "Unknown",
        }

        chunks_count = vector_store.add_to_vector_db(extracted_text, metadata)

        # ── Notify admins ──
        _notify_all_admins(
            db=db,
            n_type="info",
            title="New Document Added to Repository",
            message=f"'{name}' (v{version}) was uploaded under {office} — {category}.",
        )

        # ── Notify all faculty and students ──
        _notify_non_admin(
            db=db,
            n_type="info",
            title="New Document Available",
            message=(
                f"A new document '{name}' (v{version}) has been added to the "
                f"Knowledge Repository under {category}. Check it out now."
            ),
        )

        return {
            "message": f"Successfully processed {name}!",
            "details": f"Created {chunks_count} searchable vector chunks and saved file to Storage."
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during processing.")


@app.post("/upload-new-version")
async def upload_new_version(
    file:                 UploadFile = File(...),
    old_document_name:    str = Form(...),
    new_version:          str = Form(...),
    new_effectivity_date: str = Form(...),
    uploaded_by:          str = Form(None),
    db: Session = Depends(get_db),
):
    try:
        res = supabase.table("document_sections").select("metadata").eq("metadata->>name", old_document_name).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Old document not found in database.")

        old_metadata = res.data[0]['metadata']
        category     = old_metadata.get("category", "Policy")
        office       = old_metadata.get("office",   "Academic Affairs")

        old_chunks_res = supabase.table("document_sections").select("id, metadata").eq("metadata->>name", old_document_name).execute()
        if old_chunks_res.data:
            for chunk in old_chunks_res.data:
                chunk_meta           = chunk['metadata']
                chunk_meta['status'] = "Archived"
                supabase.table("document_sections").update({"metadata": chunk_meta}).eq("id", chunk['id']).execute()

        contents       = await file.read()
        extracted_text = ""
        filename_lower = file.filename.lower()

        if filename_lower.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        elif filename_lower.endswith(".txt"):
            extracted_text = contents.decode("utf-8")
        elif filename_lower.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(contents))
            extracted_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text.")

        safe_filename   = file.filename.replace(" ", "_")
        unique_filename = f"v{new_version}_{int(time.time())}_{safe_filename}"

        supabase.storage.from_("documents").upload(
            file=contents,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)

        new_metadata = {
            "name":             old_document_name,
            "category":         category,
            "office":           office,
            "version":          new_version,
            "effectivity_date": new_effectivity_date,
            "upload_date":      datetime.now().isoformat(),
            "file_url":         public_url,
            "status":           "Active",
            "uploaded_by":      uploaded_by or "Unknown",
        }

        vector_store.add_to_vector_db(extracted_text, new_metadata)

        # ── Notify admins ──
        _notify_all_admins(
            db=db,
            n_type="info",
            title="Document Updated to New Version",
            message=(
                f"'{old_document_name}' has been updated to v{new_version}. "
                "The previous version has been archived automatically."
            ),
        )

        # ── Notify all faculty and students ──
        _notify_non_admin(
            db=db,
            n_type="info",
            title="Document Updated",
            message=(
                f"'{old_document_name}' has been updated to version {new_version}. "
                "The latest version is now available in the Knowledge Repository."
            ),
        )

        return {"message": "New version uploaded successfully and old version archived!"}

    except Exception as e:
        print(f"Update version error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS — LIST
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/documents")
def get_documents():
    try:
        res = supabase.table("document_sections").select("metadata").execute()

        unique_docs = {}
        if res.data:
            for row in res.data:
                meta = row.get("metadata", {})
                if isinstance(meta, str):
                    try:    meta = json.loads(meta)
                    except: meta = {}

                name = meta.get("name")
                if not name or name in unique_docs:
                    continue

                unique_docs[name] = {
                    "name":             name,
                    "category":         meta.get("category",         ""),
                    "office":           meta.get("office",           ""),
                    "version":          meta.get("version",          "1.0"),
                    "effectivity_date": meta.get("effectivity_date", ""),
                    "status":           meta.get("status",           "Active"),
                    "file_url":         meta.get("file_url",         ""),
                    "upload_date":      meta.get("upload_date",      ""),
                    "uploaded_by":      meta.get("uploaded_by",      "Unknown"),
                }

        return list(unique_docs.values())

    except Exception as e:
        print(f"[get_documents] error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch documents")



# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS — UPDATE METADATA
# ─────────────────────────────────────────────────────────────────────────────

@app.put("/documents/update")
def update_document(request: UpdateDocumentRequest, db: Session = Depends(get_db)):
    try:
        res = supabase.table("document_sections").select("metadata").eq("metadata->>name", request.old_name).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document not found")

        base_metadata = res.data[0]['metadata']

        base_metadata["name"]             = request.new_name
        base_metadata["category"]         = request.category
        base_metadata["office"]           = request.office
        base_metadata["version"]          = request.version
        base_metadata["effectivity_date"] = request.effectivity_date

        supabase.table("document_sections").update({"metadata": base_metadata}).eq("metadata->>name", request.old_name).execute()

        # ── Notify faculty and students of the edit ──
        if request.old_name != request.new_name:
            doc_label = f"'{request.old_name}' (renamed to '{request.new_name}')"
        else:
            doc_label = f"'{request.new_name}'"

        _notify_non_admin(
            db=db,
            n_type="info",
            title="Document Information Updated",
            message=(
                f"{doc_label} has been updated in the Knowledge Repository. "
                "The latest details are now available."
            ),
        )

        return {"message": "Document metadata updated successfully!"}
    except Exception as e:
        print(f"Update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update document")


# ─────────────────────────────────────────────────────────────────────────────
# DOCUMENTS — ARCHIVE / DELETE
# ─────────────────────────────────────────────────────────────────────────────

@app.delete("/documents/{doc_name}")
def archive_document(doc_name: str, db: Session = Depends(get_db)):
    try:
        chunks_res = supabase.table("document_sections").select("id, metadata").eq("metadata->>name", doc_name).execute()

        if not chunks_res.data:
            raise HTTPException(status_code=404, detail="Document not found in the database.")

        for chunk in chunks_res.data:
            chunk_meta           = chunk['metadata']
            chunk_meta['status'] = "Archived"
            supabase.table("document_sections").update({"metadata": chunk_meta}).eq("id", chunk['id']).execute()

        # ── Notify faculty and students the document has been removed ──
        _notify_non_admin(
            db=db,
            n_type="warning",
            title="Document Removed from Repository",
            message=(
                f"'{doc_name}' has been archived and is no longer available "
                "in the Knowledge Repository."
            ),
        )

        return {"message": f"Document '{doc_name}' successfully archived and removed from active AI context!"}

    except Exception as e:
        print(f"Archive error: {e}")
        raise HTTPException(status_code=500, detail="Failed to archive document")


# ─────────────────────────────────────────────────────────────────────────────
# ASK POLICY
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/ask-policy")
def ask_policy(request: QuestionRequest, db: Session = Depends(get_db)):
    question = request.question

    # 1. Fetch Dynamic System Settings
    settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
    
    # Fallback defaults just in case the database hasn't initialized
    ai_model = settings.ai_model if settings else "llama-3.1-8b-instant"
    ai_temperature = settings.ai_temperature if settings else 0.3
    ai_prompt_base = settings.ai_system_prompt if settings else "You are the friendly AI Policy Assistant for CTU."
    rag_limit = settings.rag_max_chunks if settings else 5

    try:
        topic   = "General"
        q_lower = question.lower()
        if len(question.split()) <= 2 or any(w in q_lower for w in ["test", "asdf"]):
            topic = "Ignored"
        elif "grade" in q_lower or "pass" in q_lower or "fail" in q_lower or "unit" in q_lower: topic = "Grading"
        elif "research" in q_lower or "publish" in q_lower or "incentive" in q_lower: topic = "Research"
        elif "faculty" in q_lower or "teacher" in q_lower or "leave" in q_lower: topic = "Faculty"
        elif "admission" in q_lower or "enroll" in q_lower or "shift" in q_lower: topic = "Admissions"
        elif "uniform" in q_lower or "dress" in q_lower or "id" in q_lower: topic = "Dress Code"

        supabase.table("query_logs").insert({
            "query_text":     question,
            "topic_category": topic
        }).execute()
    except Exception as e:
        print(f"Failed to log query: {e}")
    
    # 2. Vector Search (Pass the dynamic rag_limit if your vector_store supports it!)
    # NOTE: If your vector_store.py doesn't accept 'limit', just use: vector_store.search_knowledge(question)
    try:
        relevant_chunks = vector_store.search_knowledge(question, limit=rag_limit)
    except TypeError:
        # Fallback if your vector_store function isn't expecting a limit argument yet
        relevant_chunks = vector_store.search_knowledge(question)
    
    # --- SUPERCHARGED AI FILTERING ---
    safe_chunks = []
    for chunk in relevant_chunks:
        chunk_meta = chunk.get('metadata', {})

        if isinstance(chunk_meta, str):
            try:    chunk_meta = json.loads(chunk_meta)
            except: chunk_meta = {}

        chunk_status   = chunk_meta.get("status",   "Active")
        chunk_category = chunk_meta.get("category", "")

        if str(chunk_status).lower() == "archived":
            continue
        if request.user_role.upper() not in ["FACULTY", "ADMIN"] and chunk_category == "Accreditation Evidence":
            continue

        safe_chunks.append(chunk)

    if not safe_chunks:
        return {
            "answer": (
                "I couldn't find a specific policy or document that answers your question. "
                "For the most accurate information, please contact the Academic Affairs Office "
                "or check the official CTU Student Handbook."
            ),
            "sources": []
        }

    context = "\n\n".join([
        f"[Source: {c.get('metadata', {}).get('name', 'CTU Document')}]\n{c.get('content', '')}"
        for c in safe_chunks
    ])

    prompt = f"""You are the official AI Policy Assistant for Cebu Technological University (CTU) Argao Campus.
Your ONLY job is to answer questions based on the provided CTU policy documents.

RULES:
1. ONLY use information from the provided context below.
2. If the answer is not in the context, say: "I couldn't find a specific policy on this. Please contact the Academic Affairs Office."
3. Be direct, professional, and concise.
4. Always cite which document your answer comes from.

CONTEXT FROM CTU DOCUMENTS:
{context}

STUDENT QUESTION: {question}

ANSWER:"""

    try:
        # 4. Inject Dynamic Model and Temperature
        response = groq_client.chat.completions.create(
            messages=[
                {'role': 'system', 'content': ai_prompt_base},
                {'role': 'user', 'content': prompt}
            ],
            model=ai_model,
            temperature=ai_temperature
        )
        answer = response.choices[0].message.content

        sources = list({
            c.get('metadata', {}).get('name', 'CTU Document')
            for c in safe_chunks
        })

        try:
            supabase.table("chat_history").insert({
                "user_email": request.user_email,
                "user_role":  request.user_role,
                "role":       "user",
                "content":    question,
            }).execute()
            supabase.table("chat_history").insert({
                "user_email": request.user_email,
                "user_role":  request.user_role,
                "role":       "assistant",
                "content":    answer,
            }).execute()
        except Exception as e:
            print(f"Chat history save failed: {e}")

        return {"answer": answer, "sources": sources}

    except groq.RateLimitError:
        raise HTTPException(
            status_code=429,
            detail="The AI is currently busy. Please wait a moment and try again."
        )
    except Exception as e:
        print(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable.")


# ─────────────────────────────────────────────────────────────────────────────
# BROADCAST ANNOUNCEMENT  ← FIXED
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/admin/broadcast")
def broadcast_notification(request: BroadcastRequest, db: Session = Depends(get_db)):
    """
    Send an announcement notification to users by role.
    target_role = "ALL"     → FACULTY + STUDENT (not admins)
    target_role = "STUDENT" → students only
    target_role = "FACULTY" → faculty only

    Admins are deliberately excluded — they are the senders, not receivers.
    The admin who sends it gets a confirmation notification instead.
    """
    try:
        sent = 0

        if request.target_role.upper() in ("ALL", "EVERYONE"):
            # Faculty + Students
            users = (
                db.query(models.User)
                .filter(
                    models.User.role.in_(["FACULTY", "STUDENT"]),
                    models.User.status != "Disabled"
                )
                .all()
            )
        else:
            users = (
                db.query(models.User)
                .filter(
                    models.User.role == request.target_role.upper(),
                    models.User.status != "Disabled"
                )
                .all()
            )

        for user in users:
            _send_notification(
                user_email=user.email,
                n_type="info",
                title=f"📢 {request.title}",
                message=request.message,
            )
            sent += 1

        # ── Confirm back to the sending admin ──
        if request.sender_email:
            _send_notification(
                user_email=request.sender_email,
                n_type="success",
                title="Announcement Sent",
                message=(
                    f"Your announcement '{request.title}' was successfully "
                    f"delivered to {sent} user(s)."
                ),
            )

        # ── Log the broadcast ──
        try:
            supabase.table("system_events_logs").insert({
                "user_email":  request.sender_email or "admin",
                "event_type":  "Broadcast Announcement",
                "description": f"Announcement '{request.title}' sent to {sent} {request.target_role} user(s)."
            }).execute()
        except Exception as exc:
            print(f"[broadcast] audit log failed: {exc}")

        return {
            "message": f"Broadcast sent to {sent} {request.target_role} user(s).",
            "sent":    sent
        }

    except Exception as e:
        print(f"[broadcast] error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# SYSTEM STATS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/system-stats")
def get_system_stats(role: str = "STUDENT", db: Session = Depends(get_db)):
    import json

    total_docs    = 0
    total_users   = 0
    total_queries = 0

    try:
        total_users = db.query(models.User).count()
    except Exception as e:
        print(f"User count error: {e}")

    try:
        docs_response = supabase.table("document_sections").select("metadata").execute()
        unique_docs   = set()
        if docs_response.data:
            for row in docs_response.data:
                meta = row.get("metadata", {})

                if isinstance(meta, str):
                    try:    meta = json.loads(meta)
                    except: meta = {}

                doc_name = meta.get("document_name") or meta.get("title") or meta.get("name") or meta.get("file_name") or meta.get("source")
                category = meta.get("category", "")
                status   = meta.get("status", "Active")

                if doc_name:
                    if str(status).lower() == "archived":
                        continue
                    if role.upper() not in ["FACULTY", "ADMIN"] and category == "Accreditation Evidence":
                        continue
                    unique_docs.add(doc_name)

        total_docs = len(unique_docs)
    except Exception as e:
        print(f"Document count error: {e}")

    try:
        query_response = supabase.table("chat_history").select("id").eq("role", "user").execute()
        total_queries  = len(query_response.data) if query_response.data else 0
    except Exception as e:
        print(f"Chat count error: {e}")

    return {
        "documents": total_docs,
        "users":     total_users,
        "queries":   total_queries,
    }


# ─────────────────────────────────────────────────────────────────────────────
# FEEDBACK
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    try:
        supabase.table("feedback_logs").insert({
            "question_text": request.question,
            "ai_response":   request.answer,
            "is_helpful":    request.is_helpful
        }).execute()
        return {"status": "success", "message": "Feedback recorded!"}
    except Exception as e:
        print(f"Failed to log feedback: {e}")
        return {"status": "error", "message": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# CHAT HISTORY
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/chat-history")
def get_chat_history(email: str):
    seven_days_ago = (datetime.now() - timedelta(days=7)).isoformat()

    try:
        response = supabase.table("chat_history")\
            .select("*")\
            .eq("user_email", email)\
            .gte("created_at", seven_days_ago)\
            .order("created_at", desc=False)\
            .execute()
        return response.data
    except Exception as e:
        print(f"Error fetching history: {e}")
        return []



# ─────────────────────────────────────────────────────────────────────────────
# ACCREDITATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/upload-accreditation-evidence")
async def upload_accreditation_evidence(
    file:                UploadFile = File(...),
    document_name:       str = Form(...),
    program:             str = Form(...),
    area_code:           str = Form(...),
    requirement_target:  str = Form(...),
    uploaded_by:         str = Form(None),
):
    import time, io, PyPDF2
    from datetime import datetime

    try:
        contents       = await file.read()
        extracted_text = ""
        filename_lower = file.filename.lower()

        if filename_lower.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text: extracted_text += text + "\n"
        elif filename_lower.endswith(".txt"):
            extracted_text = contents.decode("utf-8")
        elif filename_lower.endswith(".docx"):
            import docx
            doc = docx.Document(io.BytesIO(contents))
            extracted_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text.")

        safe_filename   = file.filename.replace(" ", "_")
        unique_filename = f"evid_{int(time.time())}_{safe_filename}"

        supabase.storage.from_("documents").upload(
            file=contents, path=unique_filename, file_options={"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)

        metadata = {
            "name": document_name,
            "category": "Accreditation Evidence",
            "office": "Quality Assurance",
            "version": "1.0",
            "status": "Pending", # <--- NEW: Defaults to Pending!
            "program": program,
            "area_code": area_code,
            "requirement_target": requirement_target, 
            "uploaded_by": uploaded_by, # <--- NEW: Track the faculty member
            "admin_feedback": "",
            "upload_date": datetime.now().isoformat(),
            "file_url": public_url
        }

        vector_store.add_to_vector_db(extracted_text, metadata)

        # --- SILENT AUDIT LOG ---
        try:
            from vector_store import supabase
            supabase.table("system_events_logs").insert({
                "user_email": uploaded_by, # We use the uploader's name/email here
                "event_type": "Accreditation Upload",
                "description": f"Uploaded '{document_name}' for {program} ({area_code}) - Pending Review"
            }).execute()
        except Exception as e:
            print(f"Failed to log accreditation upload: {e}")
        # ------------------------

        return {"message": "Evidence successfully uploaded and is pending Admin review!"}

    except Exception as e:
        print(f"Evidence upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: ADMIN REVIEW QUEUE ROUTE ---
@app.get("/admin/accreditation-pending")
def get_pending_accreditation():
    from vector_store import supabase
    try:
        res = supabase.table("document_sections").select("metadata").eq("metadata->>category", "Accreditation Evidence").eq("metadata->>status", "Pending").execute()
        
        unique_docs = {}
        if res.data:
            for item in res.data:
                meta = item.get('metadata', {})
                doc_name = meta.get('name')
                if doc_name and doc_name not in unique_docs:
                    unique_docs[doc_name] = {
                        "name": doc_name,
                        "program": meta.get('program', 'Unknown'),
                        "area_code": meta.get('area_code', 'Unknown'),
                        "target": meta.get('requirement_target', 'Unknown'),
                        "uploaded_by": meta.get('uploaded_by', 'Faculty Member'),
                        "date": meta.get('upload_date', '').split('T')[0],
                        "url": meta.get('file_url')
                    }
        return list(unique_docs.values())
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch pending queue")

# --- NEW: ADMIN APPROVAL/REJECTION ROUTE ---
@app.post("/admin/accreditation-review")
def review_accreditation(req: AccreditationReviewRequest):
    from vector_store import supabase
    try:
        # Fetch all chunks of this document
        chunks_res = supabase.table("document_sections").select("id, metadata").eq("metadata->>name", req.document_name).execute()
        
        if not chunks_res.data:
            raise HTTPException(status_code=404, detail="Document not found")

        # Update status and feedback for all chunks
        for chunk in chunks_res.data:
            chunk_meta = chunk['metadata']
            chunk_meta['status'] = req.status
            chunk_meta['admin_feedback'] = req.feedback
            
            supabase.table("document_sections").update({"metadata": chunk_meta}).eq("id", chunk['id']).execute()

        # --- SILENT AUDIT LOG ---
        try:
            action_desc = f"Admin marked '{req.document_name}' as {req.status}."
            if req.status == "Needs Revision":
                action_desc += f" Feedback: {req.feedback}"
                
            supabase.table("system_events_logs").insert({
                "user_email": "System Admin", # Can be dynamic if you pass admin email
                "event_type": "QA Review",
                "description": action_desc
            }).execute()
        except Exception as e:
            print(f"Failed to log QA Review: {e}")
        # ------------------------

        return {"message": f"Document successfully marked as {req.status}!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to process review")

# 2. THE UPDATED STATUS ROUTE (Only counts Approved docs!)
@app.get("/accreditation-status/{program}")
def get_accreditation_status(program: str):
    try:
        # NOTICE: We changed "Active" to "Approved" so Pending docs don't artificially inflate the score!
        res = supabase.table("document_sections").select("metadata").eq("metadata->>category", "Accreditation Evidence").eq("metadata->>program", program).eq("metadata->>status", "Approved").execute()
        
        fulfilled_reqs = {}
        if res.data:
            for item in res.data:
                meta = item.get('metadata', {})
                area = meta.get('area_code')
                req_target = meta.get('requirement_target')
                
                if area and req_target:
                    if area not in fulfilled_reqs:
                        fulfilled_reqs[area] = set()
                    fulfilled_reqs[area].add(req_target)

        AREA_TEMPLATES = {
            "Area I":    ["Approved Board Resolution of VMGO", "Dissemination Evidence (Photos, Memos)", "Stakeholder Awareness Survey Rating"],
            "Area II":   ["Faculty Manual", "201 Files / Credentials of Faculty", "Faculty Development Plan", "Summary of Faculty Workload and Loading"],
            "Area III":  ["CMO / Syllabi for all subjects", "Curriculum Map", "Sample Exams and Rubrics"],
            "Area IV":   ["Student Handbook", "Guidance and Counseling Reports", "Student Organization Activities"],
            "Area V":    ["Institutional Research Agenda", "Published Research Papers", "Research Incentives Memo"],
            "Area VI":   ["Extension Program Plan", "MOA/MOU with Partner Communities", "Impact Assessment Report"],
            "Area VII":  ["Library Manual", "Inventory of Books and Journals", "Library Utilization Reports"],
            "Area VIII": ["Campus Development Plan", "Building Permits and Fire Safety Certs", "Maintenance Logs"],
            "Area IX":   ["Laboratory Manuals", "Inventory of Equipment", "Safety and Hazard Protocols"],
            "Area X":    ["Organizational Chart", "Strategic Plan", "Financial Audit Reports"],
        }

        AREA_TITLES = {
            "Area I":    "Vision, Mission, Goals and Objectives",
            "Area II":   "Faculty",
            "Area III":  "Curriculum and Instruction",
            "Area IV":   "Support to Students",
            "Area V":    "Research",
            "Area VI":   "Extension and Community Involvement",
            "Area VII":  "Library",
            "Area VIII": "Physical Plant and Facilities",
            "Area IX":   "Laboratories",
            "Area X":    "Administration",
        }

        areas_list = []
        total_req  = 0
        total_ev   = 0

        for code, reqs in AREA_TEMPLATES.items():
            required_count = len(reqs)
            ev_count       = len(fulfilled_reqs.get(code, set()))
            capped_ev      = min(ev_count, required_count)
            total_req     += required_count
            total_ev      += capped_ev
            comp           = int((capped_ev / required_count) * 100) if required_count > 0 else 0

            areas_list.append({
                "id":            code.replace(" ", ""),
                "code":          code,
                "title":         AREA_TITLES.get(code, "General Area"),
                "compliance":    comp,
                "required":      required_count,
                "evidenceCount": ev_count,
                "gaps":          max(0, required_count - ev_count),
            })

        overall = int((total_ev / total_req) * 100) if total_req > 0 else 0

        return {
            "level":    "Level III" if program == "BSIT" else "Level II",
            "overall":  overall,
            "gaps":     total_req - total_ev,
            "evidence": total_ev,
            "areas":    areas_list,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to calculate status")


@app.get("/accreditation-details/{program}/{area_code}")
def get_accreditation_details(program: str, area_code: str):
    try:
        response = supabase.table("document_sections")\
            .select("metadata")\
            .eq("metadata->>category", "Accreditation Evidence")\
            .eq("metadata->>program",  program)\
            .eq("metadata->>area_code", area_code)\
            .execute()

        unique_docs       = {}
        fulfilled_targets = set()

        if response.data:
            for item in response.data:
                meta = item.get('metadata', {})
                if meta.get('status') == "Archived": continue
                
                doc_name = meta.get('name')
                req_target = meta.get('requirement_target') 
                doc_status = meta.get('status', 'Pending')
                
                # ONLY mark as fulfilled if it is Approved!
                if req_target and doc_status == "Approved":
                    fulfilled_targets.add(req_target) 
                
                if doc_name and doc_name not in unique_docs:
                    unique_docs[doc_name] = {
                        "name": doc_name,
                        "date": meta.get('upload_date', '').split('T')[0] if 'upload_date' in meta else 'Recently',
                        "url": meta.get('file_url') or meta.get('source', '#'),
                        "target": req_target or "Uncategorized",
                        "status": doc_status, # <--- Pass the status to the React UI
                        "feedback": meta.get('admin_feedback', '')
                    }

        uploaded_files = list(unique_docs.values())

        AREA_TEMPLATES = {
            "Area I":    ["Approved Board Resolution of VMGO", "Dissemination Evidence (Photos, Memos)", "Stakeholder Awareness Survey Rating"],
            "Area II":   ["Faculty Manual", "201 Files / Credentials of Faculty", "Faculty Development Plan", "Summary of Faculty Workload and Loading"],
            "Area III":  ["CMO / Syllabi for all subjects", "Curriculum Map", "Sample Exams and Rubrics"],
            "Area IV":   ["Student Handbook", "Guidance and Counseling Reports", "Student Organization Activities"],
            "Area V":    ["Institutional Research Agenda", "Published Research Papers", "Research Incentives Memo"],
            "Area VI":   ["Extension Program Plan", "MOA/MOU with Partner Communities", "Impact Assessment Report"],
            "Area VII":  ["Library Manual", "Inventory of Books and Journals", "Library Utilization Reports"],
            "Area VIII": ["Campus Development Plan", "Building Permits and Fire Safety Certs", "Maintenance Logs"],
            "Area IX":   ["Laboratory Manuals", "Inventory of Equipment", "Safety and Hazard Protocols"],
            "Area X":    ["Organizational Chart", "Strategic Plan", "Financial Audit Reports"],
        }

        template_reqs = AREA_TEMPLATES.get(area_code, [])
        requirements  = []
        for index, req_text in enumerate(template_reqs):
            requirements.append({
                "id":     index + 1,
                "text":   req_text,
                "is_met": req_text in fulfilled_targets,
            })

        return {
            "requirements":  requirements,
            "uploadedFiles": sorted(uploaded_files, key=lambda x: x['date'], reverse=True),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch details")


# ─────────────────────────────────────────────────────────────────────────────
# AUDIT TRAIL
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/audit/queries")
def get_query_logs():
    try:
        response = supabase.table("chat_history").select("*").eq("role", "user").order("created_at", desc=True).limit(100).execute()

        logs = []
        if response.data:
            for index, item in enumerate(response.data):
                raw_date       = item.get("created_at", "")
                formatted_date = "Unknown Date"
                if raw_date:
                    try:
                        dt             = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        formatted_date = dt.strftime("%B %d, %Y - %I:%M %p")
                    except:
                        formatted_date = raw_date.split("T")[0]

                logs.append({
                    "id":        item.get("id", index),
                    "user":      item.get("user_email", "Unknown User"),
                    "role":      item.get("user_role",  "User"),
                    "query":     item.get("content",    ""),
                    "timestamp": formatted_date,
                    "status":    "Answered",
                })

        return logs
    except Exception as e:
        print(f"Audit log error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch query logs")


@app.post("/audit/access")
def log_document_access(log: AccessLogRequest):
    try:
        supabase.table("document_access_logs").insert({
            "document_name": log.document_name,
            "action_type":   log.action_type,
            "user_email":    log.user_email,
            "user_role":     log.user_role,
        }).execute()
        return {"message": "Access successfully logged"}
    except Exception as e:
        print(f"Failed to log access: {e}")
        return {"message": "Silent failure - do not disrupt user experience"}


@app.get("/audit/access")
def get_access_logs():
    try:
        response = supabase.table("document_access_logs").select("*").order("accessed_at", desc=True).limit(100).execute()

        logs = []
        if response.data:
            for item in response.data:
                raw_date       = item.get("accessed_at", "")
                formatted_date = "Unknown Date"
                if raw_date:
                    try:
                        dt             = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        formatted_date = dt.strftime("%B %d, %Y - %I:%M %p")
                    except:
                        formatted_date = raw_date.split("T")[0]

                logs.append({
                    "id":        item.get("id"),
                    "user":      item.get("user_email",    "Unknown"),
                    "role":      item.get("user_role",     "User"),
                    "document":  item.get("document_name", "Unknown Document"),
                    "action":    item.get("action_type",   "Accessed"),
                    "timestamp": formatted_date,
                })
        return logs
    except Exception as e:
        print(f"Access log fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch access logs")


@app.get("/audit/versions")
def get_version_history():
    try:
        response  = supabase.table("document_sections").select("metadata").execute()
        raw_logs  = []

        if response.data:
            for item in response.data:
                meta     = item.get("metadata", {})
                doc_name = meta.get("name")
                version  = meta.get("version", "1.0")

                if doc_name:
                    raw_date       = meta.get("upload_date", "")
                    formatted_date = "Unknown Date"
                    if raw_date:
                        try:
                            dt             = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                            formatted_date = dt.strftime("%B %d, %Y - %I:%M %p")
                        except:
                            formatted_date = raw_date.split("T")[0]

                    raw_logs.append({
                        "document":  doc_name,
                        "version":   version,
                        "user":      meta.get("uploaded_by", "System Admin"),
                        "status":    meta.get("status", "Active"),
                        "timestamp": formatted_date,
                        "raw_date":  raw_date,
                    })

        raw_logs.sort(key=lambda x: x["raw_date"], reverse=True)

        unique_logs = []
        seen        = set()
        for idx, log in enumerate(raw_logs):
            identifier = f"{log['document']}_v{log['version']}"
            if identifier not in seen:
                seen.add(identifier)
                log["id"] = f"ver_{idx}"
                unique_logs.append(log)

        return unique_logs[:100]

    except Exception as e:
        print(f"Version log fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch version history")


@app.get("/audit/system")
def get_system_events():
    try:
        response = supabase.table("system_events_logs").select("*").order("event_date", desc=True).limit(100).execute()

        logs = []
        if response.data:
            for item in response.data:
                raw_date       = item.get("event_date", "")
                formatted_date = "Unknown Date"
                if raw_date:
                    try:
                        dt             = datetime.fromisoformat(raw_date.replace("Z", "+00:00"))
                        formatted_date = dt.strftime("%B %d, %Y - %I:%M %p")
                    except:
                        formatted_date = raw_date.split("T")[0]

                logs.append({
                    "id":          item.get("id"),
                    "user":        item.get("user_email",  "Unknown"),
                    "type":        item.get("event_type",  "System Event"),
                    "description": item.get("description", ""),
                    "timestamp":   formatted_date,
                })
        return logs
    except Exception as e:
        print(f"System log fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system events")


# ─────────────────────────────────────────────────────────────────────────────
# GRADE EVALUATION
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/evaluate-grades")
async def evaluate_grades(file: UploadFile = File(...)):
    try:
        content    = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        raw_text   = ""
        for page in pdf_reader.pages:
            raw_text += page.extract_text() + "\n"

        system_prompt = """
        You are a meticulous Academic Data Extractor for Cebu Technological University (CTU).
        Your job is to parse scrambled PDF text and extract subjects, units, and grades into a clean JSON structure.

        CRITICAL PARSING RULES FOR PDFs:
        1. PyPDF2 flattens tables. A subject row might look like: "CS46 FUNCTIONAL ENGLISH 3.00 01:00PM Wed CAS 3 1.6"
        2. UNITS are typically integers or decimals like 2.00, 3.00, or 5.00.
        3. GRADES are strictly between 1.0 and 5.0.
        4. DO NOT INVENT GRADES. If a subject does not have a clear grade (1.0 to 5.0) explicitly associated with it on its line, mark the grade as 0 and 'has_missing_grades' as true.
        5. If there are multiple grades on a single line, ALWAYS extract the LAST valid numerical grade on that line.

        You MUST respond with a pure JSON object in this EXACT format.
        {
          "semesters": [
            {
              "semester_name": "1st Semester SY 2023-2024",
              "subjects_scratchpad": [
                {"subject": "CS46 FUNCTIONAL ENGLISH", "units": 3.0, "grade": 1.6, "weighted_score": 4.8},
                {"subject": "CS47 ART APP", "units": 3.0, "grade": 0, "weighted_score": 0}
              ],
              "has_missing_grades": true
            }
          ],
          "summary": "2-3 sentences summarizing performance. Be direct using 'You'.",
          "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"]
        }
        """

        response    = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": f"Here is the raw text from the grade slip:\n\n{raw_text}"}
            ],
            temperature=0.1,
            response_format={"type": "json_object"}
        )

        result_json = response.choices[0].message.content
        return json.loads(result_json)

    except Exception as e:
        print(f"Grade Evaluation Error: {e}")
        raise HTTPException(status_code=500, detail="Failed to evaluate grades.")


# ─────────────────────────────────────────────────────────────────────────────
# NOTIFICATION SYSTEM ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/notifications", response_model=List[NotificationOut])
def get_notifications(email: str, filter: str = "all"):
    if not email:
        raise HTTPException(status_code=400, detail="email query param is required")

    try:
        query = (
            supabase.table("notifications")
            .select("*")
            .eq("user_email", email)
            .order("created_at", desc=True)
            .limit(100)
        )

        if filter == "unread":
            query = query.eq("is_read", False)

        response = query.execute()
        return response.data if response.data else []

    except Exception as e:
        print(f"[notifications] GET error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch notifications")


@app.get("/notifications/count")
def get_notification_count(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="email query param is required")

    try:
        response = (
            supabase.table("notifications")
            .select("id", count="exact")
            .eq("user_email", email)
            .eq("is_read", False)
            .execute()
        )
        return {"unread_count": response.count if response.count is not None else 0}

    except Exception as e:
        print(f"[notifications] COUNT error: {e}")
        raise HTTPException(status_code=500, detail="Failed to count notifications")


@app.patch("/notifications/mark-all-read")
def mark_all_notifications_read(payload: dict = Body(...)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="email is required in request body")

    try:
        response = (
            supabase.table("notifications")
            .update({"is_read": True})
            .eq("user_email", email)
            .eq("is_read", False)
            .execute()
        )
        updated = len(response.data) if response.data else 0
        return {"message": f"Marked {updated} notification(s) as read", "updated": updated}

    except Exception as e:
        print(f"[notifications] MARK-ALL-READ error: {e}")
        raise HTTPException(status_code=500, detail="Failed to mark notifications")


@app.patch("/notifications/{notification_id}/read")
def mark_notification_read(notification_id: int):
    try:
        response = (
            supabase.table("notifications")
            .update({"is_read": True})
            .eq("id", notification_id)
            .execute()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail="Notification not found")
        return {"message": "Notification marked as read"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"[notifications] MARK-READ error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update notification")


@app.delete("/notifications/delete-read")
def delete_read_notifications(payload: dict = Body(...)):
    email = payload.get("email")
    if not email:
        raise HTTPException(status_code=400, detail="email is required in request body")

    try:
        response = (
            supabase.table("notifications")
            .delete()
            .eq("user_email", email)
            .eq("is_read", True)
            .execute()
        )
        deleted = len(response.data) if response.data else 0
        return {"message": f"Deleted {deleted} read notification(s)", "deleted": deleted}

    except Exception as e:
        print(f"[notifications] DELETE-READ error: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete read notifications")


@app.post("/notifications", response_model=NotificationOut, status_code=201)
def create_notification_endpoint(notification: NotificationCreate):
    if notification.type not in VALID_NOTIF_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"type must be one of: {', '.join(VALID_NOTIF_TYPES)}"
        )

    try:
        response = supabase.table("notifications").insert({
            "user_email": notification.user_email,
            "type":       notification.type,
            "title":      notification.title,
            "message":    notification.message,
            "is_read":    False,
        }).execute()
        return response.data[0]

    except Exception as e:
        print(f"[notifications] CREATE error: {e}")
        raise HTTPException(status_code=500, detail="Failed to create notification")
    
@app.post("/users/change-password")
def change_password(req: ChangePasswordRequest, db: Session = Depends(get_db)):
    # 1. Find the user
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Verify their current password (Security Check)
    if not utils.verify_password(req.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    # 3. Hash and save the new password
    user.hashed_password = utils.hash_password(req.new_password)
    db.commit()

    # --- SILENT AUDIT LOG ---
    try:
        from vector_store import supabase
        supabase.table("system_events_logs").insert({
            "user_email": req.email,
            "event_type": "Security Update",
            "description": "User successfully changed their password"
        }).execute()
    except Exception as e:
        print(f"Failed to log password change: {e}")
    # ------------------------
    
    return {"message": "Password successfully updated!"}

@app.put("/users/profile")
def update_profile(req: UpdateProfileRequest, db: Session = Depends(get_db)):
    # 1. Fetch the core user
    user = db.query(models.User).filter(models.User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # 2. Handle Email Change Logic
    if req.new_email != req.email:
        existing_email = db.query(models.User).filter(models.User.email == req.new_email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="This email is already in use by another account.")
        user.email = req.new_email
    
    # 3. Update core user details
    user.full_name = req.full_name
    
    # 4. Relational Table Routing
    if user.role == "STUDENT":
        if user.student_profile:
            user.student_profile.course = req.program
        else:
            new_profile = models.StudentProfile(user_id=user.id, course=req.program)
            db.add(new_profile)
    else:
        user.department = req.program
        
    db.commit()

    # --- SILENT AUDIT LOG ---
    try:
        from vector_store import supabase
        supabase.table("system_events_logs").insert({
            "user_email": user.email, # Use the confirmed email
            "event_type": "Profile Update",
            "description": f"Updated profile details (Name: {req.full_name}, Program: {req.program})"
        }).execute()
    except Exception as e:
        print(f"Failed to log profile update: {e}")
    # ------------------------
    
    return {
        "message": "Profile updated successfully!", 
        "full_name": user.full_name, 
        "program": req.program,
        "email": user.email  
    }

# --- NEW: ANNOUNCEMENT ROUTES ---
@app.post("/announcements", response_model=schemas.AnnouncementResponse)
def create_announcement(announcement: schemas.AnnouncementCreate, db: Session = Depends(get_db)):
    sent_dt = datetime.utcnow()
    
    # If it's scheduled, parse the HTML datetime string
    if announcement.schedule_date:
        try:
            sent_dt = datetime.fromisoformat(announcement.schedule_date.replace("Z", "+00:00"))
        except ValueError:
            pass # Fallback to current time if parsing fails
            
    db_announcement = models.Announcement(
        title=announcement.title,
        content=announcement.content,
        recipients=announcement.recipients,
        sent_date=sent_dt,
        sent_by=announcement.sent_by,
        status=announcement.status,
        total_recipients=announcement.total_recipients
    )
    
    db.add(db_announcement)
    db.commit()
    db.refresh(db_announcement)
    
    # --- SILENT AUDIT LOG ---
    try:
        from vector_store import supabase
        supabase.table("system_events_logs").insert({
            "user_email": announcement.sent_by,
            "event_type": "Broadcast Sent",
            "description": f"Broadcasted: {announcement.title} to {announcement.recipients}"
        }).execute()
    except Exception as e:
        print(f"Failed to log announcement: {e}")

    return db_announcement

@app.get("/announcements", response_model=List[schemas.AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    # Fetch all announcements, newest first
    return db.query(models.Announcement).order_by(models.Announcement.sent_date.desc()).all()

@app.get("/users/counts")
def get_user_counts(db: Session = Depends(get_db)):
    # Fetch real-time counts from the database, ignoring disabled accounts
    students = db.query(models.User).filter(models.User.role == "STUDENT", models.User.status == "Active").count()
    faculty = db.query(models.User).filter(models.User.role == "FACULTY", models.User.status == "Active").count()
    admins = db.query(models.User).filter(models.User.role == "ADMIN", models.User.status == "Active").count()
    
    total = students + faculty + admins
    return {
        "all": total,
        "students": students,
        "faculty": faculty
    }

@app.put("/announcements/{announcement_id}", response_model=schemas.AnnouncementResponse)
def update_announcement(announcement_id: str, req: schemas.AnnouncementUpdate, db: Session = Depends(get_db)):
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    announcement.title = req.title
    announcement.content = req.content
    announcement.recipients = req.recipients
    announcement.status = req.status
    announcement.total_recipients = req.total_recipients
    
    if req.schedule_date:
        try:
            announcement.sent_date = datetime.fromisoformat(req.schedule_date.replace("Z", "+00:00"))
        except ValueError:
            pass 
    elif req.status == "Sent":
        announcement.sent_date = datetime.utcnow() # Update timestamp if sending right now

    db.commit()
    db.refresh(announcement)
    return announcement

@app.delete("/announcements/{announcement_id}")
def delete_announcement(announcement_id: str, db: Session = Depends(get_db)):
    announcement = db.query(models.Announcement).filter(models.Announcement.id == announcement_id).first()
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    
    # Security check: Prevent deleting Sent announcements via API
    if announcement.status == "Sent":
        raise HTTPException(status_code=400, detail="Cannot delete an announcement that has already been sent.")
        
    db.delete(announcement)
    db.commit()
    return {"message": "Announcement deleted successfully."}

# --- SETTINGS ROUTES ---
@app.get("/settings", response_model=SettingsSchema)
def get_system_settings(db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
    
    # If settings don't exist yet, create the default row
    if not settings:
        settings = models.SystemSettings(id=1)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    return settings

@app.put("/settings")
def update_system_settings(req: SettingsSchema, db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).filter(models.SystemSettings.id == 1).first()
    if not settings:
        settings = models.SystemSettings(id=1)
        db.add(settings)
    
    # Update all fields
    settings.platform_name = req.platform_name
    settings.campus = req.campus
    settings.admin_email = req.admin_email
    settings.jwt_expiration = req.jwt_expiration
    settings.otp_expiration = req.otp_expiration
    settings.ai_model = req.ai_model
    settings.ai_temperature = req.ai_temperature
    settings.ai_system_prompt = req.ai_system_prompt
    settings.rag_max_chunks = req.rag_max_chunks
    
    db.commit()
    
    # --- SILENT AUDIT LOG ---
    try:
        from vector_store import supabase
        supabase.table("system_events_logs").insert({
            "user_email": "System Admin",
            "event_type": "System Config Update",
            "description": "Administrator modified core system and AI settings."
        }).execute()
    except Exception as e:
        pass
    
    return {"message": "Settings successfully updated!"}