import os
import re
from typing import List, Dict, Any, Tuple
from pypdf import PdfReader
import docx
from sqlalchemy.orm import Session
from app.models.db_models import Note, NoteChunk
import logging
from app.services.llm_service import llm_service, LLMError, tokenize

logger = logging.getLogger(__name__)

def extract_text_from_file(file_path: str, file_type: str) -> List[Tuple[int, str]]:
    """
    Extracts text from PDF, DOCX, or TXT.
    Returns list of tuples: (page_number_or_section, text). Raises ValueError if the file cannot be read.
    """
    pages_text = []

    if file_type == "pdf":
        try:
            reader = PdfReader(file_path)
            for idx, page in enumerate(reader.pages):
                text = page.extract_text() or ""
                if text.strip():
                    pages_text.append((idx + 1, text))
        except Exception as e:
            raise ValueError(f"Could not read this PDF: {e}")
    elif file_type == "docx":
        try:
            doc = docx.Document(file_path)
            full_text = "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
            if full_text.strip():
                pages_text.append((1, full_text))
        except Exception as e:
            raise ValueError(f"Could not read this DOCX: {e}")
    else:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        if content.strip():
            pages_text.append((1, content))

    return pages_text

def chunk_text(text: str, chunk_size: int = 600, overlap: int = 100) -> List[str]:
    """
    Splits text into chunks of roughly 500-800 tokens (words approximation) with 100 overlap.
    """
    words = re.findall(r'\S+', text)
    if not words:
        return []

    chunks = []
    i = 0
    while i < len(words):
        chunk_words = words[i : i + chunk_size]
        chunks.append(" ".join(chunk_words))
        i += (chunk_size - overlap)
        if i >= len(words):
            break
    return chunks

async def process_and_index_note(
    db: Session,
    note: Note,
    file_path: str,
    topic_id: int = None
):
    """
    Extracts, chunks, embeds, and saves chunks to the database.
    Sets note.status to 'processed' or 'error' (e.g. scanned PDF with no text).
    """
    try:
        pages = extract_text_from_file(file_path, note.file_type)
    except ValueError:
        note.status = "error"
        db.commit()
        return

    pieces = []  # (page_number, chunk_text)
    for page_num, text in pages:
        for chunk_content in chunk_text(text, chunk_size=600, overlap=100):
            pieces.append((page_num, chunk_content))

    if not pieces:
        note.status = "error"   # no readable text (e.g. scanned/image-only PDF)
        db.commit()
        return

    try:
        embeddings = await llm_service.get_embeddings([c for _, c in pieces], task="RETRIEVAL_DOCUMENT")
    except LLMError as e:
        logger.warning("Embedding failed, falling back to keyword search for this note: %s", e)
        embeddings = [None] * len(pieces)

    for (page_num, content), emb in zip(pieces, embeddings):
        db.add(NoteChunk(note_id=note.id, topic_id=topic_id, content=content, page_number=page_num, embedding=emb))

    note.status = "processed"
    db.commit()

def cosine_similarity(v1: List[float], v2: List[float]) -> float:
    if not v1 or not v2 or len(v1) != len(v2):
        return 0.0
    dot = sum(a * b for a, b in zip(v1, v2))
    norm_a = sum(a * a for a in v1) ** 0.5
    norm_b = sum(b * b for b in v2) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)

async def retrieve_top_chunks(
    db: Session,
    user_id: int,
    subject_id: int,
    query: str,
    topic_id: int = None,
    top_k: int = 5
) -> List[Dict[str, Any]]:
    """
    Hybrid retrieval: embedding similarity + keyword overlap. Only this user's notes are searched.
    """
    query_builder = db.query(NoteChunk, Note).join(Note, NoteChunk.note_id == Note.id).filter(
        Note.user_id == user_id,
        Note.subject_id == subject_id
    )
    if topic_id:
        query_builder = query_builder.filter(NoteChunk.topic_id == topic_id)
    records = query_builder.all()
    if not records:
        return []

    try:
        query_vec = await llm_service.get_embedding(query, task="RETRIEVAL_QUERY")
    except LLMError as e:
        logger.warning("Query embedding failed, using keyword search only: %s", e)
        query_vec = None

    q_tokens = set(tokenize(query))
    scored = []
    for chunk, note in records:
        kw = 0.0
        if q_tokens:
            kw = len(q_tokens & set(tokenize(chunk.content))) / len(q_tokens)
        emb = chunk.embedding
        if query_vec and isinstance(emb, list) and emb:
            score = 0.7 * max(0.0, cosine_similarity(query_vec, emb)) + 0.3 * kw
        else:
            score = kw
        scored.append((score, chunk, note))

    scored.sort(key=lambda x: x[0], reverse=True)

    results = []
    for score, chunk, note in scored[:top_k]:
        results.append({
            "id": chunk.id,
            "filename": note.filename,
            "page_number": chunk.page_number,
            "content": chunk.content,
            "similarity": score
        })
    return results
