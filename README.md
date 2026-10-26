# Smart Study Planner + AI Tutor 🎓🤖

An intelligent web application that turns a student's syllabus and exam date into an adaptive weekly study plan, answers questions from uploaded notes using **Retrieval-Augmented Generation (RAG)**, quizzes weak concepts, and visualizes exam readiness on an interactive progress dashboard.

---

## 🏗️ Project Architecture & Tech Stack

| Layer | Technology | Role |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, Lucide Icons | Responsive student interface & dashboard |
| **Backend API** | Python FastAPI, Uvicorn, Pydantic V2 | REST API, scheduler, quiz engine, RAG pipeline |
| **Database** | PostgreSQL 16 + pgvector (or SQLite fallback) | Relational student data + vector embeddings |
| **AI / RAG** | Gemini / Claude / OpenAI API | Grounded notes retrieval, quiz generation & grading |
| **Auth** | JWT + bcrypt password hashing | User security and data isolation |

---

## 📁 Project Directory Structure

```
smart-study-planner/
├── backend/
│   ├── app/
│   │   ├── core/           # Config, Security (JWT/bcrypt), Database session
│   │   ├── models/         # SQLAlchemy DB models (10 tables) & Pydantic schemas
│   │   ├── routers/        # Auth, Subjects, Topics, Notes, Planner, Tutor, Quizzes, Progress
│   │   ├── services/       # Rule-based Scheduler, RAG notes pipeline, Quiz engine
│   │   └── main.py         # FastAPI application entry point
│   ├── requirements.txt    # Python backend dependencies
│   └── .env.example        # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, Sidebar, modals
│   │   ├── pages/          # Dashboard, Syllabus, Planner, Notes, Tutor, Quiz, Auth
│   │   ├── services/       # Axios API client
│   │   ├── App.jsx         # Root component & state management
│   │   └── main.jsx        # React entry point
│   ├── package.json        # NPM dependencies
│   ├── tailwind.config.js  # Styling configuration
│   └── vite.config.js      # Vite build setup
└── README.md
```

---

## 🚀 How to Run the Project

### Prerequisites to Install on Your Computer:
1. **Python** (version 3.10, 3.11, or 3.12)
2. **Node.js** (v18 or v20 LTS) with npm

---

### Step 1: Run the Backend (FastAPI)

Open PowerShell / Terminal in `smart-study-planner/backend`:
```powershell
cd "C:\Users\Chaudhary Computers\.gemini\antigravity\scratch\smart-study-planner\backend"

# Create and activate Python virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run backend server
uvicorn app.main:app --reload --port 8000
```
Backend API interactive Swagger documentation will be available at:
👉 **`http://localhost:8000/docs`**

---

### Step 2: Run the Frontend (React + Vite)

Open a second PowerShell / Terminal in `smart-study-planner/frontend`:
```powershell
cd "C:\Users\Chaudhary Computers\.gemini\antigravity\scratch\smart-study-planner\frontend"

# Install frontend packages
npm install

# Start Vite dev server
npm run dev
```
Frontend Web UI will be available at:
👉 **`http://localhost:5173`**
