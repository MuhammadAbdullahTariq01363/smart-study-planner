from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import User
from app.models.schemas import DashboardStats
from app.routers.auth import get_current_user
from app.services.progress_service import get_subject_dashboard_stats

router = APIRouter(prefix="/subjects/{subject_id}/progress", tags=["Progress Dashboard"])

@router.get("", response_model=DashboardStats)
def get_progress(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return get_subject_dashboard_stats(db, current_user.id, subject_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
