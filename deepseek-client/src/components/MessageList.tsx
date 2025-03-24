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

  // 滚动到底部 - 修改为更可靠的方式
  useEffect(() => {
    if (viewport.current) {
      // 给一个小延迟确保内容已渲染
      setTimeout(() => {
        viewport.current?.scrollTo({
          top: viewport.current.scrollHeight,
          behavior: 'smooth',
        });
      }, 100);
    }
  }, [messages]);

  return (
    <ScrollArea
      style={{ height: '100%', width: '100%', ...style }}
      viewportRef={viewport}
      offsetScrollbars
      scrollbarSize={8} // 稍微增大滚动条尺寸
      type="auto" // 确保使用auto模式
    >
      <Box p="md">
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} isDark={isDark} />
        ))}
      </Box>
    </ScrollArea>
  );
};
