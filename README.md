<div align="center">

# 🎓 Smart Study Planner + AI Tutor

**Turn your syllabus and exam date into an adaptive study plan, ask questions from your own notes, and track exam readiness — all in one place.**

![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)

[Project Page](https://muhammadabdullahtariq01363.github.io/smart-study-planner/) · [Source Code](https://github.com/MuhammadAbdullahTariq01363/smart-study-planner)

</div>

---

## ✨ Features

| | Feature | What it does |
| :-: | :--- | :--- |
| 📚 | **Syllabus Manager** | Add subjects and topics with difficulty and exam dates |
| 🗓️ | **Adaptive Planner** | Generates a weekly study schedule from your exam date and topic weight, and re-plans when you fall behind |
| 📝 | **Notes + RAG Tutor** | Upload PDF/DOCX notes and ask questions — answers are grounded in *your* material |
| 🧠 | **Quiz Engine** | AI-generated quizzes that focus on your weak concepts |
| 📊 | **Progress Dashboard** | Visual exam-readiness score, topic mastery and study streaks |
| 🔐 | **Secure Accounts** | JWT authentication with bcrypt-hashed passwords; each student's data is isolated |

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Recharts, Lucide Icons |
| **Backend** | Python, FastAPI, Uvicorn, Pydantic v2, SQLAlchemy 2 |
| **Database** | SQLite by default; PostgreSQL + pgvector supported |
| **AI / RAG** | Google Gemini (Claude and OpenAI also supported via config) |
| **Auth** | JWT + bcrypt |

---

## 🚀 Getting Started

The FastAPI backend serves both the API and the web UI, so you only need to start one server.

### Requirements

- Python 3.10, 3.11 or 3.12
- A free [Gemini API key](https://aistudio.google.com/app/apikey) for the AI tutor and quizzes
- Node.js 18/20 — only if you want to edit the React frontend

### 1. Clone the repository

```bash
git clone https://github.com/MuhammadAbdullahTariq01363/smart-study-planner.git
cd smart-study-planner/backend
```

### 2. Set up the backend

```bash
# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate          # Windows: .\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Add your API key
cp .env.example .env              # Windows: copy .env.example .env
# then open .env and set GEMINI_API_KEY=your_key_here
```

### 3. Run the app

```bash
uvicorn app.main:app --reload --port 8000
```

- App: **http://localhost:8000**
- Interactive API docs (Swagger): **http://localhost:8000/docs**

> 💡 On Windows you can also double-click **`START_APP.bat`** from the project root.

### Developing the frontend (optional)

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs at **http://localhost:5173** and talks to the API on port 8000.

---

## 🔑 Environment Variables

Set these in `backend/.env` (never commit this file — it is git-ignored).

| Variable | Required | Description |
| :--- | :-: | :--- |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (powers the tutor and quizzes) |
| `LLM_PROVIDER` | | `gemini`, `claude`, `openai` or `mock` (no key needed, demo answers only) |
| `SECRET_KEY` | | Secret used to sign JWTs — set your own for any shared setup |
| `DATABASE_URL` | | Defaults to `sqlite:///./smart_study.db` |

---

## 📁 Project Structure

```
smart-study-planner/
├── backend/
│   ├── app/
│   │   ├── core/        # Config, security (JWT/bcrypt), database session
│   │   ├── models/      # SQLAlchemy models & Pydantic schemas
│   │   ├── routers/     # Auth, Subjects, Topics, Notes, Planner, Tutor, Quizzes, Progress
│   │   ├── services/    # Scheduler, RAG notes pipeline, quiz engine, LLM client
│   │   ├── static/      # Web UI served by the backend
│   │   └── main.py      # FastAPI entry point
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/            # React + Vite source
├── render.yaml          # Render deployment config (for future hosting)
└── README.md
```

---

## 🩺 Health Check

`GET /api/health` returns the service status and whether the AI is running in live or mock mode.

---

## 📌 Notes

- The project page above is GitHub Pages showing this README only — the app itself (login, planner, AI tutor) needs the Python backend, so run it locally as described.
- Cloud hosting is not set up yet; `render.yaml` is included so the app can be deployed later.
