import { ExamMode, EvaluationResult, Ticket } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'https://voice-examiner-backend.onrender.com';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export const api = {
  uploadTickets(rawText: string) {
    return request<{ count: number; tickets: Ticket[] }>('/upload_tickets', {
      method: 'POST',
      body: JSON.stringify({ raw_text: rawText, replace: true }),
    });
  },

  getTickets() {
    return request<Ticket[]>('/tickets');
  },

  nextQuestion(params: {
    sessionId: string;
    mode: ExamMode;
    currentId?: number;
    answeredTickets: number[];
    specificTicketId?: number;
  }) {
    return request<{ ticket: Ticket | null; isFinished: boolean; message: string }>('/next_question', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  evaluate(sessionId: string, ticketId: number, userAnswer: string) {
    return request<EvaluationResult>('/evaluate', {
      method: 'POST',
      body: JSON.stringify({ sessionId, ticketId, userAnswer }),
    });
  },
};
