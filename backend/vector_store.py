import os
from supabase import create_client
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv

# Path logic to find .env even if run from different folders
load_dotenv()

# Verify names match your .env exactly
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") 

supabase = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        print("✅ Supabase client initialized successfully.")
    except Exception as e:
        print(f"❌ Failed to initialize Supabase: {e}")
else:
    print("❌ ERROR: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from .env!")

model = SentenceTransformer('all-MiniLM-L6-v2')

def add_to_vector_db(text, metadata):
    # Check if supabase was actually initialized before using it
    if supabase is None:
        print("⚠️ search_knowledge called but supabase client is not initialized!")
        return []
    
    # Split text into chunks of 500 characters
    chunks = [text[i:i+500] for i in range(0, len(text), 500)]
    
    for chunk in chunks:
        # Generate the embedding (the "math" version of the text)
        embedding = model.encode(chunk).tolist()
        
        # Insert into the document_sections table we created in the SQL editor
        supabase.table("document_sections").insert({
            "content": chunk,
            "metadata": metadata,
            "embedding": embedding
        }).execute()
        
    return len(chunks)

def search_knowledge(question: str, match_count: int = 3):
    # Check if supabase was actually initialized before using it
    if supabase is None:
        print("⚠️ search_knowledge called but supabase client is not initialized!")
        return []

    query_embedding = model.encode(question).tolist()
    
    response = supabase.rpc(
        'match_document_sections',
        {
            'query_embedding': query_embedding,
            'match_threshold': 0.3,
            'match_count': match_count
        }
    ).execute()
    
    return response.data