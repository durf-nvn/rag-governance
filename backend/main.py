from fastapi import FastAPI, Depends, HTTPException, status
import schemas, utils
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models
from database import engine, get_db

# This line tells SQLAlchemy to create the tables in Supabase based on models.py
models.Base.metadata.create_all(bind=engine)

# Initialize the FastAPI app
app = FastAPI(
    title="CTU Institutional Knowledge System API",
    description="Backend for the RAG-Powered Quality Assurance System"
)

# A simple test route to check if the server is running
@app.get("/")
def read_root():
    return {"message": "Welcome to the CTU Knowledge System API! The server is running perfectly."}

# A test route to check the database connection
@app.get("/test-db")
def test_db_connection(db: Session = Depends(get_db)):
    try:
        # Try to query the database
        users_count = db.query(models.User).count()
        return {"status": "Success", "message": f"Connected to Supabase! Current users: {users_count}"}
    except Exception as e:
        return {"status": "Failed", "error": str(e)}
    
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # 1. Check if the email already exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Hash the password
    hashed_pwd = utils.hash_password(user.password)

    # 3. Create the new user object
    new_user = models.User(email=user.email, hashed_password=hashed_pwd)

    # 4. Save to the database
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user