import React from 'react';
import styled from 'styled-components';

const Box = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
`;

const Card = styled.div`
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 20px;
  padding: 18px;
`;

const Value = styled.div`
  font-size: 32px;
  font-weight: 800;
`;

export function ScoreBoard({ answered, total, score }: { answered: number; total: number; score: number }) {
  return (
    <Box>
      <Card><div>Пройдено</div><Value>{answered}/{total}</Value></Card>
      <Card><div>Баллы</div><Value>{score}</Value></Card>
      <Card><div>Средний балл</div><Value>{answered ? (score / answered).toFixed(1) : '0.0'}</Value></Card>
    </Box>
  );
}
