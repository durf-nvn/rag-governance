from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware  # <-- ADD THIS IMPORT
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
load_dotenv()
import models, schemas, utils, vector_store
from database import engine, get_db
from typing import List
import PyPDF2
import io
from groq import Groq
from pydantic import BaseModel
from datetime import datetime

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class QuestionRequest(BaseModel):
    question: str

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CTU Institutional Knowledge System API",
    description="Backend for the RAG-Powered Quality Assurance System"
)

# --- ADD THIS CORS BLOCK ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allows your React app to communicate with FastAPI
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    # 1. Check if email exists
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = utils.hash_password(user.password)
    auto_verify = True if user.role.upper() == "STUDENT" else False

    # 2. Create the Base User account
    new_user = models.User(
        email=user.email,
        full_name=user.full_name,
        hashed_password=hashed_pwd,
        role=user.role.upper(),
        is_verified=auto_verify
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 3. NEW: If they are a student, create their specific profile!
    if user.role.upper() == "STUDENT":
        new_student_profile = models.StudentProfile(
            user_id=new_user.id,
            course=user.course,
            year_level=user.year
        )
        db.add(new_student_profile)
        db.commit()

    return new_user

@app.post("/login", response_model=schemas.Token)
def login_user(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # NEW: The Verification Check
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Faculty account is currently pending Admin verification."
        )

    access_token = utils.create_access_token(data={"sub": user.email})
    
    # FIXED: Send the actual database details back to React
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "full_name": user.full_name or "CTU User", 
        "email": user.email,
        "role": user.role
    }

@app.get("/users", response_model=List[schemas.UserResponse])
def get_all_users(db: Session = Depends(get_db)):
    # Fetch every user in the database
    return db.query(models.User).all()

@app.put("/users/{user_id}/verify")
def verify_user(user_id: str, db: Session = Depends(get_db)):
    # Find the user and flip their lock to True
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_verified = True
    db.commit()
    return {"message": "User approved successfully!"}

@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    category: str = Form(...),
    office: str = Form(...),
    version: str = Form(...),
    effectivity_date: str = Form(...)
):
    # 1. Read the PDF File
    contents = await file.read()
    extracted_text = ""
    
    try:
        if file.filename.endswith(".pdf"):
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        else:
            raise HTTPException(status_code=400, detail="Only PDF files are supported currently.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        # 2. Prepare Metadata
        metadata = {
            "name": name,
            "category": category,
            "office": office,
            "version": version,
            "effectivity_date": effectivity_date,
            "uploaded_at": datetime.now().isoformat() # CHANGED THIS LINE
        }

        # 3. Process into Vector Store (Supabase)
        chunks_count = vector_store.add_to_vector_db(extracted_text, metadata)

        return {
            "message": f"Successfully processed {name}!",
            "details": f"Created {chunks_count} searchable vector chunks in Supabase."
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during processing.")

@app.post("/ask-policy")
def ask_policy(request: QuestionRequest):
    question = request.question
    
    # 1. RETRIEVE: Find the top 3 most relevant paragraphs in Supabase
    relevant_chunks = vector_store.search_knowledge(question)
    
    if not relevant_chunks:
        return {"answer": "I'm sorry, I couldn't find any information about that in the uploaded documents.", "sources": []}
    
    # 2. AUGMENT: Combine the chunks into one big context string
    context_text = "\n\n".join([chunk['content'] for chunk in relevant_chunks])
    
    # 3. GENERATE: Give the Cloud AI a strict personality and the context
    system_prompt = f"""You are the official AI Assistant for Cebu Technological University (CTU) Argao Campus.
    Your job is to answer student questions based STRICTLY on the provided context. 
    If the answer is not in the context, say "I cannot find this in the institutional policies."
    Do not make up rules.
    
    CONTEXT:
    {context_text}
    """
    
    try:
        # Call the Groq Cloud API (Using the ultra-fast Llama 3 8B model)
        response = groq_client.chat.completions.create(
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': question}
            ],
            model="llama-3.1-8b-instant", 
            temperature=0.2 # Keep it low so the AI doesn't hallucinate
        )
        
        # Extract the text answer
        answer = response.choices[0].message.content
        
    except Exception as e:
        print(f"Cloud API Error: {e}")
        return {"answer": "Sorry, I am having trouble connecting to the cloud server right now.", "sources": []}

    # Format the sources so the frontend can display where the AI got the answer
    sources = [
        f"{chunk['metadata']['name']} (v{chunk['metadata']['version']}) - {chunk['metadata']['office']}"
        for chunk in relevant_chunks
    ]
    # Remove duplicates
    sources = list(set(sources))
    
    return {
        "answer": answer,
        "sources": sources
    }

@app.get("/documents")
def get_documents():
    from vector_store import supabase
    # This grabs only the metadata column from your Supabase vector table
    response = supabase.table("document_sections").select("metadata").execute()
    
    # Filter to show only unique document names
    seen = set()
    unique_docs = []
    for item in response.data:
        doc_name = item['metadata'].get('name')
        if doc_name not in seen:
            unique_docs.append({
                "id": len(unique_docs) + 1,
                "name": doc_name,
                "category": item['metadata'].get('category'),
                "office": item['metadata'].get('office'),
                "version": item['metadata'].get('version'),
                "date": item['metadata'].get('effectivity_date')
            })
            seen.add(doc_name)
            
    return unique_docs