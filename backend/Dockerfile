# Use a specific, stable, and lightweight version of Python for reproducibility.
FROM --platform=linux/amd64 python:3.10-slim

WORKDIR /app

# --- 1. INSTALL SYSTEM DEPENDENCIES ---
RUN apt-get update && apt-get install -y \
    tesseract-ocr \
    libgl1-mesa-glx \
    && rm -rf /var/lib/apt/lists/*

# --- 2. CREATE NECESSARY DIRECTORIES ---
RUN mkdir -p /app/model_cache /app/nltk_data /app/input /app/output \
    && chmod -R 777 /app/model_cache /app/nltk_data /app/input /app/output

# --- 3. SET ENVIRONMENT VARIABLES ---
ENV SENTENCE_TRANSFORMERS_HOME=/app/model_cache
ENV TRANSFORMERS_CACHE=/app/model_cache
ENV NLTK_DATA=/app/nltk_data
ENV TOKENIZERS_PARALLELISM=false
ENV PYTHONUNBUFFERED=1

# --- 4. INSTALL PYTHON LIBRARIES ---
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- 5. PRE-DOWNLOAD OFFLINE ASSETS ---
COPY setup_offline_assets.py .
RUN python setup_offline_assets.py

# --- 6. COPY MAIN SOURCE CODE ---
COPY *.py ./

# --- 7. DEFINE THE RUN COMMAND ---
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "10000"]