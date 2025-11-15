# Quote Chain

A modular application for storing and semantically searching through your highlights using AI-powered embeddings.

## Project Structure

```
quote-chain/
├── docker-compose.yml  # Docker Compose configuration
├── start.sh            # Start script (starts both backend and frontend)
├── backend/            # Python FastAPI backend
│   ├── Dockerfile     # Backend Docker image
│   ├── main.py        # FastAPI application
│   ├── requirements.txt
│   ├── chroma_db/     # Vector database storage
│   └── ...
└── frontend/           # Angular frontend
    ├── Dockerfile     # Frontend Docker image
    ├── nginx.conf     # Nginx configuration for production
    ├── proxy.conf.json # Proxy config for local development
    ├── src/
    └── ...
```

## Quick Start

### Option 1: Docker (Recommended)

The easiest way to get started is using Docker Compose:

1. **Prerequisites**: 
   - Docker and Docker Compose installed
   - OpenAI API key

2. **Set up your OpenAI API key**:
   
   **Option A**: Export as environment variable:
   ```bash
   export OPENAI_API_KEY=sk-your-openai-api-key
   ```
   
   **Option B**: Create a `.env` file in the `backend` directory:
   ```bash
   echo "OPENAI_API_KEY=sk-your-openai-api-key" > backend/.env
   ```
   
   Docker Compose will automatically load the API key from either the environment variable or the `backend/.env` file.

3. **Start the application**:
   ```bash
   docker-compose up --build
   ```

4. **Access the application**:
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

5. **Stop the application**:
   ```bash
   docker-compose down
   ```

**Note**: The first build may take a few minutes as it installs all dependencies. Subsequent starts will be much faster.

### Option 2: Start Script

For local development without Docker:

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

### Using Docker (Recommended)

1. Make sure Docker is running and you have set your `OPENAI_API_KEY` environment variable
2. Start the containers:
   ```bash
   docker-compose up --build
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

### Using the Start Script

1. Make sure you have set up your OpenAI API key in `backend/.env`
2. Run from the project root:
```bash
./start.sh
```
3. Open `http://localhost:4200` in your browser
4. Follow steps 4-6 from the Docker section above

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

## Docker Deployment

### Building and Running with Docker

The application is fully containerized and can be run with Docker Compose:

```bash
# Build and start all services
docker-compose up --build

# Start in detached mode (background)
docker-compose up -d --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up --build
```

### Docker Architecture

- **Backend Container**: Python 3.9 with FastAPI, runs on port 8000
- **Frontend Container**: Nginx serving built Angular app, runs on port 4200
- **Data Persistence**: ChromaDB data is stored in `backend/chroma_db/` volume
- **Networking**: Services communicate via Docker's internal network
- **Health Checks**: Backend includes health checks to ensure proper startup

### Environment Configuration

The `OPENAI_API_KEY` can be provided in two ways:

1. **Environment Variable** (recommended for CI/CD):
   ```bash
   export OPENAI_API_KEY=sk-your-key
   docker-compose up
   ```

2. **`.env` File** (for local development):
   ```bash
   echo "OPENAI_API_KEY=sk-your-key" > backend/.env
   docker-compose up
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

- **Docker**: When running with Docker, the frontend uses `/api` path which is proxied to the backend by nginx
- **Local Development**: When running locally, Angular's proxy configuration routes `/api` requests to `http://localhost:8000`
- **Data Persistence**: ChromaDB stores data locally in the `backend/chroma_db/` directory (persisted via Docker volumes when using Docker)
- **OpenAI API Key**: Required for storing highlights, searching, and RAG chat
- **API Key Configuration**: Can be set via environment variable or `backend/.env` file
- **Embeddings**: Generated using OpenAI's text-embedding-3-small model (default)
- **RAG Mode**: Uses GPT-3.5-turbo for generating responses based on top 10 semantic search results
- **Mode Switching**: When RAG mode is enabled, search queries are processed as chat messages instead of table searches
