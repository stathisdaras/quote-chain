"""
LangChain Highlights API
Stores highlights with embeddings and performs semantic search
"""
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
import os
import csv
import io
from dotenv import load_dotenv
import pandas as pd

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Highlights API",
    version="1.0.0",
    swagger_ui_parameters={"tryItOutEnabled": True}
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Get OpenAI API key from environment
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Global vector store
vector_store: Optional[Chroma] = None


class SearchRequest(BaseModel):
    prompt: str
    limit: Optional[int] = None  # If None, return all matching results
    tags: Optional[List[str]] = None  # Filter by document tags


class SearchResult(BaseModel):
    content: str
    book_title: str
    book_author: str
    tags: List[str]
    score: float


@app.get("/")
async def root():
    return {
        "message": "Highlights API",
        "version": "1.0.0",
        "endpoints": {
            "POST /highlights": "Store highlights with embeddings",
            "POST /search": "Perform semantic search on highlights",
        },
    }


def get_vector_store() -> Chroma:
    """Get or create vector store"""
    global vector_store
    if vector_store is None:
        embeddings = OpenAIEmbeddings(openai_api_key=OPENAI_API_KEY)
        vector_store = Chroma(
            collection_name="highlights",
            embedding_function=embeddings,
            persist_directory="./chroma_db",
        )
    return vector_store


@app.post("/highlights")
async def store_highlights(file: UploadFile = File(...)):
    """
    Store highlights from CSV file with embeddings in the vector database.
    CSV must have columns: Highlight, Book Title, Book Author, Document Tags
    Tags should be comma-separated values.
    Uses OPENAI_API_KEY from environment variables.
    """
    try:
        # Validate file type
        if not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="File must be a CSV file")

        # Read CSV file
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        # Validate required columns
        required_columns = ['Highlight', 'Book Title', 'Book Author', 'Tags']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )

        # Get vector store
        vectorstore = get_vector_store()

        # Prepare documents and metadata
        documents = []
        metadatas = []

        for _, row in df.iterrows():
            highlight = str(row['Highlight']).strip()
            if not highlight or highlight == 'nan':
                continue

            book_title = str(row['Book Title']).strip() if pd.notna(row['Book Title']) else ""
            book_author = str(row['Book Author']).strip() if pd.notna(row['Book Author']) else ""
            
            # Parse tags (comma-separated, remove empty strings)
            tags_str = str(row['Tags']).strip() if pd.notna(row['Tags']) else ""
            tags = [tag.strip() for tag in tags_str.split(',') if tag.strip()] if tags_str else []

            documents.append(highlight)
            metadatas.append({
                "book_title": book_title,
                "book_author": book_author,
                "tags": ",".join(tags) if tags else "",  # Store tags as comma-separated string for filtering
            })

        # Add documents to vector store
        if documents:
            vectorstore.add_texts(texts=documents, metadatas=metadatas)
            vectorstore.persist()

        return {
            "message": f"Successfully stored {len(documents)} highlights",
            "count": len(documents),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error storing highlights: {str(e)}")


@app.post("/search", response_model=List[SearchResult])
async def search_highlights(request: SearchRequest):
    """
    Perform semantic search on stored highlights with optional tag filtering.
    Uses OPENAI_API_KEY from environment variables.
    """
    if not request.prompt:
        raise HTTPException(status_code=400, detail="Search prompt is required")

    try:
        # Get vector store
        vectorstore = get_vector_store()

        # Get total count to determine how many results to fetch
        collection = vectorstore._collection
        total_count = collection.count()
        
        # If no limit specified or limit is very large, get all results
        # Otherwise use the specified limit
        if request.limit is None or request.limit >= total_count:
            search_k = total_count if total_count > 0 else 1000  # Get all or max 1000
        else:
            # Get more results if filtering by tags to account for filtering
            search_k = request.limit * 3 if request.tags else request.limit
        
        docs_with_scores = vectorstore.similarity_search_with_score(
            request.prompt, k=min(search_k, total_count) if total_count > 0 else search_k
        )

        # Format results and apply tag filtering
        search_results = []
        for doc, score in docs_with_scores:
            metadata = doc.metadata if hasattr(doc, "metadata") else {}
            
            # Parse tags from metadata
            tags_str = metadata.get("tags", "")
            tags = [tag.strip() for tag in tags_str.split(",") if tag.strip()] if tags_str else []

            # Filter by tags if specified
            if request.tags:
                # Check if any of the requested tags match the document's tags
                if not any(tag.lower() in [t.lower() for t in tags] for tag in request.tags):
                    continue

            # Convert distance to similarity score (lower distance = higher similarity)
            similarity_score = 1.0 - min(abs(score), 1.0)

            search_results.append(
                SearchResult(
                    content=doc.page_content,
                    book_title=metadata.get("book_title", "Unknown"),
                    book_author=metadata.get("book_author", "Unknown"),
                    tags=tags,
                    score=round(similarity_score, 4),
                )
            )

            # Stop if limit is specified and we have enough results
            if request.limit and len(search_results) >= request.limit:
                break

        if not search_results:
            raise HTTPException(
                status_code=404, detail="No highlights found matching the criteria."
            )

        return search_results

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error performing search: {str(e)}")


@app.get("/highlights")
async def get_all_highlights(skip: int = 0, limit: int = 10):
    """Get all highlights with pagination."""
    try:
        vectorstore = get_vector_store()
        collection = vectorstore._collection
        
        # Get all documents
        results = collection.get()
        
        if not results or not results.get('ids'):
            return {
                "highlights": [],
                "total": 0,
                "skip": skip,
                "limit": limit
            }
        
        # Extract documents and metadata
        ids = results.get('ids', [])
        metadatas = results.get('metadatas', [])
        documents = results.get('documents', [])
        
        # Format highlights
        all_highlights = []
        for i, doc_id in enumerate(ids):
            metadata = metadatas[i] if i < len(metadatas) else {}
            content = documents[i] if i < len(documents) else ""
            
            tags_str = metadata.get("tags", "")
            tags = [tag.strip() for tag in tags_str.split(",") if tag.strip()] if tags_str else []
            
            all_highlights.append(
                SearchResult(
                    content=content,
                    book_title=metadata.get("book_title", "Unknown"),
                    book_author=metadata.get("book_author", "Unknown"),
                    tags=tags,
                    score=1.0,  # No relevance score for all highlights
                )
            )
        
        # Apply pagination
        total = len(all_highlights)
        paginated_highlights = all_highlights[skip:skip + limit]
        
        return {
            "highlights": paginated_highlights,
            "total": total,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        return {
            "highlights": [],
            "total": 0,
            "skip": skip,
            "limit": limit
        }


@app.get("/highlights/count")
async def get_highlights_count():
    """Get the total number of stored highlights."""
    try:
        vectorstore = get_vector_store()
        # Get collection and count
        collection = vectorstore._collection
        count = collection.count()
        return {"count": count}
    except:
        return {"count": 0}


@app.delete("/highlights/clear")
async def clear_highlights():
    """Clear all stored highlights."""
    global vector_store
    try:
        if vector_store is not None:
            collection = vector_store._collection
            collection.delete()
            vector_store = None
        return {"message": "All highlights cleared successfully"}
    except Exception as e:
        return {"message": f"Error clearing highlights: {str(e)}"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)

