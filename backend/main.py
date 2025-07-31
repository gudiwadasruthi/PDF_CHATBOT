from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import json
from pathlib import Path
import subprocess

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent
UPLOAD_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.post("/upload/")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = UPLOAD_DIR / file.filename
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}

@app.post("/analyze/")
async def analyze(
    persona: str = Form(...),
    job: str = Form(...),
    files: str = Form(...)
):
    file_list = files.split(",")
    challenge_input = {
        "persona": {"role": persona},
        "job_to_be_done": {"task": job},
        "documents": [{"filename": f} for f in file_list]
    }
    input_json_path = UPLOAD_DIR / "challenge1b_input.json"
    with open(input_json_path, "w") as f:
        json.dump(challenge_input, f)
    # Run your pipeline
    result = subprocess.run(
        ["python", "process_pdfs.py"],
        cwd=BASE_DIR,  # Make sure to run from backend dir!
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return JSONResponse(status_code=500, content={"error": result.stderr})
    output_json_path = OUTPUT_DIR / "challenge1b_output.json"
    if output_json_path.exists():
        with open(output_json_path) as f:
            return json.load(f)
    return {"status": "done", "message": "Analysis complete, but no output file found."}

@app.get("/")
def root():
    return {"status": "Backend is running"}