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
  Modal,
  LoadingOverlay,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { v4 as uuidv4 } from 'uuid';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { NpcBotList } from './npc/NpcBotList';
import { npcAPI, NpcBot } from '../api/npc';
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
  IconMessage,
  IconChevronLeft,
  IconLogout,
} from '@tabler/icons-react';
interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  // 新增NPC相关属性
  bots?: NpcBot[];
  botsLoading?: boolean;
  botsError?: string | null;
  selectedBot?: NpcBot | null;
  onSelectBot?: (bot: NpcBot) => void;
  fetchBots?: () => void;
  npcMessages?: Array<{
    id: string;
    content: string;
    role: 'user' | 'assistant';
    botId?: string; // 添加 botId
    botName?: string; // 添加 botName
  }>;
  npcLoading?: boolean;
  sendMessageToNpc?: (
    content: string,
    botId: string,
    conversationId: string
  ) => void; // 修改 sendMessageToNpc
  stopNpcGeneration?: () => void;
  settings?: ChatSettings;
  updateSettings?: (settings: Partial<ChatSettings>) => void;
  extraActions?: React.ReactNode; // 添加额外的操作按钮
  customMessageRenderer?: (message: any) => React.ReactNode; // 自定义消息渲染器
  activeBots?: string[]; // 添加 activeBots
  onSetActiveBots?: (botIds: string[]) => void; // 添加 onSetActiveBots
}

export function Chat({
  toggleColorScheme,
  colorScheme,
  onLogout,
  bots = [],
  botsLoading = false,
  botsError = null,
  selectedBot = null,
  onSelectBot = () => {},
  fetchBots = () => {},
  npcMessages = [],
  npcLoading = false,
  sendMessageToNpc = () => {},
  stopNpcGeneration = () => {},
  settings,
  updateSettings = () => {},
  customMessageRenderer,
}: ChatProps) {
  // 状态管理
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [appReady, setAppReady] = useState(false);
  // 控制退出确认弹窗
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  // 处理退出确认
  const handleLogoutConfirm = () => {
    setLogoutModalOpen(false);
    onLogout();
  };

  // 如果有传入npcMessages，则使用这些消息替代本地的messages
  useEffect(() => {
    if (npcMessages && npcMessages.length > 0) {
      // 将npcMessages格式转换为本地messages格式
      const formattedMessages = npcMessages.map((msg) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: Date.now(), // 使用当前时间作为时间戳
      }));
      setMessages(formattedMessages);
    }
  }, [npcMessages]);

  const [allNpcBots, setAllNpcBots] = useState<NpcBot[]>([]);
  const [npcBotsLoading, setNpcBotsLoading] = useState(false);
  const [npcBotsError, setNpcBotsError] = useState<string | null>(null);

  // 选择机器人的函数
  const handleSelectBot = useCallback(
    (bot: NpcBot) => {
      console.log('选择角色:', bot.bot_name);
      onSelectBot(bot);
    },
    [onSelectBot]
  );

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
    loadConversationMessages, // 添加这个函数
    fetchConversations, // 添加这个函数
  } = useConversations();

  // 响应式布局处理
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile, isTablet]);

  // 获取角色列表 - 使用 ref 跟踪是否已加载
  const hasLoadedBotsRef = useRef(false);

  // 获取角色列表
  useEffect(() => {
    // 只在组件首次挂载且没有加载过时获取
    if (
      bots.length === 0 &&
      !npcBotsLoading &&
      !botsError &&
      !hasLoadedBotsRef.current
    ) {
      console.log('主动获取NPC机器人列表 - 首次加载');
      hasLoadedBotsRef.current = true;
      setNpcBotsLoading(true);

      // 使用setTimeout防止React严格模式下的双重加载问题
      const timerId = setTimeout(() => {
        npcAPI
          .getBotList()
          .then((data) => {
            console.log('获取到NPC机器人列表:', data.length);
            setAllNpcBots(data);

            // 如果有机器人但没有选中的机器人，自动选择第一个
            if (data.length > 0 && !selectedBot) {
              console.log('自动选择第一个机器人:', data[0].bot_name);
              handleSelectBot(data[0]);
            }
          })
          .catch((err) => {
            console.error('获取NPC机器人列表失败:', err);
            setNpcBotsError('获取角色列表失败');
          })
          .finally(() => {
            setNpcBotsLoading(false);
          });
      }, 100);

      return () => clearTimeout(timerId);
    }
  }, [
    bots,
    npcBotsLoading,
    botsError,
    selectedBot,
    handleSelectBot,
    allNpcBots,
  ]);

  // 初始加载对话
  useEffect(() => {
    if (!conversationsInitialized || !isInitialLoad) return;

    console.log('开始初始加载对话', {
      conversationsInitialized,
      isInitialLoad,
      conversationsLength: conversations.length,
    });

    // 设置加载超时保护，确保页面不会无限加载
    const timeoutId = setTimeout(() => {
      if (!appReady) {
        console.log('加载超时，强制设置应用就绪状态');
        setIsInitialLoad(false);
        setAppReady(true);
      }
    }, 5000); // 5秒超时保护

    const loadInitialConversation = async () => {
      try {
        if (conversations.length > 0) {
          // 按照更新时间排序，加载最新的对话
          const sortedConversations = [...conversations].sort(
            (a, b) => b.updatedAt - a.updatedAt
          );

          console.log('初始化选择的对话:', sortedConversations[0].id);
          setActiveConversation(sortedConversations[0]);

          try {
            const messages = await loadConversationMessages(
              sortedConversations[0].id
            );
            setMessages(messages || []);
            console.log('成功加载初始对话:', sortedConversations[0].title);
          } catch (err) {
            console.error('加载初始对话消息失败:', err);
            setMessages([]);
          }
        }
      } catch (err) {
        console.error('初始化对话过程中出错:', err);
      } finally {
        setIsInitialLoad(false);
        setAppReady(true);
        clearTimeout(timeoutId);
      }
    };

    loadInitialConversation();

    return () => clearTimeout(timeoutId);
  }, [
    appReady,
    conversations,
    conversationsInitialized,
    createConversation,
    isInitialLoad,
    loadConversationMessages,
  ]);

  // 在 useEffect 中打印状态
  useEffect(() => {
    console.log('Chat 组件状态:', {
      conversations: conversations.length,
      bots: bots.length,
      allNpcBots: allNpcBots.length,
      activeConversation: activeConversation?.id,
    });
  }, [conversations, bots, allNpcBots, activeConversation]);

  // 当 activeConversation 改变时，加载消息
  useEffect(() => {
    if (activeConversation && !isInitialLoad) {
      console.log(
        'activeConversation变化，从服务器加载消息:',
        activeConversation.id
      );
      loadConversationMessages(activeConversation.id)
        .then((messages) => {
          console.log('服务器返回消息数量:', messages?.length || 0);
          setMessages(messages || []);
        })
        .catch((err) => {
          console.error('加载消息失败:', err);
          setMessages([]);
        });
    }
  }, [activeConversation, isInitialLoad, loadConversationMessages]);

  const originSetting: ChatSettings = {
    temperature: 0.7,
    maxTokens: 500,
    model: 'deepseek-coder',
    streamMode: true,
  };

  const handleSendMessage = useCallback(
    async (content: string) => {
      // 如果传入了sendMessageToNpc和npcMessages，则使用NPC聊天功能
      if (
        sendMessageToNpc &&
        npcMessages &&
        selectedBot &&
        activeConversation
      ) {
        sendMessageToNpc(content, selectedBot.bot_id, activeConversation.id);
        return;
      }

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
      };

      // 更新消息列表
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // 只更新对话标题和时间戳，不保存messages
      updateConversation(activeConversation.id, {
        updatedAt: Date.now(),
        // 如果是第一条消息，更新标题
        ...(activeConversation.messages.length === 0
          ? {
              title:
                content.length > 20
                  ? content.substring(0, 20) + '...'
                  : content,
            }
          : {}),
      });

      setIsLoading(true);

      // 如果是移动端，发送消息后自动关闭侧边栏
      if (isMobile) {
        setSidebarVisible(false);
      }

      // 准备请求参数
      const request: CompletionRequest = {
        prompt: content,
        temperature: settings?.temperature,
        max_tokens: settings?.maxTokens,
        model: settings?.model,
      };

      try {
        // 如果使用流式模式，先创建一个空的助手回复
        let assistantMessageId = '';
        if (settings?.streamMode) {
          assistantMessageId = uuidv4();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
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

                // updateConversation(activeConversation.id, {
                //   messages: updatedMessages,
                //   updatedAt: Date.now(),
                // });

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
      sendMessageToNpc,
      npcMessages,
      selectedBot,
      isLoading,
      activeConversation,
      messages,
      updateConversation,
      isMobile,
      settings?.temperature,
      settings?.maxTokens,
      settings?.model,
      settings?.streamMode,
    ]
  );

  const stopGeneration = useCallback(() => {
    // 如果传入了stopNpcGeneration，则使用NPC停止功能
    if (stopNpcGeneration && npcMessages) {
      stopNpcGeneration();
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, [stopNpcGeneration, npcMessages]);

  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      if (!conversation) {
        console.warn('尝试选择空对话');
        return;
      }

      console.log('选择对话:', conversation.id);
      try {
        // 显示加载状态
        setIsLoading(true);

        // 先设置当前选中的对话对象，使UI立即响应
        setActiveConversation(conversation);

        // 从服务器加载选中对话的消息
        console.log('正在加载选中对话的消息...');
        const messages = await loadConversationMessages(conversation.id);
        console.log('加载到消息数量:', messages?.length || 0);

        // 确保在获取消息后再更新消息状态
        setMessages(messages || []);

        // 在移动设备上选择对话后自动关闭侧边栏
        if (isMobile) {
          setSidebarVisible(false);
        }
      } catch (error) {
        console.error('加载会话消息失败:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [isMobile, loadConversationMessages]
  );

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);

      // 删除对话后重新获取对话列表
      await fetchConversations();

      // 如果删除的是当前活动对话，则切换到其他对话
      if (activeConversation?.id === id) {
        if (conversations.length > 0) {
          // 按更新时间排序选择最近的一个对话
          const remainingConversations = conversations.filter(
            (c) => c.id !== id
          );
          if (remainingConversations.length > 0) {
            const sortedConversations = [...remainingConversations].sort(
              (a, b) => b.updatedAt - a.updatedAt
            );
            await handleSelectConversation(sortedConversations[0]);
          } else {
            // 如果没有剩余对话，创建一个新的
            const newConversation = await createConversation();
            setActiveConversation(newConversation);
            setMessages([]);
          }
        } else {
          // 如果没有对话，创建一个新的
          const newConversation = await createConversation();
          setActiveConversation(newConversation);
          setMessages([]);
        }
      }
    },
    [
      activeConversation,
      conversations,
      createConversation,
      deleteConversation,
      fetchConversations,
      handleSelectConversation,
    ]
  );

  const handleCreateConversation = useCallback(async () => {
    // 保存当前对话
    // if (activeConversation && messages.length > 0) {
    //   updateConversation(activeConversation.id, {
    //     messages: messages,
    //     updatedAt: Date.now(),
    //   });
    // }

    const newConversation = await createConversation();
    setActiveConversation(newConversation);
    setMessages([]);
  }, [createConversation]);

  const sortedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      console.log('没有对话可排序');
      return [];
    }

    console.log('计算排序后的对话列表:', conversations.length);
    // 按更新时间排序，最新的在前面
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    console.log('排序后的对话列表数量:', sorted.length);
    return sorted;
  }, [conversations]);

  const npcBotListMemo = useMemo(() => {
    if (isMobile && sidebarVisible) return null;

    // 调试输出
    console.log('角色列表渲染状态:', {
      botsLength: bots.length,
      allNpcBotsLength: allNpcBots.length,
      isMobile,
      sidebarVisible,
      botsLoading,
      npcBotsLoading,
      botsError,
      npcBotsError,
    });

    const botsToRender = bots.length > 0 ? bots : allNpcBots;

    return (
      <NpcBotList
        bots={botsToRender}
        loading={bots.length > 0 ? botsLoading : npcBotsLoading}
        error={bots.length > 0 ? botsError : npcBotsError}
        isDark={isDark}
        onSelectBot={handleSelectBot}
        selectedBotId={selectedBot?.bot_id}
        onRefresh={() => {
          if (npcBotsLoading) return;
          console.log('手动刷新机器人列表');
          setNpcBotsLoading(true);

          npcAPI
            .getBotList()
            .then((data) => {
              console.log('获取到角色列表:', data.length);
              setAllNpcBots(data);
              setNpcBotsError(null);
            })
            .catch((err) => {
              setNpcBotsError('获取角色列表失败');
              console.error(err);
            })
            .finally(() => {
              setNpcBotsLoading(false);
            });
        }}
      />
    );
  }, [
    sidebarVisible,
    isMobile,
    bots,
    allNpcBots,
    botsLoading,
    npcBotsLoading,
    botsError,
    npcBotsError,
    isDark,
    handleSelectBot,
    selectedBot,
  ]);

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
              AI 智能体
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
              color={isDark ? 'blue.6' : 'blue.5'}
              size="lg"
              onClick={() => setSettingsOpened(true)}
              radius="xl"
            >
              <IconSettings size={20} />
            </ActionIcon>

            <ActionIcon
              variant="subtle"
              color={isDark ? 'red.6' : 'red.5'}
              size="lg"
              onClick={() => setLogoutModalOpen(true)}
              radius="xl"
            >
              <IconLogout size={20} />
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

          {/* 添加角色列表 - 当不是移动端且侧边栏可见时显示 */}
          {npcBotListMemo}

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
                padding: '10px',
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
                    智能体互动聊天
                  </Text>
                  <Text
                    size="sm"
                    c={isDark ? 'gray.5' : 'gray.6'}
                    mt="md"
                    maw={450}
                    ta="center"
                    px="lg"
                  >
                    开始与 角色 进行对话。你可以询问任何问题、聊天对话或者互动
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
                    customRenderer={customMessageRenderer}
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
                isLoading={npcLoading || isLoading}
                onStopGeneration={stopGeneration}
              />
            </Box>
          </Paper>
        </Box>
      </AppShell.Main>

      {/* 退出确认弹窗 */}
      <Modal
        opened={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        centered
        radius="md"
        padding="xl"
        withCloseButton={false}
        overlayProps={{
          opacity: 0.55,
          blur: 3,
        }}
        style={{
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <Title order={3} mb="xl">
            确认退出登录
          </Title>

          <Text size="md" mb="xl" c={isDark ? 'gray.4' : 'gray.7'}>
            您确定要退出当前账户吗？可以随时重新登录。
          </Text>

          <Group gap="md" w="100%" mt="md">
            <Button
              variant={isDark ? 'default' : 'outline'}
              size="md"
              style={{ flex: 1 }}
              onClick={() => setLogoutModalOpen(false)}
            >
              取消
            </Button>
            <Button
              color="red"
              size="md"
              style={{ flex: 1 }}
              onClick={handleLogoutConfirm}
            >
              确认退出
            </Button>
          </Group>
        </Box>
      </Modal>

      <SettingsModal
        opened={settingsOpened}
        onClose={() => setSettingsOpened(false)}
        settings={settings || originSetting}
        onSettingsChange={updateSettings}
        isDark={isDark}
      />
    </AppShell>
  );
}
