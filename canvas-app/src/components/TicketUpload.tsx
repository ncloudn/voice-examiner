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
  min-height: 180px;
  resize: vertical;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 16px;
  padding: 14px;
  color: inherit;
  background: rgba(0,0,0,0.18);
  outline: none;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
`;

const Button = styled.button`
  border: 0;
  border-radius: 999px;
  padding: 12px 18px;
  cursor: pointer;
  font-weight: 700;
`;

export function TicketUpload({ onUpload }: { onUpload: (raw: string) => Promise<void> }) {
  const [raw, setRaw] = useState('Билет 1: Что такое инкапсуляция?\nБилет 2: Объясните полиморфизм.');
  const [loading, setLoading] = useState(false);

  async function handleFile(file?: File) {
    if (!file) return;
    const text = await file.text();
    setRaw(text);
  }

  async function submit() {
    setLoading(true);
    try {
      await onUpload(raw);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box>
      <h2>Билеты</h2>
      <Textarea value={raw} onChange={(event) => setRaw(event.target.value)} placeholder="Билет 1: Текст вопроса" />
      <Row>
        <input type="file" accept=".txt,.md" onChange={(event) => handleFile(event.target.files?.[0])} />
        <Button type="button" onClick={submit} disabled={loading}>{loading ? 'Загрузка...' : 'Загрузить в SQLite'}</Button>
      </Row>
    </Box>
  );
}
