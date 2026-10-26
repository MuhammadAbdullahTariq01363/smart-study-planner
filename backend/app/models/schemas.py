from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# --- Auth ---
class UserRegister(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Subjects ---
class SubjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    exam_date: str # YYYY-MM-DD
    daily_hours: float = 2.0

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    exam_date: Optional[str] = None
    daily_hours: Optional[float] = None

class SubjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    exam_date: str
    daily_hours: float

    class Config:
        from_attributes = True

# --- Topics ---
class TopicCreate(BaseModel):
    title: str
    difficulty: int = Field(default=3, ge=1, le=5)
    est_hours: float = 2.0
    weightage: float = 1.0

class TopicUpdate(BaseModel):
    title: Optional[str] = None
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)
    est_hours: Optional[float] = None
    weightage: Optional[float] = None
    status: Optional[str] = None
    mastery: Optional[float] = None

class TopicOut(BaseModel):
    id: int
    subject_id: int
    title: str
    difficulty: int
    est_hours: float
    weightage: float
    priority: float
    status: str
    mastery: float

    class Config:
        from_attributes = True

# --- Planner ---
class SessionOut(BaseModel):
    id: int
    plan_id: int
    topic_id: Optional[int]
    topic_title: Optional[str] = None
    date: str
    minutes: int
    status: str

    class Config:
        from_attributes = True

class SessionUpdate(BaseModel):
    status: str # done, skipped, rescheduled
    minutes: Optional[int] = None
    date: Optional[str] = None

class PlanGenerateRequest(BaseModel):
    session_length_minutes: int = 60
    start_date: Optional[str] = None

class StudyPlanOut(BaseModel):
    id: int
    subject_id: int
    week_start: str
    rationale: Optional[str]
    status: str
    sessions: List[SessionOut] = []

    class Config:
        from_attributes = True

# --- Notes & RAG ---
class NoteOut(BaseModel):
    id: int
    subject_id: int
    filename: str
    file_type: str
    status: str
    chunks: int = 0

    class Config:
        from_attributes = True

class ChunkOut(BaseModel):
    id: int
    content: str
    page_number: Optional[int]
    topic_id: Optional[int]

class TutorAskRequest(BaseModel):
    subject_id: int
    question: str
    topic_id: Optional[int] = None

class TutorSourceReference(BaseModel):
    chunk_id: int
    filename: str
    page_number: Optional[int]
    snippet: str

class TutorAnswerResponse(BaseModel):
    answer: str
    sources: List[TutorSourceReference] = []
    found_in_notes: bool

# --- Quizzes ---
class QuizQuestionOut(BaseModel):
    id: int
    type: str
    question: str
    options: Optional[List[str]] = None
    explanation: Optional[str] = None

class QuizOut(BaseModel):
    id: int
    topic_id: int
    topic_title: Optional[str] = None
    difficulty: int
    questions: List[QuizQuestionOut] = []

class QuizSubmitAnswer(BaseModel):
    question_id: int
    answer: str

class QuizSubmitRequest(BaseModel):
    answers: List[QuizSubmitAnswer]

class QuizSubmitResult(BaseModel):
    score: float # percentage 0-100
    accuracy: float # 0.0 to 1.0
    total_questions: int
    correct_count: int
    new_mastery: float
    is_weak: bool
    breakdown: List[Dict[str, Any]]

# --- Dashboard & Progress ---
class DashboardStats(BaseModel):
    subject_name: str
    exam_date: str
    days_left: int
    coverage_percentage: float
    avg_mastery: float
    study_streak_days: int
    total_topics: int
    completed_topics: int
    weak_topics: List[TopicOut]
    today_sessions: List[SessionOut]
