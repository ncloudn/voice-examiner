import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import { createAssistant, createSmartappDebugger } from '@sberdevices/assistant-client';

type AssistantApi = {
  sendAction: (action: unknown) => void;
};

const AssistantContext = createContext<AssistantApi>({
  sendAction: () => undefined,
});

type Props = {
  getState: () => Record<string, unknown>;
  onAssistantData: (data: any) => void;
  children: React.ReactNode;
};

export function AssistantClientProvider({ getState, onAssistantData, children }: Props) {
  const assistantRef = useRef<any>(null);

  useEffect(() => {
    const token = process.env.REACT_APP_TOKEN || '';
    const hasToken = token.trim().length > 0;

    // В dev-режиме debugger требует валидный token из SmartApp Studio.
    // Если токена нет, не инициализируем assistant-client, чтобы фронтенд мог работать как обычный React UI.
    if (process.env.NODE_ENV === 'development' && !hasToken) {
      // eslint-disable-next-line no-console
      console.warn('REACT_APP_TOKEN is empty. Assistant debugger is disabled.');
      return;
    }

    const assistant =
      process.env.NODE_ENV === 'development'
        ? createSmartappDebugger({
            token,
            initPhrase: `Запусти ${process.env.REACT_APP_SMARTAPP || 'голосовой экзаменатор'}`,
            getState: getState as any,
            nativePanel: {
              defaultText: 'Скажите команду...',
              screenshotMode: false,
            },
          })
        : createAssistant({ getState: getState as any });

    assistantRef.current = assistant;

    assistant.on('data', onAssistantData as any);

    return () => {
      assistantRef.current = null;
    };
  }, [getState, onAssistantData]);

  const value = useMemo<AssistantApi>(
    () => ({
      sendAction: (action: unknown) => {
        assistantRef.current?.sendData?.({ action });
      },
    }),
    []
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistantClient() {
  return useContext(AssistantContext);
}