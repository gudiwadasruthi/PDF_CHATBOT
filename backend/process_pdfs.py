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

    # --- STAGE 1: PDF Structure Extraction (ROUND 1A) ---
    print("\n🚧 Starting Stage 1: PDF Structure Extraction", flush=True)

    try:
        from heading_extractor import extract_outline  # 👈 Lazy import
        print("✅ Successfully imported extract_outline from heading_extractor", flush=True)
    except Exception as e:
        print(f"❌ Failed to import heading_extractor: {e}", file=sys.stderr, flush=True)
        return

    intermediate_dir = output_dir / "1a_outlines"
    intermediate_dir.mkdir(parents=True, exist_ok=True)
    print(f"📁 Intermediate output directory created at: {intermediate_dir.resolve()}", flush=True)

    pdf_files = list(input_dir.glob("*.pdf"))
    print(f"📄 Scanning input directory: {input_dir.resolve()}", flush=True)
    if not pdf_files:
        print("⚠️ No PDFs to process in input directory.", file=sys.stderr, flush=True)
    else:
        print(f"🗂 Found {len(pdf_files)} PDF(s) to process.", flush=True)
        for pdf_file in pdf_files:
            print(f"\n🔍 Processing: {pdf_file.name}", flush=True)
            try:
                extracted_data = extract_outline(str(pdf_file))
                heading_count = len(extracted_data.get("outline", []))
                print(f"   ✅ Extracted {heading_count} heading(s)", flush=True)

                output_file_path = intermediate_dir / f"{pdf_file.stem}.json"
                print(f"   💾 Saving extracted outline to: {output_file_path}", flush=True)

                with open(output_file_path, 'w', encoding='utf-8') as f:
                    json.dump(extracted_data, f, indent=4)

                if output_file_path.exists():
                    size_kb = output_file_path.stat().st_size / 1024
                    print(f"   📁 File saved successfully ({size_kb:.2f} KB)", flush=True)
                else:
                    print("   ❌ File save failed unexpectedly!", file=sys.stderr, flush=True)

            except Exception as e:
                print(f"[ERROR] ❌ Exception while processing {pdf_file.name}: {e}", file=sys.stderr, flush=True)

    # --- STAGE 2 ---
    input_config_path = input_dir / "challenge1b_input.json"
    if input_config_path.exists():
        try:
            from analyze_collections import analyze_collection  # 👈 Lazy import after Stage 1
            print("✅ Successfully imported analyze_collection from analyze_collections", flush=True)
        except Exception as e:
            print(f"❌ Failed to import analyze_collections: {e}", file=sys.stderr, flush=True)
            return

        print("\n🚀 Starting Stage 2: Semantic Analysis", flush=True)
        
        # 🔍 Add these debug lines:
        print(f"📥 Input config path: {input_config_path.resolve()}", flush=True)
        print(f"📂 Rich sections dir: {intermediate_dir.resolve()}", flush=True)
        print(f"📂 Output dir for final JSON: {output_dir.resolve()}", flush=True)

        print(f"📦 Listing JSON files in {intermediate_dir}:", flush=True)
        for f in intermediate_dir.glob("*.json"):
            print(f"   - {f.name}", flush=True)

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
