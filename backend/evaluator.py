from __future__ import annotations
import json
import uuid
from typing import Any
import requests
import urllib3
from requests import RequestException
from config import get_settings
from models import EvaluationResult


settings = get_settings()

def _extract_json(text: str) -> dict[str, Any]:
    text = text.strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("GigaChat вернул не JSON")
        return json.loads(text[start:end + 1])

def _fallback_evaluation(question: str, student_answer: str, reason: str) -> EvaluationResult:
    words = [w for w in student_answer.strip().split() if w]
    approx = min(10, max(0, len(words) // 6))
    return EvaluationResult(
        correctness=min(5, approx // 2),
        completeness=min(5, approx - approx // 2),
        total_score=approx,
        feedback=f"Автооценка недоступна: {reason}. Предварительно ответ выглядит {'развёрнутым' if approx >= 5 else 'слишком кратким'}.",
        is_passed=approx >= 6,
    )

class GigaChatEvaluator:
    def __init__(self) -> None:
        self._access_token: str | None = None

    def _get_token(self) -> str:
        if not settings.gigachat_auth_key:
            raise RuntimeError("GIGACHAT_AUTH_KEY не задан")
        response = requests.post(
            settings.gigachat_oauth_url,
            headers={
                "Authorization": f"Basic {settings.gigachat_auth_key}",
                "RqUID": str(uuid.uuid4()),
                "Content-Type": "application/x-www-form-urlencoded",
            },
            data={"scope": settings.gigachat_scope},
            timeout=20,
            verify=settings.verify_ssl_certs,
        )
        response.raise_for_status()
        token = response.json().get("access_token")
        if not token:
            raise RuntimeError("OAuth не вернул access_token")
        self._access_token = token
        return token

    def evaluate(self, question: str, student_answer: str) -> EvaluationResult:
        prompt = f'''Ты — строгий экзаменатор. Оцени ответ студента.

Вопрос: {question}
Ответ студента: {student_answer}

Верни ТОЛЬКО JSON:
{{
    "correctness": 0-5,
    "completeness": 0-5,
    "total_score": 0-10,
    "feedback": "краткий_анализ_на_русском_1-2_предложения",
    "is_passed": true/false
}}'''
        try:
            token = self._access_token or self._get_token()
            payload = {"model": settings.gigachat_model, "messages": [{"role": "user", "content": prompt}], "temperature": 0.1}
            response = requests.post(settings.gigachat_api_url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=payload, timeout=45, verify=settings.verify_ssl_certs)
            if response.status_code == 401:
                token = self._get_token()
                response = requests.post(settings.gigachat_api_url, headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}, json=payload, timeout=45, verify=settings.verify_ssl_certs)
            response.raise_for_status()
            content = response.json()["choices"][0]["message"]["content"]
            return EvaluationResult(**_extract_json(content))
        except (RequestException, RuntimeError, KeyError, ValueError, json.JSONDecodeError) as exc:
            return _fallback_evaluation(question, student_answer, str(exc))

evaluator = GigaChatEvaluator()
