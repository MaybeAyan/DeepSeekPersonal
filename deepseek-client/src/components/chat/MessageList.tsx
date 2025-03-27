import { useRef, useEffect, useMemo } from 'react';
import {
  Paper,
  ScrollArea,
  Stack,
  Text,
  Avatar,
  Box,
  Flex,
} from '@mantine/core';
import type { ChatMessage as ChatMessageType } from '../../types';
import { IconRobot, IconUser } from '@tabler/icons-react';

interface MessageListProps {
  messages: ChatMessageType[];
  style?: React.CSSProperties;
  isDark?: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode;
  botAvatars?: Record<string, string>;
  botNames?: Record<string, string>; // 添加机器人名称映射
}

// 添加消息去重处理函数
const getDeduplicatedMessages = (messages: ChatMessageType[]) => {
  const result: ChatMessageType[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMsg = messages[i];

    // 检查是否是用户消息以及下一条是否存在
    if (currentMsg.role === 'user' && i + 1 < messages.length) {
      const nextMsg = messages[i + 1];

      // 如果下一条也是用户消息，且内容相同，跳过当前消息
      if (nextMsg.role === 'user' && nextMsg.content === currentMsg.content) {
        // 如果时间间隔小于30秒，认为是重复消息
        const timeDiff =
          (nextMsg.created_at || 0) - (currentMsg.created_at || 0);
        if (timeDiff < 30000) {
          continue;
        }
      }
    }

    result.push(currentMsg);
  }

  return result;
};

export function MessageList({
  messages,
  style,
  isDark = false,
  customRenderer,
  botAvatars = {},
  botNames = {}, // 接收机器人名称映射
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // 检查是否显示发送者信息
  const shouldShowSender = (
    message: ChatMessageType,
    index: number,
    messages: ChatMessageType[]
  ) => {
    if (index === 0) return true;

    const prevMessage = messages[index - 1];

    // 如果前一条是用户消息，当前是机器人消息，总是显示头像
    if (prevMessage.role === 'user' && message.role === 'assistant') {
      return true;
    }

    // 如果角色不同，显示头像
    if (prevMessage.role !== message.role) {
      return true;
    }

    // 如果都是机器人消息，但ID不同，显示头像
    if (prevMessage.role === 'assistant' && message.role === 'assistant') {
      return prevMessage.bot_id !== message.bot_id;
    }

    // 默认情况下不显示
    return false;
  };

  const deduplicatedMessages = useMemo(
    () => getDeduplicatedMessages(messages),
    [messages]
  );

  return (
    <ScrollArea style={style} viewportRef={scrollRef} offsetScrollbars>
      <Stack gap="xs" p="sm">
        {deduplicatedMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isDark={isDark}
            customRenderer={customRenderer}
            showSender={shouldShowSender(message, index, deduplicatedMessages)}
            botAvatars={botAvatars}
            botNames={botNames}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
}

function MessageItem({
  message,
  isDark,
  customRenderer,
  showSender,
  botAvatars,
  botNames,
}: {
  message: ChatMessageType;
  isDark: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode;
  showSender: boolean;
  botAvatars: Record<string, string>;
  botNames: Record<string, string>;
}) {
  const isUser = message.role === 'user';
  const botId = message.bot_id || '';

  // 从映射中获取机器人名称
  const botName = botNames[botId] || '';

  return (
    <Box mb={8}>
      {/* 助手名称 - 只在消息顶部显示 */}
      {!isUser && showSender && (
        <Text
          size="xs"
          c={isDark ? 'gray.5' : 'gray.6'}
          ml={36} // 与头像对齐
          mb={4}
        >
          {botName}
        </Text>
      )}

      <Flex
        justify={isUser ? 'flex-end' : 'flex-start'}
        align="center" // 改为居中对齐
        wrap="nowrap"
        gap={8}
      >
        {/* 助手端显示头像 */}
        {!isUser && showSender && (
          <Avatar src={botAvatars[botId]} color="cyan" radius="xl" size="sm">
            <IconRobot size={14} />
          </Avatar>
        )}

        <Box style={{ maxWidth: '80%' }}>
          {/* 消息气泡 */}
          <Paper
            shadow="xs"
            radius="md"
            p="xs"
            withBorder={false}
            style={{
              backgroundColor: isUser
                ? isDark
                  ? '#3a506b'
                  : '#e6f7ff'
                : isDark
                ? '#25262b'
                : 'white',
              border: isUser
                ? `1px solid ${isDark ? '#4c7afa' : '#91caff'}`
                : `1px solid ${isDark ? '#373a40' : '#e9ecef'}`,
            }}
          >
            {customRenderer ? (
              customRenderer(message)
            ) : (
              <Text
                size="sm"
                style={{
                  wordBreak: 'break-word',
                }}
              >
                {message.content}
              </Text>
            )}
          </Paper>
        </Box>

        {/* 用户端显示头像 */}
        {isUser && showSender && (
          <Avatar color="blue" radius="xl" size="sm">
            <IconUser size={14} />
          </Avatar>
        )}
      </Flex>
    </Box>
  );
}
