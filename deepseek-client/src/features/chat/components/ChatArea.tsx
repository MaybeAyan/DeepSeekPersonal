import { Box, Text } from '@mantine/core';
import { MessageList } from '../../../components/chat/MessageList';
// import { ChatInput } from '../../../components/chat/ChatInput';
import { ChatMessage } from '../../../types';
import { IconBrandOpenai } from '@tabler/icons-react';

interface ChatAreaProps {
  messages: ChatMessage[];
  isDark: boolean; // 添加 isDark 属性
}

export function ChatArea({ messages, isDark }: ChatAreaProps) {
  return (
    <Box
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {messages.length === 0 ? (
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: 0.8,
          }}
        >
          <IconBrandOpenai
            size={60}
            stroke={1}
            color={isDark ? '#61AFEF' : '#5C7CFA'}
          />
          <Text
            mt="xl"
            size="xl"
            c={isDark ? 'gray.4' : 'gray.7'}
            ta="center"
            fw={600}
          >
            DeepSeek AI 助手
          </Text>
          <Text
            size="sm"
            c={isDark ? 'gray.5' : 'gray.6'}
            mt="md"
            maw={450}
            ta="center"
            px="lg"
          >
            开始与 DeepSeek AI
            进行对话。你可以询问任何问题、请求创意建议或获取编程帮助。
          </Text>
        </Box>
      ) : (
        <Box
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <MessageList
            messages={messages}
            style={{ flex: 1 }}
            isDark={isDark}
          />
        </Box>
      )}
    </Box>
  );
}
