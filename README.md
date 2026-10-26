<div align="center">

# 🎓 Smart Study Planner + AI Tutor

**Turn your syllabus and exam date into an adaptive study plan, ask questions from your own notes, and track exam readiness — all in one place.**

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/MuhammadAbdullahTariq01363/smart-study-planner)

![FastAPI](https://img.shields.io/badge/FastAPI-009688?logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwind-css&logoColor=white)
![Gemini](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)

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

## ☁️ Deploy (Render)

The FastAPI backend serves both the API and the web UI, so a **single Render service** runs the whole app.

1. Click the **Deploy to Render** button above (or in Render: **New → Blueprint** and select this repo).
2. When asked, paste your **`GEMINI_API_KEY`** ([get one free from Google AI Studio](https://aistudio.google.com/app/apikey)).
3. Click **Apply**. After the build finishes, your app is live at the `onrender.com` URL shown on the dashboard.

`render.yaml` already configures the build, start command, health check and a generated `SECRET_KEY`.

> **Free-tier notes**
> - The service sleeps after ~15 min of inactivity, so the first request can take 30–60 s to wake up.
> - SQLite on the free plan lives on temporary disk and **resets on every redeploy/restart**. For permanent data, create a free Render PostgreSQL database and set its connection string as `DATABASE_URL`.

---

## 🔑 Environment Variables

| Variable | Required | Description |
| :--- | :-: | :--- |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key (powers the tutor and quizzes) |
| `LLM_PROVIDER` | | `gemini` (default on Render), `claude`, `openai` or `mock` |
| `SECRET_KEY` | | Secret used to sign JWTs (auto-generated on Render) |
| `DATABASE_URL` | | Defaults to `sqlite:///./smart_study.db` |

Never commit your real keys — `.env` is git-ignored. Use `backend/.env.example` as a template.

---

## 💻 Run Locally (optional)

**Requirements:** Python 3.10–3.12 and Node.js 18/20 (Node is only needed if you want to edit the frontend).

```bash
# 1) Backend
cd backend
python -m venv venv
source venv/bin/activate        # Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
cp .env.example .env            # then add your GEMINI_API_KEY
uvicorn app.main:app --reload --port 8000
```

Open **http://localhost:8000** for the app and **http://localhost:8000/docs** for the interactive API docs.

On Windows you can also just double-click `START_APP.bat`.

<details>
<summary>Developing the React frontend (hot reload)</summary>

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173 (talks to the API on :8000)
```

</details>

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
├── render.yaml          # One-click Render deployment
└── README.md
```

---

## 🩺 Health Check

`GET /api/health` returns the service status and whether the AI is running in live or mock mode.
