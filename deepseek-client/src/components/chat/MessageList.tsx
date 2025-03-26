import { useRef, useEffect } from 'react';
import { Paper, ScrollArea, Stack, Text } from '@mantine/core';
import type { ChatMessage as ChatMessageType } from '../../types';

interface MessageListProps {
  messages: ChatMessageType[];
  style?: React.CSSProperties;
  isDark?: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode; // 修改类型定义
}

// 在 MessageList 组件中使用自定义渲染器
export function MessageList({
  messages,
  style,
  isDark = false,
  customRenderer,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea style={style} viewportRef={scrollRef} offsetScrollbars>
      <Stack gap="lg" p="md">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isDark={isDark}
            customRenderer={customRenderer} // 传递 customRenderer
          />
        ))}
      </Stack>
    </ScrollArea>
  );
}

// 在 MessageBubble 组件中使用自定义渲染器
function MessageBubble({
  message,
  isDark,
  customRenderer,
}: {
  message: ChatMessageType; // 修改类型定义
  isDark: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode; // 修改类型定义
}) {
  const isUser = message.role === 'user';

  return (
    <Paper
      shadow="sm"
      radius="md"
      p="md"
      style={{
        maxWidth: '85%',
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        backgroundColor: isUser
          ? isDark
            ? '#3a506b'
            : '#e6f7ff'
          : isDark
          ? '#25262b'
          : 'white',
        borderColor: isUser
          ? isDark
            ? '#4c7afa'
            : '#91caff'
          : isDark
          ? '#373a40'
          : '#e9ecef',
      }}
    >
      {customRenderer ? (
        customRenderer(message)
      ) : (
        <Text size="sm">{message.content}</Text>
      )}
    </Paper>
  );
}
