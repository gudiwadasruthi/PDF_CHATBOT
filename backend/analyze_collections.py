# analyze_collections.py (Final, Docker-Ready Modular Version)

import json
from pathlib import Path
from sentence_transformers import SentenceTransformer, util
import torch
import datetime
import sys
import os
import nltk
from nltk.corpus import wordnet

# --- ENVIRONMENT-AWARE NLP SETUP ---
# Always use paths relative to the script location
BASE_DIR = Path(__file__).parent
INPUT_DIR = BASE_DIR / "input"
OUTPUT_DIR = BASE_DIR / "output"
NLTK_DATA_PATH_IN_CONTAINER = BASE_DIR / "nltk_data"

# Check if we are inside the Docker container by seeing if that path exists.
if NLTK_DATA_PATH_IN_CONTAINER.exists():
    nltk.data.path.append(str(NLTK_DATA_PATH_IN_CONTAINER))

else:
    # If we are running locally, use the standard download-on-demand logic.
    try:
        nltk.data.find('corpora/wordnet.zip')
        nltk.data.find('taggers/averaged_perceptron_tagger.zip')
        nltk.data.find('tokenizers/punkt.zip')
    except LookupError:
        print("Downloading NLTK data for local development (one-time setup)...")
        # For local use, we download to the path NLTK expects by default.
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        nltk.download('punkt', quiet=True)
        print("NLTK data download complete.")

# --- YOUR MODULAR FUNCTIONS (UNCHANGED) ---

def expand_query_with_nlp(persona, job_to_be_done):
    """
    Generates an expanded query string using task context.
    """
    base_query = f"Persona: {persona}. Task: {job_to_be_done}. "
    persona_enrichment = (
        "Focus on important, useful, or contextually relevant parts of the documents that would help in this task. "
        "Look for how-to information, actionable sections, or domain-relevant content."
    )
    return base_query + persona_enrichment

def load_sections(documents, rich_sections_dir):
    """Loads all pre-processed sections from the intermediate JSON files."""
    all_sections = []
    for doc_info in documents:
        rich_json_path = rich_sections_dir / f"{Path(doc_info['filename']).stem}.json"
        if rich_json_path.exists():
            with open(rich_json_path, 'r', encoding='utf-8') as f:
                rich_data = json.load(f)
            for section in rich_data.get("outline", []):
                section['document'] = doc_info['filename']
                section['section_title'] = section.pop('text')
                all_sections.append(section)
    return all_sections

def rank_sections(all_sections, query_embedding, model):
    """Performs the two-level ranking and returns the top sections."""
    section_titles = [s['section_title'] for s in all_sections]
    section_contents = [s.get('content', '') for s in all_sections]

    title_embeddings = model.encode(["passage: " + t for t in section_titles], convert_to_tensor=True, show_progress_bar=False)
    content_embeddings = model.encode(["passage: " + c for c in section_contents], convert_to_tensor=True, show_progress_bar=False)

    title_scores = util.cos_sim(query_embedding, title_embeddings)[0]
    content_scores = util.cos_sim(query_embedding, content_embeddings)[0]

    combined_sections = []
    content_only_sections = []

    for i, section in enumerate(all_sections):
        combined_score = 0.5 * content_scores[i].item() + 0.5 * title_scores[i].item()
        content_score = content_scores[i].item()
        combined_sections.append({**section, 'score': combined_score})
        content_only_sections.append({**section, 'score': content_score})

    top_extracted = sorted(combined_sections, key=lambda s: s['score'], reverse=True)[:5]
    top_content = sorted(content_only_sections, key=lambda s: s['score'], reverse=True)[:5]
    return top_extracted, top_content

def build_output(documents, persona, job, top_extracted, top_content):
    """Formats the final results into the required JSON structure."""
    output = {
        "metadata": {
            "input_documents": [d['filename'] for d in documents],
            "persona": persona, "job_to_be_done": job,
            "processing_timestamp": datetime.datetime.now().isoformat()
        },
        "extracted_sections": [], "subsection_analysis": []
    }
    for i, section in enumerate(top_extracted):
        output["extracted_sections"].append({
            "document": section['document'], "section_title": section['section_title'],
            "importance_rank": i + 1, "page_number": section['page']
        })
    for section in top_content:
        output["subsection_analysis"].append({
            "document": section['document'],
            "refined_text": section.get('content', section['section_title']),
            "page_number": section['page']
        })
    return output

# --- THE MAIN CONDUCTOR FUNCTION ---

def analyze_collection(input_config_path: Path, rich_sections_dir: Path, output_dir: Path):
    """
    Orchestrates the entire analysis pipeline, from loading to saving the final output.
    """
    print(f"\n--- Starting Stage 2: Deep Semantic Analysis for {input_config_path.parent.name} ---")

    with open(input_config_path, 'r', encoding='utf-8') as f:
        config = json.load(f)
    persona, job, documents = config['persona']['role'], config['job_to_be_done']['task'], config['documents']

    # --- ENHANCED MODEL LOADING WITH FALLBACKS ---
    print("Loading semantic analysis model...")
    model_name = 'intfloat/e5-base-v2'
    
    # Check multiple possible cache locations
    possible_cache_folders = [
        os.getenv("SENTENCE_TRANSFORMERS_HOME"),
        os.getenv("TRANSFORMERS_CACHE"),
        "/app/model_cache",  # Docker default
        os.path.expanduser("~/.cache/huggingface/hub"),  # Local default
    ]
    
    # Find the first existing cache folder
    cache_folder = None
    for folder in possible_cache_folders:
        if folder and os.path.exists(folder):
            cache_folder = folder
            print(f"  - Using cache folder: {cache_folder}")
            break
    
    # Load the model with error handling
    try:
        model = SentenceTransformer(
            model_name,
            cache_folder=cache_folder,
            device='cpu'  # Force CPU for consistency between environments
        )
        print("  - Model loaded successfully")
    except Exception as e:
        print(f"  - Error loading model: {str(e)}")
        print("  - Attempting to load model without cache...")
        try:
            model = SentenceTransformer(model_name, device='cpu')
            print("  - Model loaded without cache")
        except Exception as e2:
            print(f"  - Critical: Failed to load model: {str(e2)}")
            print("  - The application cannot continue without the model.")
            raise
    # -----------------------------------------------------------

    expanded_query = expand_query_with_nlp(persona, job)
    print(f"  - Using Expanded Query: {expanded_query}")
    query_embedding = model.encode("query: " + expanded_query, convert_to_tensor=True, show_progress_bar=False)

    all_sections = load_sections(documents, rich_sections_dir)
    if not all_sections:
        print("Error: No sections were found in the pre-processed files.", file=sys.stderr)
        return

    top_extracted, top_content = rank_sections(all_sections, query_embedding, model)
    output_json = build_output(documents, persona, job, top_extracted, top_content)

    output_path = output_dir / "challenge1b_output.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_json, f, indent=4)

    print(f"Analysis complete. Final Round 1B output saved to {output_path}")

# --- LOCAL TESTING HARNESS (UNCHANGED) ---
if __name__ == '__main__':
    collection_dir = Path("./Challenge_1b/Collection 1")
    intermediate_dir = Path("./output/intermediate_rich_sections")
    final_output_dir = Path("./output/final_1b_results")
    final_output_dir.mkdir(parents=True, exist_ok=True)

    if not intermediate_dir.is_dir() or not any(intermediate_dir.iterdir()):
        print(f"Error: Intermediate directory '{intermediate_dir}' is empty or not found.", file=sys.stderr)
        print("Please run the Stage 1 extraction script (`process_pdfs.py`) first.", file=sys.stderr)
        sys.exit(1)

    analyze_collection(
        input_config_path=collection_dir / "challenge1b_input.json",
        rich_sections_dir=intermediate_dir,
        output_dir=final_output_dir
    )