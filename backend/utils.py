import bcrypt

def hash_password(password: str) -> str:
    # Convert the password to bytes
    pwd_bytes = password.encode('utf-8')
    # Generate a secure salt and hash the password
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(password=pwd_bytes, salt=salt)
    # Return it as a normal string to save in Supabase
    return hashed_password.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Convert both passwords to bytes for comparison
    password_byte_enc = plain_password.encode('utf-8')
    hashed_password_byte_enc = hashed_password.encode('utf-8')
    # Check if they match
    return bcrypt.checkpw(password=password_byte_enc, hashed_password=hashed_password_byte_enc)