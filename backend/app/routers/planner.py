from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Subject, Topic, StudyPlan, StudySession, User
from app.models.schemas import StudyPlanOut, SessionOut, SessionUpdate, PlanGenerateRequest
from app.routers.auth import get_current_user
from app.services.scheduler import generate_study_schedule

router = APIRouter(tags=["Study Planner"])

@router.post("/subjects/{subject_id}/plan/generate", response_model=StudyPlanOut)
def create_plan(
    subject_id: int,
    payload: PlanGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    topics = db.query(Topic).filter(Topic.subject_id == subject.id).all()
    if not topics:
        raise HTTPException(status_code=400, detail="Cannot generate plan without any syllabus topics.")

    # Archive previous active plans
    db.query(StudyPlan).filter(StudyPlan.subject_id == subject.id).update({"status": "archived"})

    schedule_data = generate_study_schedule(
        subject=subject,
        topics=topics,
        start_date_str=payload.start_date,
        session_minutes=payload.session_length_minutes
    )

    new_plan = StudyPlan(
        subject_id=subject.id,
        week_start=schedule_data["week_start"],
        rationale=schedule_data["rationale"],
        status="active"
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)

    sessions_to_add = []
    for s in schedule_data["sessions"]:
        sessions_to_add.append(StudySession(
            plan_id=new_plan.id,
            topic_id=s["topic_id"],
            date=s["date"],
            minutes=s["minutes"],
            status=s["status"]
        ))
    db.add_all(sessions_to_add)
    db.commit()

    # Re-fetch sessions with topic names
    sessions = db.query(StudySession).filter(StudySession.plan_id == new_plan.id).all()
    session_outs = []
    for s in sessions:
        session_outs.append(SessionOut(
            id=s.id,
            plan_id=s.plan_id,
            topic_id=s.topic_id,
            topic_title=s.topic.title if s.topic else "Revision & Mock Quiz",
            date=s.date,
            minutes=s.minutes,
            status=s.status
        ))

    return StudyPlanOut(
        id=new_plan.id,
        subject_id=new_plan.subject_id,
        week_start=new_plan.week_start,
        rationale=new_plan.rationale,
        status=new_plan.status,
        sessions=session_outs
    )

@router.get("/subjects/{subject_id}/plan", response_model=StudyPlanOut)
def get_current_plan(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    plan = db.query(StudyPlan).filter(StudyPlan.subject_id == subject_id, StudyPlan.status == "active").first()
    if not plan:
        raise HTTPException(status_code=404, detail="No active study plan found. Please generate one.")

    sessions = db.query(StudySession).filter(StudySession.plan_id == plan.id).order_by(StudySession.date).all()
    session_outs = [
        SessionOut(
            id=s.id,
            plan_id=s.plan_id,
            topic_id=s.topic_id,
            topic_title=s.topic.title if s.topic else "Active Revision",
            date=s.date,
            minutes=s.minutes,
            status=s.status
        )
        for s in sessions
    ]

    return StudyPlanOut(
        id=plan.id,
        subject_id=plan.subject_id,
        week_start=plan.week_start,
        rationale=plan.rationale,
        status=plan.status,
        sessions=session_outs
    )

@router.patch("/sessions/{session_id}", response_model=SessionOut)
def update_session_status(
    session_id: int,
    payload: SessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = (
        db.query(StudySession)
        .join(StudyPlan, StudySession.plan_id == StudyPlan.id)
        .join(Subject, StudyPlan.subject_id == Subject.id)
        .filter(StudySession.id == session_id, Subject.user_id == current_user.id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = payload.status
    if payload.minutes is not None:
        session.minutes = payload.minutes
    if payload.date is not None:
        session.date = payload.date

    # If completed, check topic completion
    if payload.status == "done" and session.topic_id:
        topic = db.query(Topic).filter(Topic.id == session.topic_id).first()
        if topic and topic.status != "completed":
            topic.status = "in_progress"

    db.commit()
    db.refresh(session)

    return SessionOut(
        id=session.id,
        plan_id=session.plan_id,
        topic_id=session.topic_id,
        topic_title=session.topic.title if session.topic else "Active Revision",
        date=session.date,
        minutes=session.minutes,
        status=session.status
    )
