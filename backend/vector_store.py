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

def search_knowledge(question: str, match_count: int = 3, excluded_categories: list = None):
    # Check if supabase was actually initialized before using it
    if supabase is None:
        print("⚠️ search_knowledge called but supabase client is not initialized!")
        return []

    query_embedding = model.encode(question).tolist()

    # Fetch more chunks than needed so filtering doesn't leave us short.
    # If we exclude categories, we need a bigger pool to pull from.
    fetch_count = match_count * 3 if excluded_categories else match_count

    response = supabase.rpc(
        'match_document_sections',
        {
            'query_embedding': query_embedding,
            'match_threshold': 0.3,
            'match_count': fetch_count
        }
    ).execute()

    results = response.data or []

    if excluded_categories:
        results = [
            r for r in results
            if r.get('metadata', {}).get('category') not in excluded_categories
            and r.get('metadata', {}).get('status') != 'Archived'
        ]

    return results[:match_count]