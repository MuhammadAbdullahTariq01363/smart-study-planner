import os
import re
import shutil
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.models.db_models import Note, NoteChunk, User, Subject
from app.models.schemas import NoteOut
from app.routers.auth import get_current_user
from app.services.notes_service import process_and_index_note

router = APIRouter(prefix="/subjects/{subject_id}/notes", tags=["Notes"])

ALLOWED_TYPES = {"pdf", "docx", "txt"}
MAX_BYTES = 15 * 1024 * 1024  # 15 MB


def _note_out(db: Session, note: Note) -> NoteOut:
    count = db.query(func.count(NoteChunk.id)).filter(NoteChunk.note_id == note.id).scalar() or 0
    return NoteOut(id=note.id, subject_id=note.subject_id, filename=note.filename,
                   file_type=note.file_type, status=note.status, chunks=count)


def _own_subject(db: Session, subject_id: int, user_id: int) -> Subject:
    subject = db.query(Subject).filter(Subject.id == subject_id, Subject.user_id == user_id).first()
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject


@router.get("", response_model=List[NoteOut])
def get_notes(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _own_subject(db, subject_id, current_user.id)
    notes = db.query(Note).filter(Note.subject_id == subject_id, Note.user_id == current_user.id).all()
    return [_note_out(db, n) for n in notes]


@router.post("", response_model=NoteOut)
async def upload_note(
    subject_id: int,
    file: UploadFile = File(...),
    topic_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    _own_subject(db, subject_id, current_user.id)

    original = os.path.basename(file.filename or "notes.txt")
    file_type = original.rsplit(".", 1)[-1].lower() if "." in original else ""
    if file_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX or TXT files are supported.")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", original)
    save_path = os.path.join(settings.UPLOAD_DIR, f"{current_user.id}_{subject_id}_{safe_name}")

    size = 0
    with open(save_path, "wb") as buffer:
        while True:
            block = file.file.read(1024 * 1024)
            if not block:
                break
            size += len(block)
            if size > MAX_BYTES:
                buffer.close()
                os.remove(save_path)
                raise HTTPException(status_code=400, detail="File is too large (max 15 MB).")
            buffer.write(block)

    note = Note(
        user_id=current_user.id,
        subject_id=subject_id,
        filename=original,
        file_type=file_type,
        storage_url=save_path,
        status="processing"
    )
    db.add(note)
    db.commit()
    db.refresh(note)

    await process_and_index_note(db, note, save_path, topic_id)
    db.refresh(note)
    return _note_out(db, note)


@router.delete("/{note_id}")
def delete_note(
    subject_id: int,
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    note = db.query(Note).filter(Note.id == note_id, Note.subject_id == subject_id, Note.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    path = note.storage_url
    db.delete(note)
    db.commit()
    try:
        if path and os.path.exists(path):
            os.remove(path)
    except OSError:
        pass
    return {"ok": True}
