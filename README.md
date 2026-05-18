# Голосовой экзаменатор

Клиент-серверное приложение на экосистеме Сбера:

- `smartapp-code/` — DSL-сценарий SmartApp Code.
- `canvas-app/` — React Canvas App с `@sberdevices/assistant-client`.
- `backend/` — FastAPI + SQLite + интеграция GigaChat + опциональный SaluteSpeech TTS.

## 1. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

В `.env` заполните:

```env
GIGACHAT_AUTH_KEY=ваш_authorization_key_base64
SALUTESPEECH_AUTH_KEY=ваш_authorization_key_base64
```

`SALUTESPEECH_AUTH_KEY` не обязателен: голос ассистента обычно работает через `a:` в SmartApp Code.
Если `GIGACHAT_AUTH_KEY` пустой, `/evaluate` не падает, а возвращает fallback-оценку, чтобы проект можно было показать на защите.

## 2. Canvas App

```bash
cd canvas-app
npm install
cp .env.example .env
npm start
```

В `.env`:

```env
REACT_APP_TOKEN=токен_из_SmartApp_Studio
REACT_APP_SMARTAPP=Голосовой экзаменатор
REACT_APP_API_URL=http://localhost:8000
```

В разработке используется `createSmartappDebugger`, в production — `createAssistant`.
Прямой `getUserMedia` не используется: голосовой ввод идёт через встроенную панель ассистента.
`localStorage` не используется: состояние хранится в React state и SQLite на backend.

## 3. SmartApp Studio

1. Зарегистрируйтесь в SmartApp Studio.
2. Создайте проект SmartApp Code.
3. Загрузите `smartapp-code/scenario.salute`.
4. В настройках webhook укажите backend endpoint:

```text
https://<ваш-домен>/smartapp/webhook
```

Для локального теста нужен публичный HTTPS-туннель до backend, например через ngrok/cloudflared.

5. Создайте Canvas App и привяжите frontend build.
6. Получите токен и пропишите его в `canvas-app/.env`.
7. Запустите backend и React.
8. Тестируйте через панель ассистента: фразы «Начать экзамен», «Следующий вопрос», «Повтори вопрос», «Закончить экзамен».

## Формат билетов

```text
Билет 1: Что такое инкапсуляция?
Билет 2: Объясните полиморфизм.
Билет 3: Что такое REST API?
```

После загрузки backend сохраняет вопросы в таблицу `tickets: id, question_text`.

## API

- `POST /upload_tickets` — загрузка билетов.
- `GET /tickets` — список билетов.
- `POST /next_question` — следующий вопрос по режиму.
- `POST /evaluate` — оценка ответа через GigaChat.
- `GET /synthesize` — опциональный TTS-прокси SaluteSpeech.
- `POST /smartapp/webhook` — webhook для SmartApp Code/Canvas.

## Важное замечание по DSL

Файл `scenario.salute` сделан как рабочий шаблон под требуемые состояния и реакции `a:`. В SmartApp Studio конкретный синтаксис вызова webhook/action может отличаться по версии конструктора, поэтому endpoint и форму webhook-вызова проверьте в интерфейсе Studio. Backend специально принимает гибкий JSON, чтобы пережить разные форматы payload.
