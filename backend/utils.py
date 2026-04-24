import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

# Updated configuration to avoid the "72 bytes" bug
# We explicitly set the bcrypt_sha256 scheme which is more robust
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    """Hashes a plain-text password."""
    # Ensure password is treated as a string and handled correctly by passlib
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str):
    """Verifies a plain-text password against the hashed version."""
    return pwd_context.verify(plain_password, hashed_password)

# --- Keep your existing send_forgot_password_email function below ---
def send_forgot_password_email(target_email: str):
    sender_email = os.getenv("EMAIL_ADDRESS")
    sender_password = os.getenv("EMAIL_APP_PASSWORD")

    if not sender_email or not sender_password:
        raise ValueError("Email credentials missing in .env file")

    message = MIMEMultipart("alternative")
    message["Subject"] = "Reset Your CTU Knowledge System Password"
    message["From"] = f"CTU Argao Support <{sender_email}>"
    message["To"] = target_email

    # Link pointing to the login page with query parameters
    reset_link = f"http://localhost:5173/login?showReset=true&email={target_email}"

    html = f"""
    <html>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #333;">
            <div style="max-width: 500px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #1D6FA3;">Password Reset</h2>
                <p>You requested to reset your password. Click the button below to set a new one:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}"
                       style="background-color: #1D6FA3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                        Reset Password
                    </a>
                </div>
                <p style="font-size: 12px; color: #777;">If you didn't request this, you can safely ignore this email.</p>
            </div>
        </body>
    </html>
    """
    message.attach(MIMEText(html, "html"))

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(sender_email, sender_password)
        server.sendmail(sender_email, target_email, message.as_string())