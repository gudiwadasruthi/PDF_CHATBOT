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
        # Debug: Entry point
        logging.info("[DEBUG] Entered upload_files endpoint")
        logging.info(f"[DEBUG] BASE_DIR: {BASE_DIR}")
        logging.info(f"[DEBUG] UPLOAD_DIR: {UPLOAD_DIR}")
        logging.info(f"[DEBUG] OUTPUT_DIR: {OUTPUT_DIR}")
        logging.info(f"[DEBUG] Received {len(pdfs)} PDFs and 1 JSON file")

        # Save PDFs
        for pdf in pdfs:
            file_path = UPLOAD_DIR / pdf.filename
            logging.info(f"[DEBUG] Saving PDF to: {file_path}")
            with open(file_path, "wb") as f:
                f.write(await pdf.read())
            logging.info(f"📄 Saved PDF: {pdf.filename}")

        # Save JSON
        json_path = UPLOAD_DIR / "challenge1b_input.json"
        logging.info(f"[DEBUG] Saving input JSON to: {json_path}")
        with open(json_path, "wb") as f:
            f.write(await input_json.read())
        logging.info(f"🧾 Saved input JSON at: {json_path}")

        # -------- Run process_pdfs.py --------
        script_path = BASE_DIR / "process_pdfs.py"
        logging.info(f"[DEBUG] Checking if script exists: {script_path.exists()}")
        if not script_path.exists():
            logging.error(f"[ERROR] {script_path} not found")
            raise FileNotFoundError(f"{script_path} not found")

        logging.info(f"🚀 Running script: {script_path}")
        logging.info(f"[DEBUG] Files in BASE_DIR: {list(BASE_DIR.iterdir())}")
        logging.info(f"[DEBUG] Environment variables: {os.environ}")
        cmd = [sys.executable, str(script_path)]
        logging.info(f"[DEBUG] Subprocess command: {cmd}")
        try:
            result = subprocess.run(
                cmd,
                cwd=str(BASE_DIR),
                capture_output=True,
                text=True,
                env=os.environ.copy()
            )
            logging.info("✅ Subprocess finished")
            logging.info(f"📤 STDOUT:\n{result.stdout}")
            logging.info(f"📥 STDERR:\n{result.stderr}")
            logging.info(f"[DEBUG] Subprocess return code: {result.returncode}")
        except Exception as sub_exc:
            logging.error(f"[ERROR] Exception during subprocess: {sub_exc}")
            logging.error(traceback.format_exc())
            return JSONResponse(status_code=500, content={"error": str(sub_exc), "traceback": traceback.format_exc()})

        if result.returncode != 0:
            logging.error(f"❌ Script failed with code {result.returncode}")
            return JSONResponse(status_code=500, content={
                "error": result.stderr,
                "stdout": result.stdout,
                "returncode": result.returncode
            })

        # -------- Load output JSON --------
        output_json_path = OUTPUT_DIR / "challenge1b_output.json"
        logging.info(f"[DEBUG] Checking for output file: {output_json_path}")
        if output_json_path.exists():
            logging.info(f"[DEBUG] Output file found. Returning contents.")
            with open(output_json_path) as f:
                return json.load(f)
        else:
            logging.warning(f"[WARNING] Output file not found: {output_json_path}")
            return {"status": "done", "message": "Analysis complete, but no output file found."}

    except Exception as e:
        logging.error("❌ Exception occurred:\n%s", traceback.format_exc())
        return JSONResponse(status_code=500, content={"error": str(e), "traceback": traceback.format_exc()})
    return {"status": "Backend is running"}


@app.get("/")
def root():
    return {"status": "Backend is running"}


@app.head("/")
def health_check():
    return JSONResponse(content={"status": "ok"}, status_code=200)
