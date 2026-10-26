from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Subject, Topic, User
from app.models.schemas import TopicCreate, TopicUpdate, TopicOut
from app.routers.auth import get_current_user
from app.services.scheduler import calculate_topic_priority

router = APIRouter(prefix="/subjects/{subject_id}/topics", tags=["Topics"])

def verify_subject_ownership(subject_id: int, user_id: int, db: Session) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")
    return subject

@router.get("", response_model=List[TopicOut])
def get_topics(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_subject_ownership(subject_id, current_user.id, db)
    return db.query(Topic).filter(Topic.subject_id == subject_id).all()

@router.post("", response_model=TopicOut)
def create_topic(
    subject_id: int,
    payload: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_subject_ownership(subject_id, current_user.id, db)
    priority = calculate_topic_priority(payload.difficulty, 0.0, payload.weightage)
    topic = Topic(
        subject_id=subject_id,
        title=payload.title,
        difficulty=payload.difficulty,
        est_hours=payload.est_hours,
        weightage=payload.weightage,
        priority=priority,
        status="pending",
        mastery=0.0
    )
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic

@router.patch("/{topic_id}", response_model=TopicOut)
def update_topic(
    subject_id: int,
    topic_id: int,
    payload: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_subject_ownership(subject_id, current_user.id, db)
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.subject_id == subject_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    if payload.title is not None:
        topic.title = payload.title
    if payload.difficulty is not None:
        topic.difficulty = payload.difficulty
    if payload.est_hours is not None:
        topic.est_hours = payload.est_hours
    if payload.weightage is not None:
        topic.weightage = payload.weightage
    if payload.status is not None:
        topic.status = payload.status
    if payload.mastery is not None:
        topic.mastery = payload.mastery

    topic.priority = calculate_topic_priority(topic.difficulty, topic.mastery, topic.weightage)
    db.commit()
    db.refresh(topic)
    return topic


@router.delete("/{topic_id}")
def delete_topic(
    subject_id: int,
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    verify_subject_ownership(subject_id, current_user.id, db)
    topic = db.query(Topic).filter(Topic.id == topic_id, Topic.subject_id == subject_id).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")
    db.delete(topic)
    db.commit()
    return {"ok": True}
