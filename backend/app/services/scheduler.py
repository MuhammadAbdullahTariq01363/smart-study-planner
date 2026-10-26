import math
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.models.db_models import Topic, Subject, StudyPlan, StudySession

def calculate_topic_priority(difficulty: int, mastery: float, weightage: float) -> float:
    """
    Priority formula from documentation Section 8.1:
    priority = difficulty * (1 - mastery) * weightage
    """
    m = max(0.0, min(1.0, mastery))
    d = max(1, min(5, difficulty))
    w = max(0.1, weightage)
    return round(d * (1.0 - m) * w, 3)

def generate_study_schedule(
    subject: Subject,
    topics: List[Topic],
    start_date_str: str = None,
    session_minutes: int = 60
) -> Dict[str, Any]:
    """
    Generates a day-wise schedule until the exam date.
    - Code calculates slots and schedules topics based on priority.
    - Last 20% of time reserved for revision and mock quizzes.
    """
    if not start_date_str:
        start_date = datetime.utcnow().date()
    else:
        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()

    exam_date = datetime.strptime(subject.exam_date, "%Y-%m-%d").date()
    total_days = (exam_date - start_date).days

    if total_days <= 0:
        total_days = 7 # default fallback to 1 week if exam date has passed or is today

    # Daily sessions calculation
    hours_per_day = max(0.5, subject.daily_hours)
    session_hours = session_minutes / 60.0
    sessions_per_day = max(1, int(hours_per_day / session_hours))

    # Calculate priorities and sort topics (highest priority first)
    topic_items = []
    for t in topics:
        p = calculate_topic_priority(t.difficulty, t.mastery, t.weightage)
        t.priority = p
        # estimated number of sessions required for this topic
        est_sessions = max(1, math.ceil((t.est_hours or 2.0) / session_hours))
        topic_items.append({
            "topic": t,
            "priority": p,
            "remaining_sessions": est_sessions
        })

    # Sort topics descending by priority
    topic_items.sort(key=lambda x: x["priority"], reverse=True)

    # Reserve last 20% of total days for revision & mock quizzes
    revision_days_count = max(1, int(total_days * 0.20))
    learning_days_count = max(1, total_days - revision_days_count)

    scheduled_sessions = []
    current_topic_idx = 0

    # Phase 1: Schedule learning sessions
    for day_offset in range(learning_days_count):
        day_date = start_date + timedelta(days=day_offset)
        day_str = day_date.strftime("%Y-%m-%d")

        for _ in range(sessions_per_day):
            if current_topic_idx < len(topic_items):
                item = topic_items[current_topic_idx]
                scheduled_sessions.append({
                    "topic_id": item["topic"].id,
                    "date": day_str,
                    "minutes": session_minutes,
                    "status": "pending"
                })
                item["remaining_sessions"] -= 1
                if item["remaining_sessions"] <= 0:
                    current_topic_idx += 1
            else:
                # If all topics covered, schedule practice/review for lowest mastery topics
                if topic_items:
                    weakest = min(topic_items, key=lambda x: x["topic"].mastery)
                    scheduled_sessions.append({
                        "topic_id": weakest["topic"].id,
                        "date": day_str,
                        "minutes": session_minutes,
                        "status": "pending"
                    })

    # Phase 2: Schedule revision and mock quiz days (last 20%)
    for day_offset in range(learning_days_count, total_days):
        day_date = start_date + timedelta(days=day_offset)
        day_str = day_date.strftime("%Y-%m-%d")

        for s_idx in range(sessions_per_day):
            # Rotate revision across topics
            rev_topic = topic_items[s_idx % len(topic_items)]["topic"] if topic_items else None
            scheduled_sessions.append({
                "topic_id": rev_topic.id if rev_topic else None,
                "date": day_str,
                "minutes": session_minutes,
                "status": "pending"
            })

    rationale = (
        f"Study plan generated for {len(topics)} topics across {total_days} days until exam on {subject.exam_date}. "
        f"Allocated {learning_days_count} days for primary concept mastery (prioritizing high-weightage and weak topics) "
        f"and reserved the final {revision_days_count} days (20%) strictly for active recall revision and mock quizzes."
    )

    return {
        "week_start": start_date.strftime("%Y-%m-%d"),
        "rationale": rationale,
        "sessions": scheduled_sessions
    }
