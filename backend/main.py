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

    try:
        from vector_store import supabase
        # Simple AI-less categorizer based on keywords
        topic = "General"
        q_lower = question.lower()
        if len(question.split()) <= 2 or any(w in q_lower for w in ["test", "asdf"]):
            topic = "Ignored"
        elif "grade" in q_lower or "pass" in q_lower or "fail" in q_lower or "unit" in q_lower: topic = "Grading"
        elif "research" in q_lower or "publish" in q_lower or "incentive" in q_lower: topic = "Research"
        elif "faculty" in q_lower or "teacher" in q_lower or "leave" in q_lower: topic = "Faculty"
        elif "admission" in q_lower or "enroll" in q_lower or "shift" in q_lower: topic = "Admissions"
        elif "uniform" in q_lower or "dress" in q_lower or "id" in q_lower: topic = "Dress Code"

        # Save to database (fire and forget)
        supabase.table("query_logs").insert({
            "query_text": question,
            "topic_category": topic
        }).execute()
    except Exception as e:
        print(f"Failed to log query: {e}")
    
    # 1. RETRIEVE: Find relevant sections in Supabase
    relevant_chunks = vector_store.search_knowledge(question)
    
    # 2. AUGMENT: Prepare the context string
    context_text = "\n\n".join([chunk['content'] for chunk in relevant_chunks])
    
    # 3. GENERATE: The "Hybrid" System Prompt
    system_prompt = f"""You are the friendly and professional AI Policy Assistant for Cebu Technological University (CTU) Argao Campus.
    
    YOUR PERSONALITY:
    - You are warm, welcoming, and helpful.
    - You represent the CTU Argao brand.

    INSTRUCTIONS:
    1. GREETINGS: If the user says "Hello", "Hi", "Good morning", or asks "How are you?", respond warmly and introduce yourself. Ask how you can assist them with university policies today.
    2. POLICY QUESTIONS: If the question is about university rules, grades, research, or handbooks, use the CONTEXT provided below to answer.
    3. NO CONTEXT: If a question is asked that is NOT in the context, say: "I'm sorry, I don't have the specific details for that in our current records. You might want to visit the relevant campus office for more info!"
    4. STAY IN CHARACTER: Even when you can't find an answer, remain professional and polite.

    CONTEXT FROM HANDBOOKS:
    {context_text}
    """
    
    try:
        response = groq_client.chat.completions.create(
            messages=[
                {'role': 'system', 'content': system_prompt},
                {'role': 'user', 'content': question}
            ],
            model="llama-3.1-8b-instant",
            temperature=0.3 # Increased slightly to make it more "conversational"
        )
        
        answer = response.choices[0].message.content
        
    except Exception as e:
        print(f"Cloud API Error: {e}")
        return {"answer": "I'm having a bit of trouble connecting to the network. Please try again in a moment!", "sources": []}

    # Format the sources
    sources = [
        f"{chunk['metadata']['name']} (v{chunk['metadata']['version']}) - {chunk['metadata']['office']}"
        for chunk in relevant_chunks
    ]
    # Remove duplicates
    sources = list(set(sources))
    
    # If it was just a greeting, the LLM will likely ignore the context, 
    # so we can clear the sources for a cleaner UI
    final_sources = sources if "I cannot find" not in answer and len(context_text) > 10 else []

    return {
        "answer": answer,
        "sources": final_sources
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

@app.get("/analytics/recent")
def get_recent_questions():
    from vector_store import supabase
    
    # We fetch 50 just to have a big pool to filter from, but we will ONLY return 5
    response = supabase.table("query_logs").select("query_text").order("created_at", desc=True).limit(50).execute()
    
    seen = set()
    recent = []
    
    # A list of words that usually start a real question
    question_words = ["what", "how", "when", "where", "why", "who", "is", "are", "can", "do", "does", "will"]
    # A list of nonsense or negative words to block
    blocked_words = ["test", "asdf", "fuck", "shit", "stupid", "idiot", "blah"]
    
    for row in response.data:
        q = row['query_text'].strip()
        q_lower = q.lower()
        
        # FILTER 1: Skip if too short (e.g., "hi", "ok", "yes")
        if len(q.split()) <= 3:
            continue
            
        # FILTER 2: Skip if it contains blocked/nonsense words
        if any(bad_word in q_lower for bad_word in blocked_words):
            continue
            
        # FILTER 3: Must look like a real question (starts with a question word OR ends with '?')
        starts_with_q = any(q_lower.startswith(w) for w in question_words)
        ends_with_q = q.endswith("?")
        
        if not (starts_with_q or ends_with_q):
            continue
            
        # Add to our list if it passes all filters and isn't a duplicate
        if q not in seen:
            seen.add(q)
            recent.append(q)
            
            # STRICT LIMIT: Stop exactly at 5 questions
            if len(recent) == 5: 
                break
                
    # Fallback if the database is empty or everything was filtered out
    if not recent:
        return [
            "What is the grading system for undergraduate programs?", 
            "How do I apply for research grants?",
            "What are the requirements for faculty promotion?"
        ]
    return recent


@app.get("/analytics/popular")
def get_popular_topics():
    from vector_store import supabase
    response = supabase.table("query_logs").select("topic_category").execute()
    
    counts = {}
    for row in response.data:
        cat = row['topic_category']
        
        # FILTER: Do not show "General" or "Ignored" in the popular tags
        if cat in ["General", "Ignored"]:
            continue
            
        counts[cat] = counts.get(cat, 0) + 1
        
    # Sort by most popular (highest count first)
    sorted_cats = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    
    colors = ["blue", "emerald", "purple", "orange"]
    topics = []
    
    # STRICT LIMIT: Return exactly the top 4 topics
    for i, (cat, count) in enumerate(sorted_cats[:4]):
        topics.append({"label": cat, "color": colors[i % len(colors)]})
        
    # Fallback if empty
    if not topics:
        return [
            {"label": "Grading", "color": "blue"}, 
            {"label": "Research", "color": "emerald"},
            {"label": "Admissions", "color": "purple"}
        ]
    return topics