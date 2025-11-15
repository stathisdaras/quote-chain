# Quote Chain

A modular application for storing and semantically searching through your highlights using AI-powered embeddings.

## Project Structure

```
quote-chain/
├── start.sh         # Start script (starts both backend and frontend)
├── backend/          # Python FastAPI backend
│   ├── main.py      # FastAPI application
│   ├── requirements.txt
│   ├── chroma_db/   # Vector database storage
│   └── ...
└── frontend/        # Angular frontend
    ├── src/
    └── ...
```

## Quick Start

The easiest way to start both backend and frontend:

1. Set up your OpenAI API key:
```bash
cd backend
echo "OPENAI_API_KEY=sk-your-openai-api-key" > .env
cd ..
```

2. Run the start script from the project root:
```bash
./start.sh
```

This will:
- Set up and start the backend server at `http://localhost:8000`
- Set up and start the frontend at `http://localhost:4200`
- Handle cleanup when you press Ctrl+C

## Features

- **Upload Highlights**: Upload CSV files containing highlights with metadata (book title, author, tags)
  - Upload dialog with file selection
  - Overwrite option to replace all existing highlights
  - Warning system for destructive operations
- **Semantic Search**: Search through highlights using natural language queries
  - Table view with pagination
  - Tag filtering support
  - Relevance scoring
- **RAG Mode (Retrieval-Augmented Generation)**: AI-powered chatbot interface
  - Toggle between table view and chatbot mode
  - Combines semantic search (top 10 results) with AI model responses
  - Conversational interface for asking questions about highlights
  - Context-aware answers based on your highlights
- **Modern UI**: Clean, responsive Angular frontend built with PrimeNG components

## Backend Setup

### Prerequisites

- Python 3.9 or higher
- OpenAI API key

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up environment variables:
```bash
export OPENAI_API_KEY="sk-your-openai-api-key"
```

Or create a `.env` file in the backend directory:
```
OPENAI_API_KEY=sk-your-openai-api-key
```

5. Start the backend server:
```bash
python main.py
```

Or use the start script:
```bash
./start.sh
```

The API will be available at `http://localhost:8000`

### API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Frontend Setup

### Prerequisites

- Node.js 16+ (Angular 15 compatible)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

The frontend will be available at `http://localhost:4200`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## CSV Format

The CSV file for uploading highlights must have the following columns:

- `Highlight` - The highlight text/content
- `Book Title` - Title of the book
- `Book Author` - Author of the book
- `Tags` - Comma-separated list of tags (e.g., "philosophy,work,passion")

Example:
```csv
Highlight,Book Title,Book Author,Tags
"The only way to do great work is to love what you do.",The Steve Jobs Biography,Walter Isaacson,philosophy,work,passion
"Innovation distinguishes between a leader and a follower.",The Steve Jobs Biography,Walter Isaacson,innovation,leadership
```

## Usage

### Using the Start Script (Recommended)

1. Make sure you have set up your OpenAI API key in `backend/.env`
2. Run from the project root:
```bash
./start.sh
```
3. Open `http://localhost:4200` in your browser
4. Upload a CSV file with your highlights:
   - Click the "CSV" button to open the upload dialog
   - Select your CSV file
   - Optionally enable "Overwrite existing entries" to replace all highlights
   - Click "Upload"
5. **Table Mode (Default)**:
   - Use the search bar to perform semantic searches
   - Results are displayed in a paginated table
   - Optionally add tags to filter search results
6. **RAG Mode (Chatbot)**:
   - Toggle the "RAG" switch on the right side of the upload button
   - Ask questions about your highlights in natural language
   - Receive AI-generated responses based on the top 10 most relevant highlights
   - Chat history is maintained during your session

### Manual Start

1. Start the backend server (see Backend Setup)
2. Start the frontend development server (see Frontend Setup)
3. Open `http://localhost:4200` in your browser
4. Upload a CSV file with your highlights
5. Choose between Table Mode or RAG Mode (Chatbot)
6. Search or chat with your highlights

## API Endpoints

### POST `/highlights`
Upload a CSV file with highlights.

### POST `/search`
Perform semantic search on highlights. Returns all matching results (no limit by default).

Request body:
```json
{
  "prompt": "What did Steve Jobs say about work?",
  "limit": null,
  "tags": ["philosophy", "work"]
}
```

### GET `/highlights`
Get all highlights with pagination.

Query parameters:
- `skip` (default: 0) - Number of records to skip
- `limit` (default: 10) - Number of records to return

### GET `/highlights/count`
Get the total number of stored highlights.

### DELETE `/highlights/clear`
Clear all stored highlights.

### POST `/rag/chat`
RAG (Retrieval-Augmented Generation) chat endpoint. Combines semantic search with AI model to generate contextual responses.

Request body:
```json
{
  "prompt": "What did Steve Jobs say about work?",
  "tags": ["philosophy", "work"]
}
```

Response:
```json
{
  "response": "Based on the highlights, Steve Jobs emphasized...",
  "sources": [
    {
      "content": "The only way to do great work is to love what you do.",
      "book_title": "The Steve Jobs Biography",
      "book_author": "Walter Isaacson",
      "tags": ["philosophy", "work"],
      "score": 0.95
    }
  ]
}
```

## Development

### Backend Development

Run with auto-reload:
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development

Run with auto-reload:
```bash
cd frontend
npm start
```

## Features in Detail

### Upload Dialog
- **File Selection**: Click "Choose File" to select a CSV file
- **Overwrite Mode**: When enabled, all existing highlights are deleted before uploading new ones
- **Warning System**: Clear warnings when overwrite mode is enabled
- **Error Handling**: Displays errors if upload fails

### Table Mode
- **Pagination**: Browse all highlights with configurable page sizes (10, 25, 50)
- **Search**: Semantic search returns all matching results
- **Tag Filtering**: Filter results by comma-separated tags
- **Relevance Scoring**: See how relevant each result is to your query

### RAG Mode (Chatbot)
- **Toggle Switch**: Enable/disable RAG mode with a slide toggle
- **Chat Interface**: Conversational UI with user and assistant messages
- **Context-Aware**: Uses top 10 semantic search results as context
- **AI Responses**: GPT-3.5-turbo generates answers based on your highlights
- **Chat History**: Maintains conversation history during session

## Notes

- ChromaDB stores data locally in the `backend/chroma_db/` directory
- OpenAI API key is required for storing highlights, searching, and RAG chat
- The API key should be set in environment variables or a `.env` file
- Embeddings are generated using OpenAI's text-embedding-3-small model (default)
- RAG mode uses GPT-3.5-turbo for generating responses
- When RAG mode is enabled, search queries are processed as chat messages instead of table searches
