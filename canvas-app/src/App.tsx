import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';
import { AnswerBox } from './components/AnswerBox';
import { ChatPanel } from './components/ChatPanel';
import { ControlPanel } from './components/ControlPanel';
import { ScoreBoard } from './components/ScoreBoard';
import { TicketUpload } from './components/TicketUpload';
import { AssistantClientProvider } from './context/AssistantClientProvider';
import { api } from './services/api';
import { ChatMessage, ExamMode, ExamState, Ticket } from './types';
import { FinalScreen } from './components/FinalScreen';

const Page = styled.main`
  min-height: 100vh;
  padding: 32px;
  padding-bottom: 140px;
  background: radial-gradient(circle at top left, rgba(84, 122, 255, 0.26), transparent 32%), #080b14;
  color: #fff;
`;
const Header = styled.header`margin-bottom: 24px;`;
const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
  gap: 18px;
  @media (max-width: 980px) { grid-template-columns: 1fr; }
`;
const Stack = styled.div`display: grid; gap: 18px;`;
const ErrorBox = styled.div`
  margin: 14px 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(255, 73, 73, 0.18);
`;

function uid() { return `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
function addMessage(log: ChatMessage[], role: ChatMessage['role'], text: string): ChatMessage[] {
  return [...log, { id: uid(), role, text }];
}

const initialState: ExamState = {
  sessionId: `web-${Date.now()}`,
  mode: 'forward',
  currentTicket: null,
  answeredTickets: [],
  score: 0,
  totalTickets: 0,
  log: [],
  isExamActive: false,
  isFinished: false,
};

export default function App() {
  const [state, setState] = useState<ExamState>(initialState);
  const [error, setError] = useState('');
  const stateRef = useRef(state);
  stateRef.current = state;

  const safeRun = async (fn: () => Promise<void>) => {
    try {
      setError('');
      await fn();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Неизвестная ошибка';
      setError(message);
      setState((prev) => ({ ...prev, log: addMessage(prev.log, 'system', `Ошибка: ${message}`) }));
    }
  };

  const loadTickets = async (raw: string) => safeRun(async () => {
    const result = await api.uploadTickets(raw);
    setState((prev) => ({
      ...prev,
      totalTickets: result.count,
      currentTicket: null,
      answeredTickets: [],
      score: 0,
      isExamActive: false,
      isFinished: false,
      log: addMessage(prev.log, 'system', `Загружено билетов: ${result.count}`),
    }));
  });

  const askQuestion = async (specificTicketId?: number) => safeRun(async () => {
    const current = stateRef.current;
    const response = await api.nextQuestion({
      sessionId: current.sessionId,
      mode: current.mode,
      currentId: current.currentTicket?.id,
      answeredTickets: current.answeredTickets,
      specificTicketId,
    });
    if (response.isFinished || !response.ticket) {
      setState((prev) => ({
        ...prev,
        isExamActive: false,
        isFinished: true,
        currentTicket: null,
        log: addMessage(prev.log, 'assistant', response.message || 'Вопросы закончились. Экзамен завершён.'),
      }));
      return;
    }
    setState((prev) => ({
      ...prev,
      currentTicket: response.ticket,
      isExamActive: true,
      isFinished: false,
      log: addMessage(prev.log, 'assistant', `Билет ${response.ticket!.id}: ${response.ticket!.question_text}`),
    }));
  });

  const repeatQuestion = () => {
    const ticket = stateRef.current.currentTicket;
    setState((prev) => ({ ...prev, log: addMessage(prev.log, 'assistant', ticket ? `Повторяю. Билет ${ticket.id}: ${ticket.question_text}` : 'Сейчас нет активного вопроса.') }));
  };

  const finishExam = () => {
    setState((prev) => ({
      ...prev,
      isExamActive: false,
      isFinished: true,
      currentTicket: null,
      log: addMessage(prev.log, 'assistant', `Экзамен завершён. Итог: ${prev.score} баллов.`),
    }));
  };

  const handleCommandText = (rawText: string): boolean => {
    const text = rawText.trim().toLowerCase();

    if (!text) {
      return false;
    }

    if (
      text === 'повтори вопрос' ||
      text === 'повторить вопрос' ||
      text.includes('повтори')
    ) {
      repeatQuestion();
      return true;
    }

    if (
      text === 'следующий вопрос' ||
      text === 'дальше' ||
      text.includes('следующий')
    ) {
      void askQuestion();
      return true;
    }

    if (
      text === 'закончить экзамен' ||
      text === 'завершить экзамен' ||
      text.includes('закончить') ||
      text.includes('завершить')
    ) {
      finishExam();
      return true;
    }

    return false;
  };

  const submitAnswer = async (answer: string) => {
    if (handleCommandText(answer)) {
      return;
    }

    return safeRun(async () => {
      const ticket: Ticket | null = stateRef.current.currentTicket;
      if (!ticket) throw new Error('Нет активного билета');

      setState((prev) => ({
        ...prev,
        log: addMessage(prev.log, 'student', answer),
      }));
    const result = await api.evaluate(stateRef.current.sessionId, ticket.id, answer);
    setState((prev) => ({
      ...prev,
      score: prev.score + result.total_score,
      answeredTickets: prev.answeredTickets.includes(ticket.id) ? prev.answeredTickets : [...prev.answeredTickets, ticket.id],
      currentTicket: null,
      log: addMessage(prev.log, 'assistant', `Оценка: ${result.total_score}/10. ${result.feedback}`),
    }));
  });
};
  const getAssistantState = useCallback(() => ({ ...stateRef.current, log: stateRef.current.log.slice(-5) }), []);

  const onAssistantData = useCallback((data: any) => {
    const smartData = data?.smart_app_data || data?.payload?.smart_app_data || data?.payload || data;
    const action = smartData?.action || smartData?.command;
    const text = String(
      data?.message?.text ||
      data?.payload?.message?.text ||
      smartData?.text ||
      ''
    );

    if (action === 'next') return void askQuestion();
    if (action === 'repeat') return repeatQuestion();
    if (action === 'finish') return finishExam();

    if (text && handleCommandText(text)) {
      return;
    }

    if (stateRef.current.currentTicket && text) {
      return void submitAnswer(text);
    }
  }, []);

  return (
    <AssistantClientProvider getState={getAssistantState} onAssistantData={onAssistantData}>
      <Page>
        <Header>
          <h1>Голосовой экзаменатор</h1>
          {error && <ErrorBox>{error}</ErrorBox>}
        </Header>
        <ScoreBoard answered={state.answeredTickets.length} total={state.totalTickets} score={state.score} />
        <Layout style={{ marginTop: 18 }}>
          <ChatPanel
            messages={state.log}
            onClear={() => setState((prev) => ({ ...prev, log: [] }))}
          />
          <Stack>
            <TicketUpload onUpload={loadTickets} />

            {state.isFinished && (
              <FinalScreen
                answeredCount={state.answeredTickets.length}
                totalCount={state.totalTickets}
                score={state.score}
                onRestart={() => askQuestion()}
              />
            )}

            <ControlPanel
              mode={state.mode}
              setMode={(mode: ExamMode) => setState((prev) => ({ ...prev, mode }))}
              onStart={() => askQuestion()}
              onNext={() => askQuestion()}
              onRepeat={repeatQuestion}
              onFinish={finishExam}
            />

            <AnswerBox disabled={!state.currentTicket || state.isFinished} onSubmit={submitAnswer} />
          </Stack>
        </Layout>
      </Page>
    </AssistantClientProvider>
  );
}
