from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import User, Subject
from app.models.schemas import TutorAskRequest, TutorAnswerResponse, TutorSourceReference
from app.routers.auth import get_current_user
from app.services.notes_service import retrieve_top_chunks
from app.services.llm_service import llm_service, LLMError

router = APIRouter(prefix="/tutor", tags=["AI Tutor"])

@router.post("/ask", response_model=TutorAnswerResponse)
async def ask_tutor(
    payload: TutorAskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(
        Subject.id == payload.subject_id,
        Subject.user_id == current_user.id
    ).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")

    # Step 1: Retrieve top matching chunks from user's notes
    top_chunks = await retrieve_top_chunks(
        db=db,
        user_id=current_user.id,
        subject_id=payload.subject_id,
        query=payload.question,
        topic_id=payload.topic_id,
        top_k=5
    )

    # Step 2: Ask LLM with strict grounding
    try:
        llm_result = await llm_service.answer_tutor_question(
            question=payload.question,
            context_chunks=top_chunks
        )
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))

    sources = [
        TutorSourceReference(
            chunk_id=c["id"],
            filename=c["filename"],
            page_number=c.get("page_number"),
            snippet=c["content"][:200] + "..." if len(c["content"]) > 200 else c["content"]
        )
        for c in top_chunks
    ]

    return TutorAnswerResponse(
        answer=llm_result["answer"],
        sources=sources,
        found_in_notes=llm_result["found_in_notes"]
    )


@router.get("/status")
async def tutor_status(current_user: User = Depends(get_current_user)):
    """Tells the UI whether the AI key works (used for the status badge)."""
    return await llm_service.check_status()
