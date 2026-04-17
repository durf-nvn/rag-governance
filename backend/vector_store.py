import os
from supabase import create_client
from sentence_transformers import SentenceTransformer

# Replace with your actual Supabase credentials
SUPABASE_URL = "https://rcnmrjjuhrbluhxomnzv.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJjbm1yamp1aHJibHVoeG9tbnp2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjM5MDM0OSwiZXhwIjoyMDkxOTY2MzQ5fQ.iZId04aGPBVSk6GK7AUInTB7YlNviKeEsjncGpUjVpY" 

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load the model that turns text into 384-dimensional vectors
model = SentenceTransformer('all-MiniLM-L6-v2')

def add_to_vector_db(text, metadata):
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
    # 1. Turn the user's question into math (embedding)
    query_embedding = model.encode(question).tolist()
    
    # 2. Call the Supabase SQL function we just created
    response = supabase.rpc(
        'match_document_sections',
        {
            'query_embedding': query_embedding,
            'match_threshold': 0.3, # How strict the match should be (0 to 1)
            'match_count': match_count # How many paragraphs to return
        }
    ).execute()
    
    return response.data