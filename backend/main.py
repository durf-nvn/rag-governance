from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from dotenv import load_dotenv
import os
import models, schemas, utils, vector_store
from database import engine, get_db
from typing import List
import PyPDF2
import io
from groq import Groq
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta 

import os
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException

# 1. LOAD THE ENVIRONMENT FIRST
load_dotenv()

# 2. ASSIGN THE VARIABLES
SMTP_USER = os.getenv("EMAIL_ADDRESS")
SMTP_PASSWORD = os.getenv("EMAIL_APP_PASSWORD")

app = FastAPI()

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

class QuestionRequest(BaseModel):
    question: str
    user_email: str
    user_role: str

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    is_helpful: bool

class UpdateDocumentRequest(BaseModel):
    old_name: str
    new_name: str
    category: str
    office: str
    version: str
    effectivity_date: str

class AccreditationUploadRequest(BaseModel):
    document_name: str
    program: str
    area_code: str
    category: str = "Accreditation Evidence"

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

# --- ADDED FOR PASSWORD RESET ---
class UpdatePasswordRequest(BaseModel):
    email: EmailStr
    new_password: str
# --------------------------------

# --- NEW: ADD USER FROM ADMIN DASHBOARD ---
class UserCreateRequest(BaseModel):
    full_name: str
    email: str
    role: str
    password: str
# ------------------------------------------

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
    
@app.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pwd = utils.hash_password(user.password)
    auto_verify = True if user.role.upper() == "STUDENT" else False

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

    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your Faculty account is currently pending Admin verification."
        )

    access_token = utils.create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "full_name": user.full_name or "CTU User", 
        "email": user.email,
        "role": user.role
    }

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

# --- UPDATED FOR PASSWORD RESET ---
@app.post("/update-password")
def update_password(request: UpdatePasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found in records")
    
    try:
        new_hashed_password = utils.hash_password(request.new_password)
        user.hashed_password = new_hashed_password
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        return {"message": "Password updated successfully!"}
        
    except Exception as e:
        db.rollback()
        print(f"CRITICAL DB ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail="Could not update database")

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
    return {"message": "User approved successfully!"}

@app.delete("/users/{user_id}")
def delete_user(user_id: str, db: Session = Depends(get_db)):
    # Find the user and completely remove them from the database
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
    
    # Perform the Soft Delete
    user.status = "Disabled"
    db.commit()
    return {"message": f"Account for {user.full_name or user.email} has been disabled!"}

@app.post("/users")
def create_user_admin(request: UserCreateRequest, db: Session = Depends(get_db)):
    # 1. Check if email exists
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with that email already exists.")

    # 2. Hash the password using your existing utils
    hashed_pwd = utils.hash_password(request.password)

    # 3. Create the user (Auto-verified because an Admin created them)
    new_user = models.User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_pwd,
        role=request.role.upper(),
        is_verified=True 
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 4. If it's a student, create a default profile so the database doesn't break
    if request.role.upper() == "STUDENT":
        new_student_profile = models.StudentProfile(
            user_id=new_user.id,
            course="BSIT", # Default placeholder
            year_level=1   # Default placeholder
        )
        db.add(new_student_profile)
        db.commit()

    return {"message": f"{request.role.capitalize()} {request.full_name} created successfully!"}

@app.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    name: str = Form(...),
    category: str = Form(...),
    office: str = Form(...),
    version: str = Form(...),
    effectivity_date: str = Form(...)
):
    contents = await file.read()
    extracted_text = ""
    
    try:
        # 1. Extract text based on file type
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

        # --- NEW: SUPABASE STORAGE UPLOAD ---

        # --- NEW: SUPABASE STORAGE UPLOAD ---
        from vector_store import supabase
        import time
        
        safe_filename = file.filename.replace(" ", "_")
        unique_filename = f"{int(time.time())}_{safe_filename}"
        
        supabase.storage.from_("documents").upload(
            file=contents,
            path=unique_filename,
            file_options={"content-type": "application/pdf"}
        )
        
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)
        # ------------------------------------

        metadata = {
            "name": name,
            "category": category,
            "office": office,
            "version": version,
            "effectivity_date": effectivity_date,
            "uploaded_at": datetime.now().isoformat(),
            "file_url": public_url,
            "status": "Active"
        }

        chunks_count = vector_store.add_to_vector_db(extracted_text, metadata)

        return {
            "message": f"Successfully processed {name}!",
            "details": f"Created {chunks_count} searchable vector chunks and saved file to Storage."
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during processing.")
    
@app.post("/upload-new-version")
async def upload_new_version(
    file: UploadFile = File(...),
    old_document_name: str = Form(...),
    new_version: str = Form(...),
    new_effectivity_date: str = Form(...)
):
    import time
    from vector_store import supabase
    from datetime import datetime
    import io
    import PyPDF2

    try:
        # 1. Fetch the old document to copy its Category and Office
        res = supabase.table("document_sections").select("metadata").eq("metadata->>name", old_document_name).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Old document not found in database.")
        
        old_metadata = res.data[0]['metadata']
        category = old_metadata.get("category", "Policy")
        office = old_metadata.get("office", "Academic Affairs")

        # 2. Archive the old version (Update all chunks of the old document)
        old_chunks_res = supabase.table("document_sections").select("id, metadata").eq("metadata->>name", old_document_name).execute()
        if old_chunks_res.data:
            for chunk in old_chunks_res.data:
                chunk_meta = chunk['metadata']
                chunk_meta['status'] = "Archived" # Mark as archived!
                supabase.table("document_sections").update({"metadata": chunk_meta}).eq("id", chunk['id']).execute()

        # 3. Extract text from the new file (Supports PDF, DOCX, TXT)
        contents = await file.read()
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

        # 4. Upload to Supabase Storage
        safe_filename = file.filename.replace(" ", "_")
        unique_filename = f"v{new_version}_{int(time.time())}_{safe_filename}"
        
        supabase.storage.from_("documents").upload(
            file=contents,
            path=unique_filename,
            file_options={"content-type": file.content_type}
        )
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)

        # 5. Save the new vectors as "Active"
        new_metadata = {
            "name": old_document_name,  # Keep the same name to link them!
            "category": category,
            "office": office,
            "version": new_version,
            "effectivity_date": new_effectivity_date,
            "upload_date": datetime.now().isoformat(),
            "file_url": public_url,
            "status": "Active" # Make the new one active
        }

        import vector_store
        vector_store.add_to_vector_db(extracted_text, new_metadata)

        return {"message": "New version uploaded successfully and old version archived!"}

    except Exception as e:
        print(f"Update version error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ask-policy")
def ask_policy(request: QuestionRequest):
    question = request.question

    try:
        from vector_store import supabase
        topic = "General"
        q_lower = question.lower()
        if len(question.split()) <= 2 or any(w in q_lower for w in ["test", "asdf"]):
            topic = "Ignored"
        elif "grade" in q_lower or "pass" in q_lower or "fail" in q_lower or "unit" in q_lower: topic = "Grading"
        elif "research" in q_lower or "publish" in q_lower or "incentive" in q_lower: topic = "Research"
        elif "faculty" in q_lower or "teacher" in q_lower or "leave" in q_lower: topic = "Faculty"
        elif "admission" in q_lower or "enroll" in q_lower or "shift" in q_lower: topic = "Admissions"
        elif "uniform" in q_lower or "dress" in q_lower or "id" in q_lower: topic = "Dress Code"

        supabase.table("query_logs").insert({
            "query_text": question,
            "topic_category": topic
        }).execute()
    except Exception as e:
        print(f"Failed to log query: {e}")
    
    relevant_chunks = vector_store.search_knowledge(question)
    
    # --- SUPERCHARGED AI FILTERING ---
    safe_chunks = []
    for chunk in relevant_chunks:
        chunk_meta = chunk.get('metadata', {})
        
        # 1. Version Control Filter: Ignore archived documents
        if chunk_meta.get('status') == "Archived":
            continue 
            
        # 2. Security Filter: Block students from Accreditation Evidence
        if request.user_role.upper() == "STUDENT" and chunk_meta.get('category') == "Accreditation Evidence":
            continue 
            
        safe_chunks.append(chunk)
        
    relevant_chunks = safe_chunks
    # ---------------------------------
    
    context_text = "\n\n".join([chunk['content'] for chunk in relevant_chunks])
    
    system_prompt = f"""You are the friendly and professional AI Policy Assistant for Cebu Technological University (CTU) Argao Campus.
    
    YOUR PERSONALITY:
    - You are warm, welcoming, and helpful.
    - You represent the CTU Argao brand.

    INSTRUCTIONS:
    1. POLICY QUESTIONS: If the question is about university rules, grades, research, or handbooks, use the CONTEXT provided below to answer.
    2. NO CONTEXT: If a question is asked that is NOT in the context, say: "I'm sorry, I don't have the specific details for that in our current records. You might want to visit the relevant campus office for more info!"
    3. FOLLOW-UPS: At the very end of your response, you MUST generate exactly 3 logical follow-up questions the user might want to ask next based on the topic.
    
    FORMATTING RULE:
    You must separate your main answer from the follow-up questions using exactly this string: |FOLLOWUPS|
    Put each follow-up question on a new line. Do not number them.

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
            temperature=0.3
        )
        
        raw_answer = response.choices[0].message.content
        parts = raw_answer.split("|FOLLOWUPS|")
        answer = parts[0].strip()

        follow_ups = []
        if len(parts) > 1:
            raw_questions = parts[1].strip().split('\n')
            for q in raw_questions:
                clean_q = q.strip().lstrip('1234567890.- ')
                if clean_q:
                    follow_ups.append(clean_q)
                    if len(follow_ups) == 3: break
        
    except Exception as e:
        print(f"Cloud API Error: {e}")
        return {"answer": "I'm having a bit of trouble connecting to the network. Please try again in a moment!", "sources": [], "follow_ups": []}

    unique_sources = {}
    for chunk in relevant_chunks:
        source_name = f"{chunk['metadata']['name']} (v{chunk['metadata']['version']}) - {chunk['metadata']['office']}"
        
        if source_name not in unique_sources:
            clean_snippet = chunk['content'][:150].strip() + "..."
            raw_similarity = chunk.get('similarity', 0.85)
            human_score = raw_similarity * 1.5 
            relevance_percentage = min(99, int(human_score * 100))
            
            unique_sources[source_name] = {
                "name": source_name,
                "snippet": clean_snippet,
                "relevance": relevance_percentage 
            }
            
    sources = list(unique_sources.values())
    final_sources = sources if "I cannot find" not in answer and len(context_text) > 10 else []

    try:
        from vector_store import supabase
        supabase.table("chat_history").insert({
            "user_email": request.user_email,
            "role": "user",
            "content": request.question
        }).execute()
        
        supabase.table("chat_history").insert({
            "user_email": request.user_email,
            "role": "ai",
            "content": answer
        }).execute()
    except Exception as e:
        print(f"Failed to save chat history: {e}")

    return {
        "answer": answer,
        "sources": final_sources,
        "follow_ups": follow_ups
    }

@app.get("/documents")
def get_documents():
    from vector_store import supabase
    response = supabase.table("document_sections").select("metadata").execute()
    
    seen = set()
    unique_docs = []
    
    for item in response.data:
        meta = item.get('metadata', {})
        doc_name = meta.get('name')
        doc_version = meta.get('version', '1.0') # Fallback if missing
        
        # --- THE FIX 1: Combine name AND version to make it unique ---
        unique_key = f"{doc_name}_v{doc_version}"
        
        if unique_key not in seen:
            unique_docs.append({
                "id": len(unique_docs) + 1,
                "name": doc_name,
                "category": meta.get('category'),
                "office": meta.get('office'),
                "version": doc_version,
                "effectivity_date": meta.get('effectivity_date', 'N/A'),
                "file_url": meta.get('file_url') or meta.get('source'),
                "status": meta.get('status', 'Active') # <--- THE FIX 2: Send status to React
            })
            seen.add(unique_key)
            
    # Sort them so the newest/highest versions appear at the top of the table
    return sorted(unique_docs, key=lambda x: (x['name'], x['version']), reverse=True)

@app.get("/analytics/recent")
def get_recent_questions():
    from vector_store import supabase
    response = supabase.table("query_logs").select("query_text").order("created_at", desc=True).limit(50).execute()
    
    seen = set()
    recent = []
    question_words = ["what", "how", "when", "where", "why", "who", "is", "are", "can", "do", "does", "will"]
    blocked_words = ["test", "asdf", "fuck", "shit", "stupid", "idiot", "blah"]
    
    for row in response.data:
        q = row['query_text'].strip()
        q_lower = q.lower()
        if len(q.split()) <= 3: continue
        if any(bad_word in q_lower for bad_word in blocked_words): continue
        starts_with_q = any(q_lower.startswith(w) for w in question_words)
        ends_with_q = q.endswith("?")
        if not (starts_with_q or ends_with_q): continue
        if q not in seen:
            seen.add(q)
            recent.append(q)
            if len(recent) == 5: break
                
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
        if cat in ["General", "Ignored"]: continue
        counts[cat] = counts.get(cat, 0) + 1
        
    sorted_cats = sorted(counts.items(), key=lambda x: x[1], reverse=True)
    colors = ["blue", "emerald", "purple", "orange"]
    topics = []
    for i, (cat, count) in enumerate(sorted_cats[:4]):
        topics.append({"label": cat, "color": colors[i % len(colors)]})
        
    if not topics:
        return [
            {"label": "Grading", "color": "blue"}, 
            {"label": "Research", "color": "emerald"},
            {"label": "Admissions", "color": "purple"}
        ]
    return topics

@app.get("/system-stats")
def get_system_stats(db: Session = Depends(get_db)):
    from vector_store import supabase
    try:
        # 1. Get total registered users
        users_count = db.query(models.User).count()

        # 2. Get total AI queries asked
        queries_res = supabase.table("query_logs").select("id").execute()
        queries_count = len(queries_res.data) if queries_res.data else 0

        # 3. Get total unique documents
        docs_res = supabase.table("document_sections").select("metadata").execute()
        unique_docs = set()
        if docs_res.data:
            for item in docs_res.data:
                doc_name = item.get('metadata', {}).get('name')
                if doc_name:
                    unique_docs.add(doc_name)
        docs_count = len(unique_docs)

        return {
            "users": users_count,
            "queries": queries_count,
            "documents": docs_count
        }
    except Exception as e:
        print(f"Error fetching stats: {e}")
        # Fallback values in case the database is empty or still initializing
        return {"users": 0, "queries": 0, "documents": 0}

@app.post("/feedback")
def submit_feedback(request: FeedbackRequest):
    from vector_store import supabase
    try:
        supabase.table("feedback_logs").insert({
            "question_text": request.question,
            "ai_response": request.answer,
            "is_helpful": request.is_helpful
        }).execute()
        return {"status": "success", "message": "Feedback recorded!"}
    except Exception as e:
        print(f"Failed to log feedback: {e}")
        return {"status": "error", "message": str(e)}
    
@app.get("/chat-history")
def get_chat_history(email: str):
    from vector_store import supabase
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
    
@app.put("/documents/update")
def update_document(request: UpdateDocumentRequest):
    from vector_store import supabase
    try:
        res = supabase.table("document_sections").select("metadata").eq("metadata->>name", request.old_name).limit(1).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Document not found")
        
        base_metadata = res.data[0]['metadata']
        
        base_metadata["name"] = request.new_name
        base_metadata["category"] = request.category
        base_metadata["office"] = request.office
        base_metadata["version"] = request.version
        base_metadata["effectivity_date"] = request.effectivity_date
        
        supabase.table("document_sections").update({"metadata": base_metadata}).eq("metadata->>name", request.old_name).execute()
        
        return {"message": "Document metadata updated successfully!"}
    except Exception as e:
        print(f"Update error: {e}")
        raise HTTPException(status_code=500, detail="Failed to update document")

@app.delete("/documents/{doc_name}")
def archive_document(doc_name: str):
    from vector_store import supabase
    try:
        # 1. Fetch ALL chunks/vectors belonging to this specific document
        chunks_res = supabase.table("document_sections").select("id, metadata").eq("metadata->>name", doc_name).execute()
        
        if not chunks_res.data:
            raise HTTPException(status_code=404, detail="Document not found in the database.")

        # 2. Loop through every chunk and update its status to "Archived"
        # We do this instead of a hard delete to preserve the audit trail.
        for chunk in chunks_res.data:
            chunk_meta = chunk['metadata']
            chunk_meta['status'] = "Archived" 
            
            # Save the modified metadata back to the database
            supabase.table("document_sections").update({"metadata": chunk_meta}).eq("id", chunk['id']).execute()

        return {"message": f"Document '{doc_name}' successfully archived and removed from active AI context!"}
        
    except Exception as e:
        print(f"Archive error: {e}")
        raise HTTPException(status_code=500, detail="Failed to archive document")
    
@app.post("/upload-accreditation-evidence")
async def upload_accreditation_evidence(
    file: UploadFile = File(...),
    document_name: str = Form(...),
    program: str = Form(...),
    area_code: str = Form(...)
):
    import time
    from vector_store import supabase
    from datetime import datetime

    contents = await file.read()
    extracted_text = ""
    
    try:
        # 1. Extract text based on file type
        filename_lower = file.filename.lower()
        
        if filename_lower.endswith(".pdf"):
            # PDF Extraction
            pdf_reader = PyPDF2.PdfReader(io.BytesIO(contents))
            for page in pdf_reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
                    
        elif filename_lower.endswith(".txt"):
            # TXT Extraction (Super easy, just decode it)
            extracted_text = contents.decode("utf-8")
            
        elif filename_lower.endswith(".docx"):
            # DOCX Extraction
            import docx
            doc = docx.Document(io.BytesIO(contents))
            extracted_text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload PDF, DOCX, or TXT.")

        if not extracted_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from the document. It might be empty or an image-based file.")

        # 2. Upload the physical file to Supabase Storage
        safe_filename = file.filename.replace(" ", "_")
        unique_filename = f"accreditation_{int(time.time())}_{safe_filename}"
        
        supabase.storage.from_("documents").upload(
            file=contents,
            path=unique_filename,
            file_options={"content-type": "application/pdf"}
        )
        
        public_url = supabase.storage.from_("documents").get_public_url(unique_filename)

        # 3. Save the vectors and metadata to the database
        metadata = {
            "name": document_name,
            "category": "Accreditation Evidence",
            "program": program,
            "area": area_code,
            "office": "Quality Assurance", # Default for accreditation
            "version": "1.0",
            "effectivity_date": "N/A",
            "upload_date": datetime.now().isoformat(),
            "file_url": public_url
        }

        # Vector chunking for AI
        vector_store.add_to_vector_db(extracted_text, metadata)

        return {"message": "Evidence securely uploaded, chunked, and logged!"}

    except Exception as e:
        print(f"Accreditation upload error: {e}")
        raise HTTPException(status_code=500, detail="Failed to save evidence")

@app.get("/accreditation-status/{program}")
def get_accreditation_status(program: str):
    from vector_store import supabase
    
    try:
        # 1. Fetch the requirements template for this program
        templates_res = supabase.table("accreditation_templates").select("*").eq("program", program).execute()
        templates = templates_res.data or []

        # 2. Fetch the actually uploaded evidence for this program
        evidence_res = supabase.table("document_sections") \
            .select("metadata") \
            .eq("metadata->>category", "Accreditation Evidence") \
            .eq("metadata->>program", program) \
            .execute()
        
        raw_metadata_list = [doc['metadata'] for doc in evidence_res.data] if evidence_res.data else []

        # --- THE FIX: FILTER OUT DUPLICATE CHUNKS ---
        # Group by document name so a 20-chunk PDF only counts as 1 document
        unique_docs = {}
        for meta in raw_metadata_list:
            doc_name = meta.get("name")
            if doc_name and doc_name not in unique_docs:
                unique_docs[doc_name] = meta
        # --------------------------------------------

        # 3. Calculate math per area
        area_dict = {}
        for t in templates:
            area = t['area']
            if area not in area_dict:
                area_dict[area] = {
                    "id": area, "code": area, "title": f"{area} Requirements", 
                    "required": 0, "evidenceCount": 0, "gaps": 0, "compliance": 0, "status": "needs-improvement"
                }
            area_dict[area]["required"] += 1

        # Count unique evidence matches
        for doc_name, meta in unique_docs.items():
            area = meta.get("area")
            if area in area_dict:
                area_dict[area]["evidenceCount"] += 1

        # 4. Finalize the percentages
        total_required = 0
        total_evidence = 0
        areas_list = []
        
        for area_name, data in area_dict.items():
            # Cap evidence for math purposes (so 2 uploads for 1 requirement doesn't make it 200%)
            capped_evidence = min(data["evidenceCount"], data["required"])
            data["gaps"] = data["required"] - capped_evidence
            data["compliance"] = int((capped_evidence / data["required"]) * 100) if data["required"] > 0 else 0
            data["status"] = "compliant" if data["compliance"] == 100 else "needs-improvement"
            
            total_required += data["required"]
            total_evidence += capped_evidence
            areas_list.append(data)
            
        overall_compliance = int((total_evidence / total_required) * 100) if total_required > 0 else 0
        overall_gaps = total_required - total_evidence

        # Format recent evidence using ONLY the unique documents
        unique_docs_list = list(unique_docs.values())
        recent = sorted(unique_docs_list, key=lambda x: x.get('upload_date', ''), reverse=True)[:5]
        recent_formatted = [{
            "name": d.get("name", "Unknown Document"),
            "date": d.get("upload_date", "").split("T")[0] if "upload_date" in d else "Recently",
            "area": d.get("area", "General")
        } for d in recent]

        return {
            "level": "Level III" if program == "BSIT" else "Level II",
            "overall": overall_compliance,
            "gaps": overall_gaps,
            "evidence": len(unique_docs_list),
            "areas": sorted(areas_list, key=lambda x: x['code']),
            "recentEvidence": recent_formatted
        }
    except Exception as e:
        print(f"Fetch error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch accreditation status")