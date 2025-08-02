import sys
from pathlib import Path
import logging
import json

# Setup logging
logging.basicConfig(level=logging.INFO)
logging.info("📦 Starting process_pdfs.py")
print("🟢 Starting process_pdfs.py", flush=True)

# Define paths
BASE_DIR = Path(__file__).parent
input_dir = BASE_DIR / "input"
output_dir = BASE_DIR / "output"

def main():
    print("🏁 Entered main() in process_pdfs.py", flush=True)
    print(f"📂 Input directory: {input_dir.resolve()}", flush=True)
    print(f"📂 Output directory: {output_dir.resolve()}", flush=True)

    # --- STAGE 1 ---
    try:
        from heading_extractor import extract_outline  # 👈 Lazy import
    except Exception as e:
        print(f"❌ Failed to import heading_extractor: {e}", file=sys.stderr, flush=True)
        return

    intermediate_dir = output_dir / "1a_outlines"
    intermediate_dir.mkdir(parents=True, exist_ok=True)

    pdf_files = list(input_dir.glob("*.pdf"))
    if not pdf_files:
        print("⚠️ No PDFs to process", file=sys.stderr, flush=True)
    else:
        for pdf_file in pdf_files:
            print(f"🔍 Processing {pdf_file.name}", flush=True)
            try:
                extracted_data = extract_outline(str(pdf_file))
                with open(intermediate_dir / f"{pdf_file.stem}.json", 'w', encoding='utf-8') as f:
                    json.dump(extracted_data, f, indent=4)
            except Exception as e:
                print(f"[ERROR] ❌ Failed Stage 1 for {pdf_file.name}: {e}", file=sys.stderr, flush=True)

    # --- STAGE 2 ---
    input_config_path = input_dir / "challenge1b_input.json"
    if input_config_path.exists():
        try:
            from analyze_collections import analyze_collection  # 👈 Lazy import after Stage 1
        except Exception as e:
            print(f"❌ Failed to import analyze_collections: {e}", file=sys.stderr, flush=True)
            return

        print("🚀 Starting Stage 2: Semantic Analysis", flush=True)
        try:
            analyze_collection(
                input_config_path=input_config_path,
                rich_sections_dir=intermediate_dir,
                output_dir=output_dir
            )
        except Exception as e:
            print(f"[ERROR] ❌ Failed during Stage 2: {e}", file=sys.stderr, flush=True)
    else:
        print("ℹ️ challenge1b_input.json not found — skipping Stage 2", flush=True)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        logging.error("❌ Unhandled exception in process_pdfs.py", exc_info=True)
        print(f"[CRITICAL] ❌ Unhandled exception: {e}", file=sys.stderr, flush=True)
        sys.exit(1)
