from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Subject, User
from app.models.schemas import SubjectCreate, SubjectUpdate, SubjectOut
from app.routers.auth import get_current_user

router = APIRouter(prefix="/subjects", tags=["Subjects"])

@router.get("", response_model=List[SubjectOut])
def get_subjects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Subject).filter(Subject.user_id == current_user.id).all()

@router.post("", response_model=SubjectOut)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = Subject(
        user_id=current_user.id,
        name=payload.name,
        description=payload.description,
        exam_date=payload.exam_date,
        daily_hours=payload.daily_hours
    )
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject

@router.patch("/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    payload: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")

    if payload.name is not None:
        subject.name = payload.name
    if payload.description is not None:
        subject.description = payload.description
    if payload.exam_date is not None:
        subject.exam_date = payload.exam_date
    if payload.daily_hours is not None:
        subject.daily_hours = payload.daily_hours

    db.commit()
    db.refresh(subject)
    return subject


@router.delete("/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == current_user.id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    db.delete(subject)
    db.commit()
    return {"ok": True}
