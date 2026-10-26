import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Smart Study Planner + AI Tutor"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "smart_study_planner_super_secret_jwt_key_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smart_study.db")
    
    # LLM Settings
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock") # "claude", "gemini", "openai", "mock"
    ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    EMBEDDING_DIM: int = int(os.getenv("EMBEDDING_DIM", "768"))
    
    # Upload Storage
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./uploads")

    class Config:
        # .env lives in the backend folder, no matter which folder the server is started from
        env_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
