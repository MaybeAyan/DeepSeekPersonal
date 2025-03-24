import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  AppShell,
  Container,
  Paper,
  Box,
  Title,
  Group,
  Text,
  ActionIcon,
  Button,
  useMantineTheme,
  ScrollArea,
  Burger,
  Overlay,
  Transition,
  Stack,
  LoadingOverlay,
} from '@mantine/core';
import { useMediaQuery, useLocalStorage } from '@mantine/hooks';
import { v4 as uuidv4 } from 'uuid';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { CompletionRequest, deepseekAPI } from '../api/deepseek';
import { ChatMessage, ChatSettings, Conversation } from '../types';
import { SettingsModal } from './SettingsModal';
import useConversations from '../hooks/useConversations';
import {
  IconBrandOpenai,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSettings,
  IconSun,
  IconMoon,
  IconBrandGithub,
  IconMessage,
  IconChevronLeft,
} from '@tabler/icons-react';

interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
}

export function Chat({ toggleColorScheme, colorScheme }: ChatProps) {
  // 状态管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [settings, setSettings] = useLocalStorage<ChatSettings>({
    key: 'chat-settings',
    defaultValue: {
      temperature: 0.7,
      maxTokens: 500,
      model: 'deepseek-chat',
      streamMode: true,
    },
  });

  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appReady, setAppReady] = useState(false);

  // 主题和响应式布局
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  const abortControllerRef = useRef<() => void | null>(null);

  // 会话管理
  const {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized: conversationsInitialized,
  } = useConversations();

  // 响应式布局处理
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile, isTablet]);

  // 初始化加载
  useEffect(() => {
    if (!conversationsInitialized || !isInitialLoad) return;

    if (conversations.length > 0) {
      // 按照更新时间排序，加载最新的对话
      const sortedConversations = [...conversations].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      setActiveConversation(sortedConversations[0]);
      setMessages(sortedConversations[0].messages || []);
      console.log('Loaded initial conversation:', sortedConversations[0].title);
    } else {
      // 只有当确实没有对话时才创建新对话
      const newConversation = createConversation();
      setActiveConversation(newConversation);
      setMessages([]);
      console.log('Created new conversation as none existed');
    }

    setIsInitialLoad(false);
    setAppReady(true);
  }, [
    conversations,
    conversationsInitialized,
    createConversation,
    isInitialLoad,
  ]);

  // 当 activeConversation 改变时，加载消息
  useEffect(() => {
    if (activeConversation && !isInitialLoad) {
      setMessages(activeConversation.messages || []);
    }
  }, [activeConversation, isInitialLoad]);

  // 自动保存当前会话
  useEffect(() => {
    if (activeConversation && messages.length > 0 && !isInitialLoad) {
      const timer = setTimeout(() => {
        updateConversation(activeConversation.id, {
          messages,
          updatedAt: Date.now(),
        });
      }, 1000); // 1秒防抖

      return () => clearTimeout(timer);
    }
  }, [messages, activeConversation, updateConversation, isInitialLoad]);

  // 组件卸载前保存
  useEffect(() => {
    return () => {
      if (activeConversation && messages.length > 0) {
        updateConversation(activeConversation.id, {
          messages,
          updatedAt: Date.now(),
        });
      }
    };
  }, [activeConversation, messages, updateConversation]);

  // 处理函数
  const updateSettings = useCallback(
    (newSettings: Partial<ChatSettings>) => {
      setSettings((prev) => ({ ...prev, ...newSettings }));
    },
    [setSettings]
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !activeConversation) return;

      // 如果这是第一条消息，使用它作为会话标题
      if (activeConversation.messages.length === 0) {
        // 截取前20个字符作为标题
        const newTitle =
          content.length > 20 ? content.substring(0, 20) + '...' : content;

        updateConversation(activeConversation.id, { title: newTitle });
      }

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
        timestamp: Date.now(),
      };

      // 更新消息列表
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      updateConversation(activeConversation.id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
      setIsLoading(true);

      // 如果是移动端，发送消息后自动关闭侧边栏
      if (isMobile) {
        setSidebarVisible(false);
      }

      // 准备请求参数
      const request: CompletionRequest = {
        prompt: content,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        model: settings.model,
      };

      try {
        // 如果使用流式模式，先创建一个空的助手回复
        let assistantMessageId = '';
        if (settings.streamMode) {
          assistantMessageId = uuidv4();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
            timestamp: Date.now(),
          };
          const updatedMessagesWithAssistant = [
            ...updatedMessages,
            assistantMessage,
          ];
          setMessages(updatedMessagesWithAssistant);
          updateConversation(activeConversation.id, {
            messages: updatedMessagesWithAssistant,
            updatedAt: Date.now(),
          });

          // 使用流式API
          const stopStream = deepseekAPI.postCompletionStream(
            request,
            (data) => {
              // 处理流式响应
              const delta = data.choices[0]?.delta?.content || '';
              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: msg.content + delta,
                    };
                  }
                  return msg;
                });

                updateConversation(activeConversation.id, {
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                });

                return updatedMessages;
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
                const updatedMessages = prevMessages.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: `Error: ${error.message}`,
                    };
                  }
                  return msg;
                });

                updateConversation(activeConversation.id, {
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                });

                return updatedMessages;
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

          const updatedMessagesWithAssistant = [
            ...updatedMessages,
            assistantMessage,
          ];
          setMessages(updatedMessagesWithAssistant);
          updateConversation(activeConversation.id, {
            messages: updatedMessagesWithAssistant,
            updatedAt: Date.now(),
          });
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

        const updatedMessagesWithError = [...updatedMessages, errorMessage];
        setMessages(updatedMessagesWithError);
        updateConversation(activeConversation.id, {
          messages: updatedMessagesWithError,
          updatedAt: Date.now(),
        });
        setIsLoading(false);
      }
    },
    [
      activeConversation,
      isMobile,
      isLoading,
      messages,
      settings,
      updateConversation,
    ]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleSelectConversation = useCallback(
    (conversation: Conversation) => {
      // 先保存当前对话的消息
      if (activeConversation && messages.length > 0) {
        updateConversation(activeConversation.id, {
          messages: messages,
          updatedAt: Date.now(),
        });
      }

      // 然后切换到新对话
      setActiveConversation(conversation);

      // 在移动设备上选择对话后自动关闭侧边栏
      if (isMobile) {
        setSidebarVisible(false);
      }
    },
    [activeConversation, isMobile, messages, updateConversation]
  );

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);

      // 如果删除的是当前活动对话，则切换到其他对话
      if (activeConversation?.id === id) {
        const remainingConversations = conversations.filter((c) => c.id !== id);
        if (remainingConversations.length > 0) {
          // 按更新时间排序选择最近的一个对话
          const sortedConversations = [...remainingConversations].sort(
            (a, b) => b.updatedAt - a.updatedAt
          );
          setActiveConversation(sortedConversations[0]);
        } else {
          // 如果没有剩余对话，创建一个新的
          const newConversation = createConversation();
          setActiveConversation(newConversation);
        }
      }
    },
    [activeConversation, conversations, createConversation, deleteConversation]
  );

  const handleCreateConversation = useCallback(() => {
    // 保存当前对话
    if (activeConversation && messages.length > 0) {
      updateConversation(activeConversation.id, {
        messages: messages,
        updatedAt: Date.now(),
      });
    }

    const newConversation = createConversation();
    setActiveConversation(newConversation);
    setMessages([]);
  }, [activeConversation, createConversation, messages, updateConversation]);

  // 渲染逻辑
  const sortedConversations = useMemo(() => {
    // 按更新时间排序，最新的在前面
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  if (!appReady) {
    return (
      <Box
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          backgroundColor: isDark ? '#141517' : '#f0f2f5',
        }}
      >
        <LoadingOverlay
          visible={true}
          overlayProps={{
            blur: 2,
          }}
          loaderProps={{ color: isDark ? 'blue.6' : 'blue.5', size: 'xl' }}
        />
      </Box>
    );
  }

  return (
    <AppShell
      padding={0}
      style={{ height: '100vh', overflow: 'hidden' }}
      header={{ height: 60 }}
    >
      <AppShell.Header
        style={{
          backgroundColor: isDark ? '#1A1B1E' : 'white',
          borderBottom: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
          zIndex: 200,
        }}
      >
        <Container
          size="100%"
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
          }}
        >
          <Group gap="sm">
            <Burger
              opened={sidebarVisible}
              onClick={() => setSidebarVisible(!sidebarVisible)}
              size="sm"
              color={isDark ? '#C1C2C5' : '#333'}
              mr="sm"
              display={isMobile || isTablet ? 'block' : 'none'}
            />
            <IconBrandOpenai size={28} color={isDark ? '#61AFEF' : '#5C7CFA'} />
            <Title
              order={3}
              style={{
                fontWeight: 600,
                color: isDark ? '#C1C2C5' : '#333',
              }}
            >
              DeepSeek Chat
            </Title>
          </Group>

          <Group gap="sm">
            <ActionIcon
              variant="subtle"
              size="lg"
              onClick={() => toggleColorScheme()}
              color={isDark ? 'gray.4' : 'gray.7'}
              radius="xl"
            >
              {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              size="lg"
              component="a"
              href="https://github.com/deepseek-ai/DeepSeek-Coder"
              target="_blank"
              color={isDark ? 'gray.4' : 'gray.7'}
              radius="xl"
            >
              <IconBrandGithub size={20} />
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color={isDark ? 'blue.6' : 'blue.5'}
              size="lg"
              onClick={() => setSettingsOpened(true)}
              radius="xl"
            >
              <IconSettings size={20} />
            </ActionIcon>
          </Group>
        </Container>
      </AppShell.Header>

      {/* 主容器 */}
      <AppShell.Main
        style={{
          backgroundColor: isDark ? '#141517' : '#f0f2f5',
          height: 'calc(100vh - 60px)',
          overflow: 'hidden',
          padding: '16px',
        }}
      >
        {/* 移动端侧边栏覆盖层 */}
        {isMobile && sidebarVisible && (
          <Overlay
            color={isDark ? '#000' : '#f0f0f0'}
            backgroundOpacity={0.5}
            zIndex={99}
            onClick={() => setSidebarVisible(false)}
          />
        )}

        {/* 弹性布局容器 - 包含侧边栏和聊天区域 */}
        <Box
          style={{
            height: 'calc(100vh - 100px)',
            display: 'flex',
            gap: 16,
            position: 'relative',
            marginTop: 60,
          }}
        >
          {/* 侧边栏对话列表 */}
          <Transition
            mounted={sidebarVisible}
            transition={isMobile ? 'slide-right' : 'fade'}
            duration={200}
          >
            {(styles) => (
              <Paper
                shadow="md"
                radius="lg"
                style={{
                  ...styles,
                  width: isMobile ? '100%' : isTablet ? '250px' : '300px',
                  flexShrink: 0,
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: isDark ? '#1A1B1E' : 'white',
                  position: isMobile ? 'absolute' : 'relative',
                  left: 0,
                  top: 0,
                  zIndex: 100,
                }}
              >
                {/* 侧边栏标题 */}
                <Box
                  p="md"
                  style={{
                    borderBottom: `1px solid ${isDark ? '#2C2E33' : '#eee'}`,
                  }}
                >
                  <Group justify="space-between" align="center">
                    <Title
                      order={5}
                      style={{ color: isDark ? '#C1C2C5' : '#333' }}
                    >
                      对话历史
                    </Title>
                    <Group>
                      {isMobile && (
                        <ActionIcon
                          variant="subtle"
                          onClick={() => setSidebarVisible(false)}
                          color={isDark ? 'gray.4' : 'gray.7'}
                        >
                          <IconChevronLeft size={18} />
                        </ActionIcon>
                      )}
                      <ActionIcon
                        variant="light"
                        color={isDark ? 'blue.7' : 'blue.5'}
                        radius="xl"
                        size="md"
                        onClick={handleCreateConversation}
                        title="新建对话"
                      >
                        <IconPlus size={16} />
                      </ActionIcon>
                    </Group>
                  </Group>
                </Box>

                {/* 对话列表滚动区域 */}
                <ScrollArea
                  style={{ flex: 1 }}
                  offsetScrollbars
                  scrollbarSize={6}
                >
                  <Stack p="md" gap="sm">
                    {sortedConversations.map((conversation) => {
                      const isActive =
                        activeConversation?.id === conversation.id;
                      return (
                        <Paper
                          key={conversation.id}
                          shadow={isActive ? 'sm' : 'none'}
                          p="sm"
                          radius="md"
                          withBorder={isActive}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isActive
                              ? isDark
                                ? '#25262B'
                                : '#f8f9fa'
                              : 'transparent',
                            borderColor: isActive
                              ? isDark
                                ? '#4c7afa'
                                : '#4c7afa'
                              : 'transparent',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => handleSelectConversation(conversation)}
                        >
                          <Group justify="space-between" wrap="nowrap">
                            <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                              <IconMessage
                                size={18}
                                color={
                                  isActive
                                    ? isDark
                                      ? '#4c7afa'
                                      : '#4c7afa'
                                    : isDark
                                    ? '#C1C2C5'
                                    : '#666'
                                }
                              />
                              <Text
                                lineClamp={1}
                                size="sm"
                                fw={isActive ? 600 : 400}
                                style={{
                                  color: isActive
                                    ? isDark
                                      ? '#C1C2C5'
                                      : '#333'
                                    : isDark
                                    ? '#C1C2C5'
                                    : '#666',
                                }}
                              >
                                {conversation.title}
                              </Text>
                            </Group>

                            {isActive && (
                              <Group gap={8}>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color={isDark ? 'gray.6' : 'gray.6'}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newTitle = prompt(
                                      '请输入新的会话标题',
                                      conversation.title
                                    );
                                    if (newTitle) {
                                      updateConversation(conversation.id, {
                                        title: newTitle,
                                      });
                                    }
                                  }}
                                  radius="xl"
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                <ActionIcon
                                  size="xs"
                                  variant="subtle"
                                  color="red"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteConversation(conversation.id);
                                  }}
                                  radius="xl"
                                >
                                  <IconTrash size={14} />
                                </ActionIcon>
                              </Group>
                            )}
                          </Group>
                        </Paper>
                      );
                    })}
                  </Stack>
                </ScrollArea>

                {/* 底部新建按钮 */}
                <Box
                  p="md"
                  style={{
                    borderTop: `1px solid ${isDark ? '#2C2E33' : '#eee'}`,
                  }}
                >
                  <Button
                    fullWidth
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateConversation}
                    variant={isDark ? 'light' : 'filled'}
                    color={isDark ? 'blue.7' : 'blue.5'}
                    radius="md"
                  >
                    新建对话
                  </Button>
                </Box>
              </Paper>
            )}
          </Transition>

          {/* 聊天区域 */}
          <Paper
            shadow="md"
            radius="lg"
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: isDark ? '#1A1B1E' : 'white',
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            {/* 聊天区域 - 消息显示 */}
            <Box
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                padding: '20px',
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

            {/* 聊天区域 - 输入框 */}
            <Box
              p="md"
              style={{
                borderTop: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
              }}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onStopGeneration={stopGeneration}
              />
            </Box>
          </Paper>
        </Box>
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
