from datetime import datetime
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app.models.db_models import Subject, Topic, StudySession, StudyPlan, QuizAttempt
from app.models.schemas import DashboardStats, TopicOut, SessionOut

def get_subject_dashboard_stats(db: Session, user_id: int, subject_id: int) -> Dict[str, Any]:
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not subject:
        raise ValueError("Subject not found or access denied")

    # Exam countdown
    try:
        exam_date = datetime.strptime(subject.exam_date, "%Y-%m-%d").date()
        today = datetime.utcnow().date()
        days_left = max(0, (exam_date - today).days)
    except Exception:
        days_left = 0

    topics = db.query(Topic).filter(Topic.subject_id == subject.id).all()
    total_topics = len(topics)
    completed_topics = sum(1 for t in topics if t.status == "completed" or (t.mastery and t.mastery >= 0.8))

    coverage_percentage = round((completed_topics / total_topics * 100), 1) if total_topics > 0 else 0.0

    # Average mastery
    avg_mastery = (
        round(sum(t.mastery or 0.0 for t in topics) / total_topics, 2)
        if total_topics > 0 else 0.0
    )

    # Weak topics (< 0.6)
    weak_topics = [t for t in topics if (t.mastery or 0.0) < 0.6]

    # Today's sessions
    today_str = datetime.utcnow().date().strftime("%Y-%m-%d")
    today_sessions = (
        db.query(StudySession)
        .join(StudyPlan, StudySession.plan_id == StudyPlan.id)
        .filter(StudyPlan.subject_id == subject.id, StudySession.date == today_str)
        .all()
    )

    # Calculate study streak (consecutive days with completed sessions)
    recent_done = (
        db.query(StudySession.date)
        .join(StudyPlan, StudySession.plan_id == StudyPlan.id)
        .filter(StudyPlan.subject_id == subject.id, StudySession.status == "done")
        .distinct()
        .all()
    )
    streak_days = len(recent_done) # simplified streak metric

    # Map topics to outputs
    weak_topics_out = [
        TopicOut(
            id=t.id,
            subject_id=t.subject_id,
            title=t.title,
            difficulty=t.difficulty,
            est_hours=t.est_hours or 2.0,
            weightage=t.weightage or 1.0,
            priority=t.priority or 1.0,
            status=t.status or "pending",
            mastery=t.mastery or 0.0
        )
        for t in weak_topics
    ]

    today_sessions_out = [
        SessionOut(
            id=s.id,
            plan_id=s.plan_id,
            topic_id=s.topic_id,
            topic_title=s.topic.title if s.topic else "Active Revision",
            date=s.date,
            minutes=s.minutes,
            status=s.status
        )
        for s in today_sessions
    ]

    return {
        "subject_name": subject.name,
        "exam_date": subject.exam_date,
        "days_left": days_left,
        "coverage_percentage": coverage_percentage,
        "avg_mastery": avg_mastery,
        "study_streak_days": streak_days,
        "total_topics": total_topics,
        "completed_topics": completed_topics,
        "weak_topics": weak_topics_out,
        "today_sessions": today_sessions_out
    }
