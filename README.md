# PDF Analysis Backend

## Approach Explanation: A Multi-Stage, Semantics-Driven Analysis Engine

Our solution for the "Connecting the Dots" challenge is designed to function as an intelligent document analyst, moving beyond simple text extraction to deliver true contextual relevance. The core of our approach is a sophisticated, modular pipeline that first understands the user's intent on a deep level and then uses that understanding to find, rank, and present the most useful information from a collection of documents.

### Key Components:

1. **NLP-Powered Query Expansion**
   - Uses NLTK and WordNet for dynamic query expansion
   - Enriches queries with relevant synonyms and semantically related terms
   - Ensures comprehensive, context-aware search

2. **Deep Semantic Analysis**
   - Powered by intfloat/e5-base-v2 sentence-embedding model
   - Converts queries and document content into "meaning vectors"
   - Runs efficiently offline on CPU

3. **Multi-Factor Ranking**
   - "Best Sections" list (50% title + 50% content relevance)
   - "Best Content" list (content-only relevance)
   - Mimics human expert evaluation

## Docker Setup and Execution

### Prerequisites
- Docker Desktop installed and running
- Input directory containing:
  - PDF documents
  - challenge1b_input.json
- Empty output directory for results

### Build the Docker Image
```bash
docker build --platform linux/amd64 -t adobe-hackathon-solution .
```

### Run the Solution

**macOS/Linux (Terminal):**
```bash
docker run --rm \
  -v "$(pwd)/input:/app/input:ro" \
  -v "$(pwd)/output:/app/output" \
  --network none \
  adobe-hackathon-solution
```

**Windows (PowerShell):**
```powershell
docker run --rm `
  -v "${pwd}\input:/app/input:ro" `
  -v "${pwd}\output:/app/output" `
  --network none `
  adobe-hackathon-solution
```

**Windows (Command Prompt):**
```cmd
# PDF Analysis Backend

A robust, containerized FastAPI backend for PDF extraction and semantic analysis. Upload PDFs, trigger semantic analysis, and retrieve results via API. Designed for easy deployment on Render.com or any Docker-compatible cloud service.

---

## Project Structure

```
pdf-analysis-app/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── process_pdfs.py          # Pipeline orchestrator
│   ├── analyze_collections.py   # Semantic analysis
│   ├── heading_extractor.py     # PDF structure extraction
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Container build file
│   ├── input/                   # Uploaded PDFs and input JSON
│   └── output/                  # Analysis results
├── frontend/                    # (optional, for UI)
├── README.md
└── approach_explanation.md
```

---

## Features
- **PDF Upload & Analysis API** (FastAPI)
- **Two-stage NLP pipeline**: PDF structure extraction + semantic ranking
- **Dockerized** for reproducible builds
- **Ready for cloud deployment** (Render, AWS, Azure, etc.)

---

## Local Development & Testing

### 1. Install Python dependencies (optional, for local run)
```sh
cd backend
pip install -r requirements.txt
```

### 2. Run the FastAPI server
```sh
uvicorn main:app --host 0.0.0.0 --port 10000
```

### 3. Test the API
- Health check: [http://localhost:10000/](http://localhost:10000/)
- Upload PDF:
  - POST `/upload/` (form-data, key: `file`, value: PDF file)
- Trigger analysis:
  - POST `/analyze/` (form-data: `persona`, `job`, `files`)

---

## Docker Build & Run

### 1. Build the Docker image
```sh
cd backend
# On Windows (PowerShell):
docker build -t pdf-analysis-backend .
```

### 2. Run the container
```sh
docker run -it --rm -p 10000:10000 pdf-analysis-backend
```

---

## Deployment (Render.com Example)

1. **Push your code to GitHub** (with backend/Dockerfile in place)
2. **Create a new Web Service** on [Render.com](https://render.com)
   - Environment: Docker
   - Root Directory: `backend`
   - Port: `10000`
3. **Deploy**. Render will build and expose your backend at a public URL.

---

## API Reference

### `GET /`
- Health check: returns `{ "status": "Backend is running" }`

### `POST /upload/`
- Upload a PDF file
- **Body:** `multipart/form-data`, key: `file`
- **Response:** `{ "filename": "..." }`

### `POST /analyze/`
- Trigger analysis on uploaded PDFs
- **Body:** `multipart/form-data`
    - `persona`: string
    - `job`: string
    - `files`: comma-separated PDF filenames
- **Response:** analysis results JSON or status message

---

## Tips & Troubleshooting
- Uploaded PDFs are stored in `backend/input/`
- Results are saved in `backend/output/challenge1b_output.json`
- For multi-file analysis, separate filenames with commas in `files`
- Check logs for errors if output is missing

---

## License
MIT

---

## Author
- Developed by Gudiwada sruthi
- For Adobe Hackathon 2025

```

### Notes:
- Runs fully offline once built
- Processes all PDFs in input directory
- Generates structured JSON output in output directory
