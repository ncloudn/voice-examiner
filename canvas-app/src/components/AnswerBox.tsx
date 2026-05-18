import React, { useState } from 'react';
import styled from 'styled-components';

const Box = styled.section`
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 20px;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  resize: vertical;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 16px;
  padding: 14px;
  color: inherit;
  background: rgba(0,0,0,0.18);
  outline: none;
`;

const Button = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 700;
  margin-top: 10px;
`;

export function AnswerBox({ disabled, onSubmit }: { disabled: boolean; onSubmit: (answer: string) => Promise<void> }) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      await onSubmit(answer.trim());
      setAnswer('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <h2>Ответ студента</h2>
      <Textarea disabled={disabled} value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Введите ответ или скажите его через панель ассистента..." />
      <Button disabled={disabled || loading} onClick={submit}>{loading ? 'Оцениваю...' : 'Отправить на оценку'}</Button>
    </Box>
  );
}
