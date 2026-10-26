import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models.db_models # ensures all models are imported

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="Backend API for Smart Study Planner + AI Tutor (F1-F6 MVP)"
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api/v1
from app.routers import auth, subjects, topics, notes, planner, tutor, quizzes, progress

app.include_router(auth.router, prefix="/api/v1")
app.include_router(subjects.router, prefix="/api/v1")
app.include_router(topics.router, prefix="/api/v1")
app.include_router(notes.router, prefix="/api/v1")
app.include_router(planner.router, prefix="/api/v1")
app.include_router(tutor.router, prefix="/api/v1")
app.include_router(quizzes.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")

# Static files & unified frontend serving
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/")
def serve_home():
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(
            index_path,
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
            }
        )
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/health")
def health():
    from app.services.llm_service import llm_service
    return {"status": "healthy", "service": settings.PROJECT_NAME, "ai_mode": llm_service.mode_label()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
