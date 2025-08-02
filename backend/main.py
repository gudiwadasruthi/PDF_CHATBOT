from fastapi import FastAPI, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pathlib import Path
import subprocess
import logging
import sys
import traceback
import json
import os

# ---------------------- Setup ----------------------
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).parent.resolve()
UPLOAD_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"

UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO)

# ---------------------- Routes ----------------------

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
            logging.info(f"📄 Saved PDF: {pdf.filename}")

        # Save JSON
        json_path = UPLOAD_DIR / "challenge1b_input.json"
        with open(json_path, "wb") as f:
            f.write(await input_json.read())
        logging.info(f"🧾 Saved input JSON at: {json_path}")

        # -------- Run process_pdfs.py --------
        script_path = BASE_DIR / "process_pdfs.py"
        if not script_path.exists():
            raise FileNotFoundError(f"{script_path} not found")

        logging.info(f"🚀 Running script: {script_path}")
        logging.info(f"📂 Files in BASE_DIR: {list(BASE_DIR.iterdir())}")

        result = subprocess.run(
            [sys.executable, str(script_path)],
            cwd=str(BASE_DIR),
            capture_output=True,
            text=True
        )

        logging.info("✅ Subprocess finished")
        logging.info(f"📤 STDOUT:\n{result.stdout}")
        logging.info(f"📥 STDERR:\n{result.stderr}")

        if result.returncode != 0:
            logging.error(f"❌ Script failed with code {result.returncode}")
            return JSONResponse(status_code=500, content={
                "error": result.stderr,
                "stdout": result.stdout
            })

        # -------- Load output JSON --------
        output_json_path = OUTPUT_DIR / "challenge1b_output.json"
        if output_json_path.exists():
            with open(output_json_path) as f:
                return json.load(f)
        else:
            return {"status": "done", "message": "Analysis complete, but no output file found."}

    except Exception as e:
        logging.error("❌ Exception occurred:\n%s", traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.get("/")
def root():
    return {"status": "Backend is running"}


@app.head("/")
def health_check():
    return JSONResponse(content={"status": "ok"}, status_code=200)
