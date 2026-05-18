export type ExamMode = 'forward' | 'reverse' | 'random' | 'specific';

export type Ticket = {
  id: number;
  question_text: string;
};

export type EvaluationResult = {
  correctness: number;
  completeness: number;
  total_score: number;
  feedback: string;
  is_passed: boolean;
};

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'student' | 'system';
  text: string;
};

export type ExamState = {
  sessionId: string;
  mode: ExamMode;
  currentTicket: Ticket | null;
  answeredTickets: number[];
  score: number;
  totalTickets: number;
  log: ChatMessage[];
  isExamActive: boolean;
  isFinished: boolean;
};
