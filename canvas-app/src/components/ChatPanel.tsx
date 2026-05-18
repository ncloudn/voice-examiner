import React from 'react';
import styled from 'styled-components';
import { ChatMessage } from '../types';

const Panel = styled.section`
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 24px;
  padding: 20px;
  min-height: 420px;
  max-height: 680px;
  overflow: auto;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const ClearButton = styled.button`
  border: 0;
  border-radius: 14px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 700;
  color: #ffffff;
  background: rgba(255,255,255,0.14);

  &:hover {
    background: rgba(255,255,255,0.22);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.45;
  }
`;

const Message = styled.div<{ role: string }>`
  margin: 0 0 12px;
  padding: 14px 16px;
  border-radius: 18px;
  background: ${({ role }) =>
    role === 'assistant'
      ? 'rgba(60, 120, 255, 0.18)'
      : role === 'student'
        ? 'rgba(46, 204, 113, 0.16)'
        : 'rgba(255,255,255,0.08)'};
`;

const Role = styled.div`
  font-size: 12px;
  opacity: 0.7;
  margin-bottom: 6px;
  text-transform: uppercase;
`;

type Props = {
  messages: ChatMessage[];
  onClear: () => void;
};

export function ChatPanel({ messages, onClear }: Props) {
  return (
    <Panel>
      <HeaderRow>
        <h2 style={{ margin: 0 }}>Лог диалога</h2>
        <ClearButton disabled={messages.length === 0} onClick={onClear}>
          Очистить лог
        </ClearButton>
      </HeaderRow>

      {messages.length === 0 && <p>Загрузите билеты и начните экзамен.</p>}

      {messages.map((message) => (
        <Message key={message.id} role={message.role}>
          <Role>
            {message.role === 'assistant'
              ? 'Ассистент'
              : message.role === 'student'
                ? 'Студент'
                : 'Система'}
          </Role>
          <div>{message.text}</div>
        </Message>
      ))}
    </Panel>
  );
}
