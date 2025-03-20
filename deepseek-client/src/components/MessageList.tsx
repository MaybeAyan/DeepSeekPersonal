import { FC, useRef, useEffect } from 'react';
import { Box, ScrollArea } from '@mantine/core';
import { ChatMessage } from './ChatMessage';
import type { ChatMessage as ChatMessageType } from '../types';

interface MessageListProps {
  messages: ChatMessageType[];
  style?: React.CSSProperties;
  isDark?: boolean;
}

export const MessageList: FC<MessageListProps> = ({
  messages,
  style = {},
  isDark = false,
}) => {
  const viewport = useRef<HTMLDivElement>(null);

  // 滚动到底部
  useEffect(() => {
    if (viewport.current) {
      viewport.current.scrollTo({
        top: viewport.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  return (
    <ScrollArea
      style={{ flex: 1, ...style }}
      viewportRef={viewport}
      offsetScrollbars
    >
      <Box p="md">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} isDark={isDark} />
        ))}
      </Box>
    </ScrollArea>
  );
};
