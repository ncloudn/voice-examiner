from __future__ import annotations
from sqlalchemy import create_engine, Integer, String, Text, DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker
from config import get_settings

settings = get_settings()
engine = create_engine(settings.database_url, connect_args={"check_same_thread": False} if settings.database_url.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class Ticket(Base):
    __tablename__ = "tickets"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    question_text: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

class AnswerResult(Base):
    __tablename__ = "answer_results"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    session_id: Mapped[str] = mapped_column(String(128), index=True, nullable=False)
    ticket_id: Mapped[int] = mapped_column(Integer, index=True, nullable=False)
    user_answer: Mapped[str] = mapped_column(Text, nullable=False)
    total_score: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    feedback: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[str] = mapped_column(DateTime(timezone=True), server_default=func.now())

def init_db() -> None:
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
