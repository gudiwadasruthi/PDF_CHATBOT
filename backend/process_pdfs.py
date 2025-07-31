import sys
from pathlib import Path
import json
from heading_extractor import extract_outline
from analyze_collections import analyze_collection

BASE_DIR = Path(__file__).parent
input_dir = BASE_DIR / "input"
output_dir = BASE_DIR / "output"

def main():
    """
    Main function to run the entire two-stage hackathon pipeline.
    """
    # --- SETUP ---
    print(f"Input directory: {input_dir.resolve()}")
    print(f"Output directory: {output_dir.resolve()}")

    # Define a temporary, intermediate directory for the 1A results
    intermediate_dir = output_dir / "1a_outlines"
    intermediate_dir.mkdir(parents=True, exist_ok=True)
    
    if not any(input_dir.iterdir()):
        print("Warning: Input directory is empty. Nothing to process.", file=sys.stderr)
        return

    # --- STAGE 1: PDF EXTRACTION (ROUND 1A) ---
    print("\n--- Starting Stage 1: PDF Structure Extraction ---")
    pdf_files = list(input_dir.glob("*.pdf"))
    if not pdf_files:
        print("Warning: No PDF files found in input directory.", file=sys.stderr)
    else:
        for pdf_file in pdf_files:
            print(f"  - Processing: {pdf_file.name}")
            try:
                extracted_data = extract_outline(str(pdf_file))
                output_file_path = intermediate_dir / f"{pdf_file.stem}.json"
                with open(output_file_path, 'w', encoding='utf-8') as f:
                    json.dump(extracted_data, f, indent=4)
            except Exception as e:
                print(f"[ERROR] Failed during Stage 1 processing of {pdf_file.name}: {e}", file=sys.stderr)

    # --- STAGE 2: SEMANTIC ANALYSIS (ROUND 1B) ---
    input_config_path = input_dir / "challenge1b_input.json"
    if input_config_path.exists():
        try:
            analyze_collection(
                input_config_path=input_config_path,
                rich_sections_dir=intermediate_dir,
                output_dir=output_dir
            )
        except Exception as e:
            print(f"[ERROR] Failed during Stage 2 analysis: {e}", file=sys.stderr)
    else:
        print("\nInfo: `challenge1b_input.json` not found. Skipping Stage 2 analysis.")
        print("Stage 1 (outline extraction) results are available in:", intermediate_dir)

if __name__ == '__main__':
    main()