from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.db_models import Topic, Quiz, QuizQuestion, User, Subject
from app.models.schemas import QuizOut, QuizQuestionOut, QuizSubmitRequest, QuizSubmitResult
from app.routers.auth import get_current_user
from app.services.notes_service import retrieve_top_chunks
from app.services.llm_service import llm_service, LLMError
from app.services.quiz_service import evaluate_quiz_submission

router = APIRouter(tags=["Quizzes"])

@router.post("/topics/{topic_id}/quiz", response_model=QuizOut)
async def generate_quiz(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    topic = db.query(Topic).join(Subject, Topic.subject_id == Subject.id).filter(
        Topic.id == topic_id,
        Subject.user_id == current_user.id
    ).first()
    if not topic:
        raise HTTPException(status_code=404, detail="Topic not found")

    # Fetch context from notes for this topic
    chunks = await retrieve_top_chunks(
        db=db,
        user_id=current_user.id,
        subject_id=topic.subject_id,
        query=f"{topic.title} {topic.subject.name}",
        topic_id=None,   # notes are searched across the whole subject, not only chunks tagged with this topic
        top_k=6
    )

    try:
        questions_data = await llm_service.generate_quiz_questions(
            topic_title=topic.title,
            difficulty=topic.difficulty,
            context_chunks=chunks,
            subject_name=topic.subject.name
        )
    except LLMError as e:
        raise HTTPException(status_code=502, detail=str(e))

    quiz = Quiz(
        topic_id=topic.id,
        difficulty=topic.difficulty
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)

    question_models = []
    for q in questions_data:
        q_obj = QuizQuestion(
            quiz_id=quiz.id,
            type=q["type"],
            question=q["question"],
            options=q.get("options"),
            answer=q["answer"],
            explanation=q.get("explanation")
        )
        question_models.append(q_obj)
    db.add_all(question_models)
    db.commit()

    # Format output (without exposing answer in QuizQuestionOut)
    out_questions = [
        QuizQuestionOut(
            id=q.id,
            type=q.type,
            question=q.question,
            options=q.options,
            explanation=q.explanation
        )
        for q in question_models
    ]

    return QuizOut(
        id=quiz.id,
        topic_id=topic.id,
        topic_title=topic.title,
        difficulty=quiz.difficulty,
        questions=out_questions
    )

@router.post("/quizzes/{quiz_id}/submit", response_model=QuizSubmitResult)
def submit_quiz(
    quiz_id: int,
    payload: QuizSubmitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        result = evaluate_quiz_submission(
            db=db,
            user_id=current_user.id,
            quiz_id=quiz_id,
            user_answers=payload.answers
        )
        return QuizSubmitResult(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
