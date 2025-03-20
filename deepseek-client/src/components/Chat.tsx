import { useState, useRef, useEffect } from 'react';
import {
  AppShell,
  Container,
  Paper,
  Box,
  Title,
  Group,
  Text,
  ActionIcon,
  // useMantineColorScheme,
} from '@mantine/core';
import { v4 as uuidv4 } from 'uuid';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { CompletionRequest, deepseekAPI } from '../api/deepseek';
import { ChatMessage, ChatSettings } from '../types';
import { SettingsModal } from './SettingsModal';
import {
  IconBrandGithub,
  IconBrandOpenai,
  IconMoon,
  IconSettings,
  IconSun,
} from '@tabler/icons-react';

interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
}

export function Chat({ toggleColorScheme, colorScheme }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 500,
    model: 'deepseek-chat',
    streamMode: true,
  });

  const isDark = colorScheme === 'dark';

  const abortControllerRef = useRef<() => void | null>(null);

  // 计算视口高度并保持固定高度的聊天区域
  const [, setViewportHeight] = useState(window.innerHeight);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const handleSendMessage = async (content: string) => {
    if (isLoading) return;

    // 创建用户消息
    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    // 更新消息列表
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // 准备请求参数
    const request: CompletionRequest = {
      prompt: content,
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      model: settings.model,
    };

    // 如果使用流式模式，先创建一个空的助手回复
    let assistantMessageId = '';
    if (settings.streamMode) {
      assistantMessageId = uuidv4();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: Date.now(),
        },
      ]);
    }

    try {
      if (settings.streamMode) {
        // 使用流式API
        const stopStream = deepseekAPI.postCompletionStream(
          request,
          (data) => {
            // 处理流式响应
            const delta = data.choices[0]?.delta?.content || '';
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: msg.content + delta,
                  };
                }
                return msg;
              });
            });
          },
          () => {
            setIsLoading(false);
            abortControllerRef.current = null;
          },
          (error) => {
            console.error('Stream error:', error);
            setIsLoading(false);
            abortControllerRef.current = null;

            // 更新错误消息
            setMessages((prevMessages) => {
              return prevMessages.map((msg) => {
                if (msg.id === assistantMessageId) {
                  return {
                    ...msg,
                    content: `Error: ${error.message}`,
                  };
                }
                return msg;
              });
            });
          }
        );

        abortControllerRef.current = stopStream;
      } else {
        // 使用普通API
        const response = await deepseekAPI.getCompletion(request);

        // 创建助手回复
        const assistantMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: response.choices[0].message.content,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('API error:', error);

      // 创建错误消息
      const errorMessage: ChatMessage = {
        id: uuidv4(),
        role: 'assistant',
        content: `Error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, errorMessage]);
      setIsLoading(false);
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  };

  return (
    <AppShell padding="md" style={{ height: '100vh' }}>
      <AppShell.Header
        h={60}
        style={{
          backgroundColor: isDark ? '#1A1B1E' : '#ffffff',
          borderBottom: `1px solid ${isDark ? '#2C2E33' : '#e9ecef'}`,
        }}
      >
        <Container
          size="xl"
          h="100%"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Group gap="xs">
            <IconBrandOpenai
              size={32}
              color={isDark ? '#61AFEF' : '#5C7CFA'}
              style={{ marginRight: 8 }}
            />
            <Title
              order={2}
              style={{
                fontFamily:
                  'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
                color: isDark ? '#C1C2C5' : 'inherit',
              }}
            >
              DeepSeek Chat
            </Title>
          </Group>

          <Group>
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => toggleColorScheme()}
              title={isDark ? '切换到浅色模式' : '切换到深色模式'}
              style={{ color: isDark ? '#C1C2C5' : 'inherit' }}
            >
              {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              size="lg"
              component="a"
              href="https://github.com/deepseek-ai/DeepSeek-Coder"
              target="_blank"
              title="GitHub 仓库"
              style={{ color: isDark ? '#C1C2C5' : 'inherit' }}
            >
              <IconBrandGithub size={20} />
            </ActionIcon>

            <ActionIcon
              variant="light"
              color={isDark ? 'blue.7' : 'blue'}
              size="lg"
              onClick={() => setSettingsOpened(true)}
              title="设置"
            >
              <IconSettings size={20} />
            </ActionIcon>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        <Container
          size="xl"
          style={{
            height: 'calc(100vh - 60px)',
            display: 'flex',
            flexDirection: 'column',
            padding: '20px',
          }}
        >
          <Paper
            shadow="xs"
            p="lg"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: '12px',
              border: `1px solid ${isDark ? '#2C2E33' : '#eee'}`,
              backgroundColor: isDark ? '#25262B' : '#fff',
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
                  opacity: 0.7,
                }}
              >
                <IconBrandOpenai size={60} stroke={1.5} color="#aaa" />
                <Text mt="md" size="xl" c="dimmed" ta="center" fw={500}>
                  DeepSeek AI 助手
                </Text>
                <Text size="sm" c="dimmed" mt="xs" maw={500} ta="center">
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
                  style={{ flex: 1, minHeight: 0 }}
                  isDark={isDark}
                />
              </Box>
            )}

            <ChatInput
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              onStopGeneration={stopGeneration}
            />
          </Paper>
        </Container>
      </AppShell.Main>

      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        settings={settings}
        onSettingsChange={updateSettings}
        isDark={isDark}
      />
    </AppShell>
  );
}
