from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import json
from pathlib import Path
import subprocess
from typing import List

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
async def upload_files(
    pdfs: List[UploadFile] = File(...),
    input_json: UploadFile = File(...)
):
    # Save PDFs
    for pdf in pdfs:
        file_path = UPLOAD_DIR / pdf.filename
        with open(file_path, "wb") as f:
            f.write(await pdf.read())
    # Save JSON
    json_path = UPLOAD_DIR / "challenge1b_input.json"
    with open(json_path, "wb") as f:
        f.write(await input_json.read())
    # Run your processing script
    result = subprocess.run(
        ["python", "process_pdfs.py"],
        cwd=BASE_DIR,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        return JSONResponse(status_code=500, content={"error": result.stderr})
    # Return output JSON
    output_json_path = OUTPUT_DIR / "challenge1b_output.json"
    if output_json_path.exists():
        with open(output_json_path) as f:
            return json.load(f)
    return {"status": "done", "message": "Analysis complete, but no output file found."}

@app.get("/")
def root():
    return {"status": "Backend is running"}