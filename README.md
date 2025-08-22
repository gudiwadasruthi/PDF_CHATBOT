# 📄 PDF Chatbot – Upload, Analyze & Chat with PDFs

AI-powered web app to **upload PDFs**, **analyze them with AI**, and **ask questions** about their content.  
No in-page PDF viewer — just clean, fast, and interactive analysis.

**🚀 Live Demo:** [https://pdf-chatbot-chi.vercel.app/](https://pdf-chatbot-chi.vercel.app/)

---

## 📑 Table of Contents
- [💡 About the Project](#-about-the-project)
- [✨ Features](#-features)
- [🖥️ Frontend](#️-frontend)
- [⚙️ Backend](#-backend)
- [🚀 Getting Started](#-getting-started)
- [🛠️ Run Backend (Docker)](#️-run-backend-docker)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [🙏 Acknowledgements](#-acknowledgements)
- [📜 License](#-license)


---

## 💡 About the Project
PDF Chatbot is designed for developers and knowledge workers who need to **quickly extract insights** from PDF files.  
Instead of scrolling through long documents, you can upload them, define a **persona** and **job to be done**, and get **AI-powered summaries, explanations, and answers**.

Built for the **Adobe Hackathon 2025**, it supports:
- Multiple PDF uploads
- NLP-based semantic search and summarization
- Fully containerized backend for easy deployment
- Frontend hosted on Vercel and backend on Render

---

## ✨ Features

### 🖥️ Frontend
- Modern, responsive UI built with HTML, CSS, and Vanilla JavaScript
- Animated design: gradient backgrounds, glowing borders, and smooth hover effects
- Drag-and-drop PDF upload modal with file list, progress bar, and toast notifications
- Persona & Task inputs inside an Analyze modal for customized document analysis
- Results panel that displays:
     - Subsection analysis (bullet-pointed insights with scores)
     - Extracted sections from documents
     - Quick summaries per PDF (scrollable summary cards)
     - Explanations for user queries (“Ask Anything” form)
- Interactive UX elements: copy-to-clipboard buttons, thinking/loading spinners, auto-closing modals
- Progress feedback: smooth progress indicators for both upload and analysis steps
- Theme switching support (saved in localStorage)
- Mobile-friendly layout: stacked cards, full-screen modals, and scrollable summaries

### ⚙️ Backend
- FastAPI server for PDF processing & AI analysis
- NLP with sentence-transformers & semantic ranking
- Multi-file PDF support
- Persona & job-specific output customization
- Structured JSON responses for frontend rendering
- Docker-ready and CORS enabled

### 🔒 Privacy & Security
- No in-browser PDF embedding (avoids CORS/privacy issues)
- Files processed in-memory or securely stored
- No chat history — only local theme and last upload names saved

---

## 🛠 Tech Stack

**Frontend**
- HTML, CSS, Vanilla JavaScript (fully custom, no frameworks)
- Font Awesome (CDN) for icons
- Custom animations & responsive design with pure CSS
- Fetch API + XMLHttpRequest for backend communication and progress tracking
- Static site — runs without build tools or bundlers

**Backend**
- Python 3.9+, FastAPI 0.110.0, Uvicorn 0.29.0
- PyMuPDF, pdfplumber, Pillow, pytesseract
- sentence-transformers, torch, scikit-learn, nltk, numpy<2.0
- CORS enabled
- Dockerized for deployment

**Deployment**
- Frontend → Vercel
- Backend → Render

---

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PDF_CHATBOT
   ```
2. **Build the backend Docker image:**
   ```bash
   docker build -t pdf-chatbot-backend ./backend
   ```
3. **Run the backend:**
   ```bash
   docker run -e PORT=8000 -p 8000:8000 pdf-chatbot-backend
   ```
4. **Serve the frontend:**
   - Use VSCode Live Server, Python `http.server`, or any static server:
     ```bash
     cd frontend
     python -m http.server 8080
     # or use Live Server extension in VSCode
     ```
   - Open [http://localhost:8080](http://localhost:8080)

---

## Usage
1. Click Upload PDFs → drag & drop or select files
2. Click Done to upload
3. Click Analyze Collection, enter a persona and job/task, then click Start Analysis
4. Or click Quick Summary for fast document takeaways
5. Use Ask Anything to query explanations

---

## Project Structure
```
PDF_CHATBOT/
├── backend/
│   ├── main.py                  # FastAPI app
│   ├── analyze_collections.py   # Semantic analysis
│   ├── heading_extractor.py     # PDF structure extraction
│   ├── summary.py               # Summary generation
│   ├── explain.py               # Explanations
│   ├── setup_offline_assets.py  # Offline cache/setup
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Container build file
├── frontend/
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── ...
├── README.md
└── ...
```

## Troubleshooting
- If Analyze button is disabled: select at least one PDF and fill both persona & job fields
- If analysis fails: check backend logs, CORS, or API URL in `script.js`
- For Docker issues: ensure ports are mapped and backend is running

---

## 🤝 Contributing
Contributions are welcome!  
If you'd like to improve this project, please follow these steps:  
1. Fork the repository  
2. Create a feature branch (`git checkout -b feature-name`)  
3. Commit your changes (`git commit -m 'Add new feature'`)  
4. Push to your branch (`git push origin feature-name`)  
5. Open a Pull Request  

---

## 🙏 Acknowledgements
This project wouldn’t be possible without these amazing tools and libraries:  
- [FastAPI](https://fastapi.tiangolo.com/) – Backend framework  
- [Sentence Transformers](https://www.sbert.net/) – Embeddings and NLP  
- [PyMuPDF](https://pymupdf.readthedocs.io/) – PDF parsing  
- [pdfplumber](https://github.com/jsvine/pdfplumber) – Text extraction  
- [pytesseract](https://pypi.org/project/pytesseract/) – OCR  
- [Tailwind CSS](https://tailwindcss.com/) & [Bootstrap](https://getbootstrap.com/) – Styling  
- [Font Awesome](https://fontawesome.com/) – Icons  

---
## License
MIT

## Author
- Developed by Gudiwada sruthi
