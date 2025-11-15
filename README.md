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
- **Semantic Search**: Search through highlights using natural language queries
- **Tag Filtering**: Optionally filter search results by tags
- **Modern UI**: Clean, responsive Angular frontend

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
4. Upload a CSV file with your highlights
5. Use the search bar to perform semantic searches
6. Optionally add tags to filter search results

### Manual Start

1. Start the backend server (see Backend Setup)
2. Start the frontend development server (see Frontend Setup)
3. Open `http://localhost:4200` in your browser
4. Upload a CSV file with your highlights
5. Use the search bar to perform semantic searches
6. Optionally add tags to filter search results

## API Endpoints

### POST `/highlights`
Upload a CSV file with highlights.

### POST `/search`
Perform semantic search on highlights.

Request body:
```json
{
  "prompt": "What did Steve Jobs say about work?",
  "limit": 5,
  "tags": ["philosophy", "work"]
}
```

### GET `/highlights/count`
Get the total number of stored highlights.

### DELETE `/highlights/clear`
Clear all stored highlights.

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

## Notes

- ChromaDB stores data locally in the `backend/chroma_db/` directory
- OpenAI API key is required for both storing and searching highlights
- The API key should be set in environment variables or a `.env` file
- Embeddings are generated using OpenAI's text-embedding-3-small model (default)
