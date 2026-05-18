import React, { useState } from 'react';
import styled from 'styled-components';
import { ExamMode } from '../types';

const Box = styled.section`
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
`;

const Button = styled.button<{ active?: boolean }>`
  border: 0;
  border-radius: 16px;
  padding: 12px;
  cursor: pointer;
  font-weight: 700;
  background: ${({ active }) => active ? '#ffffff' : 'rgba(255,255,255,0.18)'};
  color: ${({ active }) => active ? '#111111' : 'inherit'};
`;

const Input = styled.input`
  width: 100%;
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 14px;
  padding: 12px;
  color: inherit;
  background: rgba(0,0,0,0.18);
  margin: 10px 0;
`;

type Props = {
  mode: ExamMode;
  setMode: (mode: ExamMode) => void;
  onStart: (specificTicketId?: number) => void;
  onNext: () => void;
  onRepeat: () => void;
  onFinish: () => void;
};

export function ControlPanel({ mode, setMode, onStart, onNext, onRepeat, onFinish }: Props) {
  const [specific, setSpecific] = useState('1');

  return (
    <Box>
      <h2>Управление</h2>
      <Grid>
        <Button active={mode === 'forward'} onClick={() => setMode('forward')}>По порядку</Button>
        <Button active={mode === 'reverse'} onClick={() => setMode('reverse')}>Обратный порядок</Button>
        <Button active={mode === 'random'} onClick={() => setMode('random')}>Рандом</Button>
        <Button active={mode === 'specific'} onClick={() => setMode('specific')}>Билет №X</Button>
      </Grid>
      {mode === 'specific' && <Input value={specific} onChange={(e) => setSpecific(e.target.value)} placeholder="Номер билета" />}
      <Grid style={{ marginTop: 14 }}>
        <Button onClick={() => onStart(mode === 'specific' ? Number(specific) : undefined)}>Начать экзамен</Button>
        <Button onClick={onNext}>Следующий вопрос</Button>
        <Button onClick={onRepeat}>Повтори вопрос</Button>
        <Button onClick={onFinish}>Закончить экзамен</Button>
      </Grid>
    </Box>
  );
}
