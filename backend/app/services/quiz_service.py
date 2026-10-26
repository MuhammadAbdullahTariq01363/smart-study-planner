from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models.db_models import Quiz, QuizQuestion, QuizAttempt, Topic, Subject
from app.services.scheduler import calculate_topic_priority
from app.models.schemas import QuizSubmitAnswer

def update_mastery_score(current_mastery: float, quiz_accuracy: float) -> float:
    """
    Mastery EMA formula from doc Section 8.3:
    mastery_new = 0.7 * mastery_old + 0.3 * quiz_accuracy
    """
    cur = current_mastery if current_mastery is not None else 0.0
    new_mastery = (0.7 * cur) + (0.3 * quiz_accuracy)
    return round(max(0.0, min(1.0, new_mastery)), 2)

def evaluate_quiz_submission(
    db: Session,
    user_id: int,
    quiz_id: int,
    user_answers: List[QuizSubmitAnswer]
) -> Dict[str, Any]:
    """
    Scores MCQ against answer key and short answers.
    Updates topic mastery and checks if topic is flagged weak (< 0.6).
    """
    quiz = (
        db.query(Quiz)
        .join(Topic, Quiz.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .filter(Quiz.id == quiz_id, Subject.user_id == user_id)
        .first()
    )
    if not quiz:
        raise ValueError("Quiz not found")

    questions = db.query(QuizQuestion).filter(QuizQuestion.quiz_id == quiz_id).all()
    q_map = {q.id: q for q in questions}

    correct_count = 0
    breakdown = []

    for item in user_answers:
        q = q_map.get(item.question_id)
        if not q:
            continue

        user_ans = item.answer.strip().lower()
        actual_ans = q.answer.strip().lower()

        # Check accuracy
        if q.type == "mcq":
            is_correct = (user_ans == actual_ans)
        else:
            # Simple keyword matching or partial match for short answers
            keywords = [w for w in actual_ans.split() if len(w) > 3]
            match_count = sum(1 for w in keywords if w in user_ans)
            is_correct = (match_count >= max(1, len(keywords) // 2))

        if is_correct:
            correct_count += 1

        breakdown.append({
            "question_id": q.id,
            "question": q.question,
            "your_answer": item.answer,
            "correct_answer": q.answer,
            "is_correct": is_correct,
            "explanation": q.explanation
        })

    total_q = max(1, len(questions))
    accuracy = correct_count / total_q
    percentage_score = round(accuracy * 100.0, 1)

    # Update Topic Mastery
    topic = db.query(Topic).filter(Topic.id == quiz.topic_id).first()
    new_mastery = 0.0
    is_weak = True

    if topic:
        new_mastery = update_mastery_score(topic.mastery, accuracy)
        topic.mastery = new_mastery
        topic.priority = calculate_topic_priority(topic.difficulty, new_mastery, topic.weightage)
        is_weak = (new_mastery < 0.6)
        if is_weak and topic.status != "completed":
            topic.status = "weak"
        db.commit()

    # Record Attempt
    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user_id,
        score=percentage_score,
        answers=[{"q_id": a.question_id, "ans": a.answer} for a in user_answers]
    )
    db.add(attempt)
    db.commit()

    return {
        "score": percentage_score,
        "accuracy": accuracy,
        "total_questions": total_q,
        "correct_count": correct_count,
        "new_mastery": new_mastery,
        "is_weak": is_weak,
        "breakdown": breakdown
    }
