from __future__ import annotations
import random
import re
from typing import Any
import requests
from fastapi import Depends, FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config import get_settings
from database import AnswerResult, Ticket, get_db, init_db
from evaluator import evaluator
from models import EvaluateRequest, EvaluationResult, NextQuestionRequest, NextQuestionResponse, StatsResponse, TicketDto, UploadTicketsRequest, UploadTicketsResponse

settings = get_settings()
app = FastAPI(title="Голосовой экзаменатор API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def parse_tickets(raw_text: str) -> list[str]:
    """Парсит формат: Билет 1: Текст вопроса."""
    pattern = re.compile(r"(?:^|\n)\s*Билет\s*\d+\s*[:\-–]\s*(.+?)(?=(?:\n\s*Билет\s*\d+\s*[:\-–])|\Z)", re.I | re.S)
    found = [m.group(1).strip() for m in pattern.finditer(raw_text) if m.group(1).strip()]
    return found or [line.strip() for line in raw_text.splitlines() if line.strip()]

def to_dto(ticket: Ticket) -> TicketDto:
    return TicketDto(id=ticket.id, question_text=ticket.question_text)

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}

@app.post("/upload_tickets", response_model=UploadTicketsResponse)
def upload_tickets(payload: UploadTicketsRequest, db: Session = Depends(get_db)):
    questions = parse_tickets(payload.raw_text)
    if not questions:
        raise HTTPException(status_code=400, detail="Не найдено ни одного билета")
    if payload.replace:
        db.query(AnswerResult).delete()
        db.query(Ticket).delete()
        db.commit()
    tickets = [Ticket(question_text=q) for q in questions]
    db.add_all(tickets)
    db.commit()
    for ticket in tickets:
        db.refresh(ticket)
    return UploadTicketsResponse(count=len(tickets), tickets=[to_dto(t) for t in tickets])

@app.get("/tickets", response_model=list[TicketDto])
def list_tickets(db: Session = Depends(get_db)):
    return [to_dto(t) for t in db.query(Ticket).order_by(Ticket.id.asc()).all()]

@app.post("/next_question", response_model=NextQuestionResponse)
def next_question(payload: NextQuestionRequest, db: Session = Depends(get_db)):
    tickets = db.query(Ticket).order_by(Ticket.id.asc()).all()
    if not tickets:
        raise HTTPException(status_code=404, detail="Билеты ещё не загружены")
    ids = [t.id for t in tickets]
    answered = set(payload.answeredTickets or [])
    by_id = {t.id: t for t in tickets}
    selected: Ticket | None = None
    if payload.mode == "specific":
        if not payload.specificTicketId:
            raise HTTPException(status_code=400, detail="Для конкретного билета нужен specificTicketId")
        selected = by_id.get(payload.specificTicketId)
        if not selected:
            raise HTTPException(status_code=404, detail="Такого билета нет")
    elif payload.mode == "reverse":
        candidates = [i for i in reversed(ids) if i not in answered]
        selected = by_id.get(candidates[0]) if candidates else None
    elif payload.mode == "random":
        candidates = [i for i in ids if i not in answered]
        selected = by_id.get(random.choice(candidates)) if candidates else None
    else:
        candidates = [i for i in ids if i not in answered]
        selected = by_id.get(candidates[0]) if candidates else None
    if selected is None:
        return NextQuestionResponse(ticket=None, isFinished=True, message="Экзамен завершён: больше нет вопросов.")
    return NextQuestionResponse(ticket=to_dto(selected), isFinished=False, message="Следующий вопрос получен.")

@app.post("/evaluate", response_model=EvaluationResult)
def evaluate_answer(payload: EvaluateRequest, db: Session = Depends(get_db)):
    ticket = db.get(Ticket, payload.ticketId)
    if not ticket:
        raise HTTPException(status_code=404, detail="Билет не найден")
    result = evaluator.evaluate(ticket.question_text, payload.userAnswer)
    db.add(AnswerResult(session_id=payload.sessionId, ticket_id=payload.ticketId, user_answer=payload.userAnswer, total_score=result.total_score, feedback=result.feedback))
    db.commit()
    return result

@app.get("/stats/{session_id}", response_model=StatsResponse)
def stats(session_id: str, db: Session = Depends(get_db)):
    total = db.query(Ticket).count()
    results = db.query(AnswerResult).filter(AnswerResult.session_id == session_id).all()
    return StatsResponse(total=total, answered=len({r.ticket_id for r in results}), score=sum(r.total_score for r in results))

@app.get("/synthesize")
def synthesize(text: str):
    """Опциональный TTS-прокси. Обычно достаточно речи ассистента через a:."""
    if not settings.salutespeech_auth_key:
        raise HTTPException(status_code=501, detail="SALUTESPEECH_AUTH_KEY не задан")
    token_resp = requests.post(settings.salutespeech_oauth_url, headers={"Authorization": f"Basic {settings.salutespeech_auth_key}", "Content-Type": "application/x-www-form-urlencoded"}, data={"scope": settings.salutespeech_scope}, timeout=20, verify=settings.verify_ssl_certs)
    token_resp.raise_for_status()
    token = token_resp.json()["access_token"]
    tts_resp = requests.post(settings.salutespeech_tts_url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/text"}, data=text.encode("utf-8"), timeout=30, verify=settings.verify_ssl_certs)
    tts_resp.raise_for_status()
    return Response(content=tts_resp.content, media_type=tts_resp.headers.get("content-type", "audio/wav"))

@app.post("/smartapp/webhook")
def smartapp_webhook(payload: dict[str, Any]):
    """Webhook для SmartApp Code/Canvas. Возвращает smart_app_data для React и текст для ассистента."""
    session_id = str(payload.get("sessionId") or payload.get("uuid") or "smartapp-session")
    server_action = payload.get("payload", {}).get("server_action", {})
    action = server_action.get("action_id") or payload.get("action") or payload.get("command")
    action_id = action.get("type") if isinstance(action, dict) else action
    text = str(payload.get("message") or payload.get("text") or payload.get("payload", {}).get("message", {}).get("text") or "").lower()
    if not action_id:
        if "след" in text:
            action_id = "next"
        elif "повтори" in text:
            action_id = "repeat"
        elif "законч" in text:
            action_id = "finish"
        else:
            action_id = "unknown"
    messages = {
        "finish": "Экзамен завершён.",
        "repeat": "Повторяю текущий вопрос.",
        "next": "Перехожу к следующему вопросу.",
        "unknown": "Я не понял команду. Скажите: следующий вопрос, повтори вопрос или закончить экзамен.",
    }
    message = messages.get(str(action_id), "Команда получена.")
    return {
        "messageName": "ANSWER_TO_USER",
        "payload": {
            "pronounceText": message,
            "items": [{"bubble": {"text": message}}],
            "auto_listening": True,
            "smart_app_data": {"action": action_id, "sessionId": session_id},
        },
    }
