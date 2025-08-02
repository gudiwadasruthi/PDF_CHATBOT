from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
import json
from pathlib import Path
import subprocess
from typing import List
import sys

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

import logging

logging.basicConfig(level=logging.INFO)

@app.post("/upload/")
async def upload_files(
    pdfs: List[UploadFile] = File(...),
    input_json: UploadFile = File(...)
):
    try:
        # Save PDFs
        for pdf in pdfs:
            file_path = UPLOAD_DIR / pdf.filename
            with open(file_path, "wb") as f:
                f.write(await pdf.read())
            logging.info(f"Saved PDF: {pdf.filename}")

        # Save JSON
        json_path = UPLOAD_DIR / "challenge1b_input.json"
        with open(json_path, "wb") as f:
            f.write(await input_json.read())
        logging.info(f"Saved input JSON at: {json_path}")

        #Temporarily skip process_pdfs.py execution
        logging.info("About to run process_pdfs.py subprocess...")
        result = subprocess.run(
            [sys.executable, "process_pdfs.py"],
            cwd=BASE_DIR,
            capture_output=True,
            text=True
        )
        logging.info("Subprocess finished.")
        logging.info(f"STDOUT: {result.stdout}")
        logging.info(f"STDERR: {result.stderr}")

        if result.returncode != 0:
            logging.error(f"Process failed with code {result.returncode}")
            return JSONResponse(status_code=500, content={
                "error": result.stderr,
                "stdout": result.stdout
            })

        # Mocked response for now
        return {"status": "upload success", "message": "PDFs and JSON uploaded. Skipped analysis step."}

    except Exception as e:
        import traceback
        logging.error("❌ Exception occurred: %s", traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/")
def root():
    return {"status": "Backend is running"}


@app.head("/")
def health_check():
    return JSONResponse(content={"status": "ok"}, status_code=200)
