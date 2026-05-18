from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Literal

Mode = Literal["forward", "reverse", "random", "specific"]

class UploadTicketsRequest(BaseModel):
    raw_text: str = Field(..., min_length=1)
    replace: bool = True

class TicketDto(BaseModel):
    id: int
    question_text: str

class UploadTicketsResponse(BaseModel):
    count: int
    tickets: list[TicketDto]

class NextQuestionRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    mode: Mode = "forward"
    currentId: int | None = None
    answeredTickets: list[int] = Field(default_factory=list)
    specificTicketId: int | None = None

class NextQuestionResponse(BaseModel):
    ticket: TicketDto | None
    isFinished: bool = False
    message: str

class EvaluateRequest(BaseModel):
    sessionId: str = Field(..., min_length=1)
    ticketId: int
    userAnswer: str = Field(..., min_length=1)

class EvaluationResult(BaseModel):
    correctness: int = Field(ge=0, le=5)
    completeness: int = Field(ge=0, le=5)
    total_score: int = Field(ge=0, le=10)
    feedback: str
    is_passed: bool

class StatsResponse(BaseModel):
    total: int
    answered: int
    score: int
