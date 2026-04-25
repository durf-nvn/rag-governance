import smtplib
import os
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from passlib.context import CryptContext
from jose import jwt # You need to install 'python-jose' for this

load_dotenv()

# --- JWT SETTINGS ---
SECRET_KEY = os.getenv("SECRET_KEY", "a_very_secret_key_for_ctu_project") 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing setup
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", truncate_error=False)

def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)

# --- ADD THIS FUNCTION TO FIX THE ERROR ---
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Your existing email function ---
def send_forgot_password_email(target_email: str):
    sender_email = os.getenv("EMAIL_ADDRESS")
    sender_password = os.getenv("EMAIL_APP_PASSWORD")

    if not sender_email or not sender_password:
        raise ValueError("Email credentials missing in .env file")

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset Your CTU Knowledge System Password"
    message["From"] = f"CTU Argao Support <{sender_email}>"
    message["To"] = target_email

    reset_link = f"http://localhost:5173/login?showReset=true&email={target_email}"

    html = f"""
    <html>
        <body style="font-family: Arial, sans-serif;">
            <div style="padding: 20px; border: 1px solid #ddd;">
                <h2>Password Reset</h2>
                <p>Click the link below to reset your password:</p>
                <a href="{reset_link}" style="background: #1D6FA3; color: white; padding: 10px; text-decoration: none;">Reset Password</a>
            </div>
        </body>
    </html>
    """
    message.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, target_email, message.as_string())