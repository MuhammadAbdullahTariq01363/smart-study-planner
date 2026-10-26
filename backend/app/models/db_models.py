import datetime
from sqlalchemy import Column, Integer, String, Text, Float, SmallInteger, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.core.database import Base, DATABASE_URL

# Check if pgvector should be used
is_postgres = DATABASE_URL.startswith("postgresql")
if is_postgres:
    from pgvector.sqlalchemy import Vector
    VectorType = Vector(1024) # or configurable dimension
else:
    VectorType = JSON

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    subjects = relationship("Subject", back_populates="user", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="user", cascade="all, delete-orphan")

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    exam_date = Column(String(50), nullable=False) # ISO date string YYYY-MM-DD
    daily_hours = Column(Float, default=2.0)

    user = relationship("User", back_populates="subjects")
    topics = relationship("Topic", back_populates="subject", cascade="all, delete-orphan")
    notes = relationship("Note", back_populates="subject", cascade="all, delete-orphan")
    study_plans = relationship("StudyPlan", back_populates="subject", cascade="all, delete-orphan")

class Topic(Base):
    __tablename__ = "topics"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    difficulty = Column(SmallInteger, default=3) # 1 to 5
    est_hours = Column(Float, default=2.0)
    weightage = Column(Float, default=1.0)
    priority = Column(Float, default=1.0)
    status = Column(String(50), default="pending") # pending, in_progress, completed
    mastery = Column(Float, default=0.0) # 0.0 to 1.0

    subject = relationship("Subject", back_populates="topics")
    chunks = relationship("NoteChunk", back_populates="topic")
    sessions = relationship("StudySession", back_populates="topic")
    quizzes = relationship("Quiz", back_populates="topic", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)
    storage_url = Column(String(500), nullable=False)
    status = Column(String(50), default="processed") # processing, processed, error

    user = relationship("User", back_populates="notes")
    subject = relationship("Subject", back_populates="notes")
    chunks = relationship("NoteChunk", back_populates="note", cascade="all, delete-orphan")

class NoteChunk(Base):
    __tablename__ = "note_chunks"

    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    embedding = Column(VectorType, nullable=True)

    note = relationship("Note", back_populates="chunks")
    topic = relationship("Topic", back_populates="chunks")

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    week_start = Column(String(50), nullable=False) # YYYY-MM-DD
    rationale = Column(Text, nullable=True)
    status = Column(String(50), default="active") # active, completed, archived

    subject = relationship("Subject", back_populates="study_plans")
    sessions = relationship("StudySession", back_populates="plan", cascade="all, delete-orphan")

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(Integer, primary_key=True, index=True)
    plan_id = Column(Integer, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=True)
    date = Column(String(50), nullable=False) # YYYY-MM-DD
    minutes = Column(Integer, default=60)
    status = Column(String(50), default="pending") # pending, done, skipped, rescheduled

    plan = relationship("StudyPlan", back_populates="sessions")
    topic = relationship("Topic", back_populates="sessions")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    topic_id = Column(Integer, ForeignKey("topics.id", ondelete="CASCADE"), nullable=False)
    difficulty = Column(SmallInteger, default=3)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    topic = relationship("Topic", back_populates="quizzes")
    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    type = Column(String(50), default="mcq") # mcq, short_answer
    question = Column(Text, nullable=False)
    options = Column(JSON, nullable=True) # list of choices for MCQ
    answer = Column(Text, nullable=False) # correct answer string
    explanation = Column(Text, nullable=True)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    score = Column(Float, default=0.0) # 0.0 to 100.0 or 0 to 1
    taken_at = Column(DateTime, default=datetime.datetime.utcnow)
    answers = Column(JSON, nullable=True) # user submitted answers

    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User", back_populates="quiz_attempts")
