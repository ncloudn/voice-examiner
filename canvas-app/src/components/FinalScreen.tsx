import React from 'react';
import styled from 'styled-components';

const Card = styled.section`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 28px;
  padding: 28px;
  margin-bottom: 20px;
`;

const Title = styled.h2`
  margin: 0 0 12px;
  font-size: 32px;
`;

const Subtitle = styled.p`
  margin: 0 0 24px;
  opacity: 0.78;
  line-height: 1.5;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;

  @media (max-width: 900px) {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
`;

const Stat = styled.div`
  background: rgba(255, 255, 255, 0.08);
  border-radius: 20px;
  padding: 18px;
`;

const StatLabel = styled.div`
  font-size: 13px;
  opacity: 0.7;
  margin-bottom: 8px;
`;

const StatValue = styled.div`
  font-size: 26px;
  font-weight: 800;
`;

const Button = styled.button`
  margin-top: 24px;
  border: 0;
  border-radius: 18px;
  padding: 14px 18px;
  cursor: pointer;
  font-weight: 800;
  color: #ffffff;
  background: linear-gradient(135deg, #2f80ed, #56ccf2);

  &:hover {
    filter: brightness(1.08);
  }
`;

type Props = {
  answeredCount: number;
  totalCount: number;
  score: number;
  onRestart: () => void;
};

export function FinalScreen({ answeredCount, totalCount, score, onRestart }: Props) {
  const averageScore = answeredCount > 0 ? score / answeredCount : 0;
  const progressPercent = totalCount > 0 ? Math.round((answeredCount / totalCount) * 100) : 0;

  return (
    <Card>
      <Title>Экзамен завершён</Title>

      <Subtitle>
        Итоги попытки сформированы. Можно начать новый экзамен с теми же билетами
        или загрузить другой список вопросов.
      </Subtitle>

      <Grid>
        <Stat>
          <StatLabel>Пройдено билетов</StatLabel>
          <StatValue>
            {answeredCount}/{totalCount}
          </StatValue>
        </Stat>

        <Stat>
          <StatLabel>Итоговый балл</StatLabel>
          <StatValue>{score}</StatValue>
        </Stat>

        <Stat>
          <StatLabel>Средний балл</StatLabel>
          <StatValue>{averageScore.toFixed(1)}</StatValue>
        </Stat>

        <Stat>
          <StatLabel>Прогресс</StatLabel>
          <StatValue>{progressPercent}%</StatValue>
        </Stat>
      </Grid>

      <Button onClick={onRestart}>Начать новый экзамен</Button>
    </Card>
  );
}