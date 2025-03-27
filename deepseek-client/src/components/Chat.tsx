import {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
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
  Tooltip,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { v4 as uuidv4 } from 'uuid';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
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
  IconRobot,
  IconX,
} from '@tabler/icons-react';
import { extractBotIds, getPrimaryBotId } from '../utils/conversation';
import { npcAPI } from '../api';
import { Avatar } from '@mantine/core';
import { processGroupChatHistory } from '../utils/chatUtils';
interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  settings?: ChatSettings;
  updateSettings?: (settings: Partial<ChatSettings>) => void;
  customMessageRenderer?: (message: any) => React.ReactNode; // 自定义消息渲染器
  sendMessageToNpc?: (
    content: string,
    botId: string,
    conversationId: string,
    onUpdate?: (content: string, isCompleted: boolean) => void
  ) => void;
  stopNpcGeneration?: () => void;
}

export function Chat({
  toggleColorScheme,
  colorScheme,
  onLogout,
  settings,
  updateSettings = () => {},
  customMessageRenderer,
  sendMessageToNpc,
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

  const [botAvatars, setBotAvatars] = useState<Record<string, string>>({});
  const [botNames, setBotNames] = useState<Record<string, string>>({});

  // 1. 在组件顶部定义所需的状态和引用
  const [pendingBots, setPendingBots] = useState<string[]>([]);
  const [currentReplyingBot, setCurrentReplyingBot] = useState<string | null>(
    null
  );
  const completedBotsRef = useRef<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  const handleBotReplyRef = useRef<Function | null>(null);
  const messagesRef = useRef<ChatMessage[]>([]);
  const activeConversationRef = useRef<Conversation | null>(null);
  const lastUserMessageRef = useRef<string>('');

  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  const handleSelectBot = useCallback((botId: string) => {
    // 如果已选择，则取消选择；否则，选择该机器人
    setSelectedBot((prev) => (prev === botId ? null : botId));
  }, []);

  // 会话管理
  const {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized: conversationsInitialized,
    loadConversationMessages,
    fetchConversations,
  } = useConversations();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  const handleBotReply = useCallback(
    async (botId: string, content: string, conversationId: string) => {
      if (!botId || !content || !conversationId) {
        console.error('回复参数不完整', { botId, conversationId });
        return;
      }

      // 检查该机器人是否已经回复过这个问题
      if (completedBotsRef.current.has(botId)) {
        console.warn(`机器人 ${botId} 已经回复过此问题，跳过`);

        // 直接处理下一个机器人
        handleBotReplyCompleted(botId);
        return;
      }

      console.log(`开始获取机器人 ${botId} 的回复`);
      setCurrentReplyingBot(botId);
      setIsLoading(true);

      // 创建新的机器人回复消息
      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: Date.now(),
        bot_id: botId,
      };

      // 添加到消息列表
      setMessages((prev) => [...prev, assistantMessage]);

      const timeoutId = setTimeout(() => {
        if (!completedBotsRef.current.has(botId)) {
          console.warn(`机器人 ${botId} 回复超时，强制标记为完成`);
          completedBotsRef.current.add(botId);
          handleBotReplyCompleted(botId);
        }
      }, 30000); // 30秒超时保护

      // 添加内容停滞检测
      const contentStabilityCheckerId = setInterval(() => {
        const currentMessages = messagesRef.current;
        const currentMessage = currentMessages.find(
          (m) => m.id === assistantMessageId
        );

        if (
          currentMessage &&
          currentMessage.content &&
          currentMessage.content.length > 0
        ) {
          // 内容已经开始生成，可以清除这个计时器
          clearInterval(contentStabilityCheckerId);
        }
      }, 5000); // 每5秒检查一次

      // 调用API获取回复
      if (sendMessageToNpc) {
        let hasCompleted = false; // 本地标记，防止多次触发
        sendMessageToNpc(
          content,
          botId,
          conversationId,
          (updatedContent, isCompleted) => {
            // 更新消息内容
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: updatedContent }
                  : msg
              )
            );
            if (
              isCompleted &&
              !hasCompleted &&
              !completedBotsRef.current.has(botId)
            ) {
              console.log(`机器人 ${botId} 回复已完成，添加到已完成集合`);
              hasCompleted = true; // 本地标记已完成
              completedBotsRef.current.add(botId); // 记录此机器人已完成
              clearTimeout(timeoutId); // 清除超时保护
              clearInterval(contentStabilityCheckerId); // 清除内容稳定性检查
              handleBotReplyCompleted(botId); // 触发完成处理
            }
          }
        );
      } else {
        console.error('sendMessageToNpc 函数不可用');
        setIsLoading(false);
        clearTimeout(timeoutId);
        clearInterval(contentStabilityCheckerId);
      }

      return () => {
        clearTimeout(timeoutId);
        clearInterval(contentStabilityCheckerId);
      };
    },
    [sendMessageToNpc]
  );

  // 修改 handleBotReplyCompleted 函数，增强队列处理的可靠性
  const handleBotReplyCompleted = useCallback(
    (completedBotId: string) => {
      console.log(
        `机器人 ${completedBotId} 回复完成，准备处理下一个, 当前队列:`,
        pendingBots
      );

      // 重置当前回复的机器人
      setCurrentReplyingBot(null);
      setIsLoading(false); // 临时设置为非加载状态，避免UI卡住

      // 获取当前队列的快照，避免状态更新的竞态条件
      const currentPendingBots = [...pendingBots];

      // 检查是否还有等待回复的机器人
      if (currentPendingBots.length > 0) {
        // 获取下一个待处理的机器人
        const nextBot = currentPendingBots[0];

        // 检查下一个机器人是否已经回复过
        if (completedBotsRef.current.has(nextBot)) {
          console.warn(
            `下一个机器人 ${nextBot} 已经回复过，跳过并尝试后续机器人`
          );

          // 更新队列，移除已处理的机器人
          setPendingBots(currentPendingBots.slice(1));

          // 立即处理下一个机器人
          if (currentPendingBots.length > 1) {
            setTimeout(() => handleBotReplyCompleted(nextBot), 0);
          }
          return;
        }

        console.log(
          `处理下一个机器人: ${nextBot}, 剩余队列: ${currentPendingBots
            .slice(1)
            .join(',')}`
        );

        // 更新等待队列 - 移除将要处理的机器人
        setPendingBots(currentPendingBots.slice(1));

        const currentConversation = activeConversationRef.current;
        const userContent = lastUserMessageRef.current;

        // 延迟处理下一个机器人，确保状态已更新
        setTimeout(() => {
          if (currentConversation && nextBot) {
            console.log(`开始调用下一个机器人 ${nextBot} 的回复函数`);

            if (handleBotReplyRef.current) {
              // 通过引用调用函数，避免循环依赖
              handleBotReplyRef.current(
                nextBot,
                userContent,
                currentConversation.id
              );
            } else {
              // 如果引用不可用，直接调用
              console.warn('handleBotReplyRef不可用，直接调用handleBotReply');
              handleBotReply(nextBot, userContent, currentConversation.id);
            }
          } else {
            console.error('无法处理下一个机器人，参数不完整', {
              conversation: !!currentConversation,
              nextBot,
              pendingBots: currentPendingBots,
            });
          }
        }, 1000);
      } else {
        // 所有机器人都已回复完毕
        console.log('所有机器人都已完成回复，队列为空');
        setIsLoading(false);

        // 更新会话信息
        const currentConversation = activeConversationRef.current;
        if (currentConversation) {
          updateConversation(currentConversation.id, {
            updatedAt: Date.now(),
          });
        }
      }
    },
    [handleBotReply, pendingBots, updateConversation]
  );

  // 5. 用户发送消息处理函数
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !activeConversation) return;

      // 保存用户消息内容到引用，供后续机器人回复使用
      lastUserMessageRef.current = content;

      // 获取所有可用机器人
      try {
        const availableBots = await npcAPI.getBotList();

        // 过滤出有效的机器人ID
        let botIds = availableBots
          .filter((bot) => bot.bot_id)
          .map((bot) => bot.bot_id);

        // 确保机器人ID不重复
        botIds = [...new Set(botIds)];

        if (selectedBot) {
          console.log(`只让指定机器人回复: ${selectedBot}`);
          botIds = [selectedBot];
        } else {
          console.log(`将依次让这些机器人回复: ${botIds.join(', ')}`);
        }

        if (botIds.length === 0) {
          console.error('没有可用的机器人');
          return;
        }

        // 创建并添加用户消息
        const userMessage: ChatMessage = {
          id: uuidv4(),
          role: 'user',
          content,
          created_at: Date.now(),
          bot_id: '',
        };

        // 发送新消息前清空之前的状态
        completedBotsRef.current.clear();
        setPendingBots([]);
        setCurrentReplyingBot(null);

        // 更新消息列表，只添加用户消息
        setMessages((prev) => [...prev, userMessage]);

        // 等待状态更新
        setTimeout(() => {
          // 设置待回复的机器人队列 (从第二个开始)
          if (botIds.length > 1) {
            setPendingBots(botIds.slice(1));
            console.log(`设置待回复机器人队列: ${botIds.slice(1).join(', ')}`);
          }

          // 开始第一个机器人的回复
          if (botIds.length > 0) {
            handleBotReply(botIds[0], content, activeConversation.id);
          }
        }, 200); // 增加延迟，确保状态更新完成
      } catch (error) {
        console.error('获取机器人列表失败:', error);
      }
    },
    [isLoading, activeConversation, selectedBot, handleBotReply]
  );

  useEffect(() => {
    // 每次 handleBotReply 变化时，更新引用
    handleBotReplyRef.current = handleBotReply;
  }, [handleBotReply]);

  // 处理退出确认
  const handleLogoutConfirm = () => {
    setLogoutModalOpen(false);
    onLogout();
  };

  // 主题和响应式布局
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  const abortControllerRef = useRef<() => void | null>(null);

  // 创建 ref 跟踪最后加载的会话ID
  const lastLoadedConversationRef = useRef<string | null>(null);

  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      if (!conversation) return;

      try {
        setIsLoading(true);
        lastLoadedConversationRef.current = conversation.id;

        // 加载消息
        const messages = await loadConversationMessages(conversation.id);

        // 提取bot_id信息
        const botIds = extractBotIds(messages || []);
        const primaryBotId = getPrimaryBotId(messages || []);

        console.log(
          `会话 ${conversation.id} 包含角色: ${botIds.join(', ')}, 主要角色: ${
            primaryBotId || '未知'
          }`
        );

        // 保存带有bot_id信息的增强版会话
        const enrichedConversation = {
          ...conversation,
          botIds,
          primaryBotId,
        };

        setActiveConversation(enrichedConversation);

        const processedMessages = processGroupChatHistory(messages || []);

        // 排序消息
        const sortedMessages = processedMessages
          ? [...processedMessages].sort((a, b) => {
              if (a.created_at && b.created_at) {
                return a.created_at - b.created_at;
              }
              return 0;
            })
          : [];

        setMessages(sortedMessages || []);

        if (isMobile) {
          setSidebarVisible(false);
        }
      } catch (error) {
        console.error('加载会话消息失败:', error);
        lastLoadedConversationRef.current = null;
      } finally {
        setIsLoading(false);
      }
    },
    [isMobile, loadConversationMessages]
  );

  const sortedConversations = useMemo(() => {
    // 添加条件判断和更多日志
    if (!conversations) {
      console.log('会话列表不存在');
      return [];
    }

    if (conversations.length === 0) {
      console.log('会话列表为空');
      return [];
    }

    console.log('计算排序后的对话列表, 原始数量:', conversations.length);

    // 添加额外的检查确保每个对象有 updatedAt 属性
    const validConversations = conversations.filter((c) => {
      if (c && typeof c.updatedAt === 'number') {
        return true;
      }
      console.warn('发现无效的会话对象:', c);
      return false;
    });

    // 按更新时间排序，最新的在前面
    const sorted = [...validConversations].sort(
      (a, b) => b.updatedAt - a.updatedAt
    );
    console.log('排序后的对话列表数量:', sorted.length);

    return sorted;
  }, [conversations]);

  useLayoutEffect(() => {
    if (appReady && sortedConversations.length > 0 && !activeConversation) {
      console.log(
        'layout effect: 检测到会话列表有数据但无选中会话，自动选择第一条'
      );
      handleSelectConversation(sortedConversations[0]);
    }
  }, [
    appReady,
    sortedConversations,
    activeConversation,
    handleSelectConversation,
  ]);

  // 响应式布局处理
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile, isTablet]);

  // 监听 conversations 变化，确保列表更新时界面同步
  useEffect(() => {
    console.log('会话列表已更新, 数量:', conversations.length);

    // 如果有会话但没有当前选中的会话，选择第一个
    if (conversations.length > 0 && !activeConversation && appReady) {
      const sortedConvs = [...conversations].sort(
        (a, b) => b.updatedAt - a.updatedAt
      );
      handleSelectConversation(sortedConvs[0]);
    }
  }, [conversations, activeConversation, appReady, handleSelectConversation]);

  const hasInitialized = useRef(false);
  // 修改初始加载对话逻辑，确保数据加载完成后才显示
  useEffect(() => {
    if (!conversationsInitialized || hasInitialized.current) {
      return;
    }

    hasInitialized.current = true;

    console.log('会话数据初始化');

    // 一次性请求数据
    (async () => {
      setIsLoading(true);
      try {
        // 使用 force 和 immediate 参数确保请求执行
        await fetchConversations(true, true);

        setIsInitialLoad(false);
        setAppReady(true);

        // 计时器添加到异步函数内部
        const timeoutId = setTimeout(() => {
          if (isLoading) {
            console.log('加载超时保护触发');
            setIsLoading(false);
          }
        }, 5000);

        return () => clearTimeout(timeoutId);
      } catch (error) {
        console.error('初始化失败:', error);
        setIsInitialLoad(false);
        setAppReady(true);
        setIsLoading(false);
      }
    })();
  }, [conversationsInitialized, fetchConversations, isLoading]);

  // 当 activeConversation 改变时，加载消息
  useEffect(() => {
    if (activeConversation && !isInitialLoad) {
      console.log(
        'activeConversation变化，从服务器加载消息:',
        activeConversation.id
      );

      if (lastLoadedConversationRef.current === activeConversation.id) {
        console.log(
          '会话已经在点击时加载过消息，跳过重复请求:',
          activeConversation.id
        );
        return;
      }

      loadConversationMessages(activeConversation.id)
        .then((messages) => {
          console.log('服务器返回消息数量:', messages?.length || 0);
          const sortedMessages = messages
            ? [...messages].sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return a.created_at - b.created_at;
                }
                // 否则保持原有顺序，假设服务端已按正确顺序返回
                return 0;
              })
            : [];
          setMessages(sortedMessages || []);
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

  // 修改获取机器人列表的逻辑
  const botListInitializedRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    // 添加局部标记防止重复请求
    if (conversationsInitialized && !botListInitializedRef.current) {
      // 标记为已经初始化
      botListInitializedRef.current = true;
      npcAPI
        .getBotList(true)
        .then((bots) => {
          const avatarMap: Record<string, string> = {};
          const nameMap: Record<string, string> = {};

          bots.forEach((bot) => {
            if (bot.bot_id && bot.icon_url) {
              avatarMap[bot.bot_id] = bot.icon_url;
            }
            if (bot.bot_name) {
              nameMap[bot.bot_id] = bot.bot_name;
            }
          });

          console.log(
            '机器人头像和名称映射已创建, 数量:',
            Object.keys(avatarMap).length
          );
          setBotAvatars(avatarMap);
          setBotNames(nameMap);
        })
        .catch((error) => {
          console.error('获取角色列表失败:', error);
        });
    }
  }, [conversationsInitialized]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
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
    try {
      setIsLoading(true);
      const newConversation = await createConversation();
      setActiveConversation(newConversation);
      setMessages([]);

      if (isMobile) setSidebarVisible(false);
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [createConversation, isMobile]);

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

            {/* <ActionIcon
              variant="subtle"
              color={isDark ? 'blue.6' : 'blue.5'}
              size="lg"
              onClick={() => setSettingsOpened(true)}
              radius="xl"
            >
              <IconSettings size={20} />
            </ActionIcon> */}

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
                      会话列表
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
                    {sortedConversations.length > 0 ? (
                      sortedConversations.map((conversation) => {
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
                            onClick={() =>
                              handleSelectConversation(conversation)
                            }
                          >
                            {/* 会话项内容 */}
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
                                  {conversation.title || '新对话'}
                                </Text>
                              </Group>
                              {/* 操作按钮 */}
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
                      })
                    ) : (
                      <Box style={{ textAlign: 'center', padding: '20px 0' }}>
                        <Text size="sm" color="dimmed">
                          没有对话记录
                        </Text>
                        <Button
                          variant="light"
                          size="sm"
                          onClick={handleCreateConversation}
                          mt="md"
                        >
                          开始新对话
                        </Button>
                      </Box>
                    )}
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
                    {!activeConversation
                      ? '请选择或创建一个对话'
                      : '开始新的对话'}
                  </Text>
                  <Text
                    size="sm"
                    c={isDark ? 'gray.5' : 'gray.6'}
                    mt="md"
                    maw={450}
                    ta="center"
                    px="lg"
                  >
                    {!activeConversation
                      ? '从左侧列表选择一个已有对话，或创建一个新对话'
                      : '开始提问或聊天。AI将为您提供帮助'}
                  </Text>

                  {!activeConversation && (
                    <Button
                      variant="light"
                      color="blue"
                      mt="xl"
                      onClick={handleCreateConversation}
                    >
                      创建新对话
                    </Button>
                  )}
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
                    botAvatars={botAvatars}
                    botNames={botNames}
                  />

                  {/* 添加机器人选择器 */}
                  <Paper
                    p="xs"
                    radius="md"
                    style={{
                      marginTop: '8px',
                      marginBottom: '4px',
                      backgroundColor: isDark ? '#25262B' : '#f8f9fa',
                      borderTop: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
                    }}
                  >
                    <Box>
                      <Group justify="apart">
                        <Text size="xs" c={isDark ? 'gray.5' : 'gray.7'}>
                          {selectedBot
                            ? '已选择指定机器人回复'
                            : '所有机器人将依次回复'}
                        </Text>
                        {selectedBot && (
                          <ActionIcon
                            size="xs"
                            variant="subtle"
                            onClick={() => setSelectedBot(null)}
                            title="清除选择"
                          >
                            <IconX size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                      <ScrollArea scrollbarSize={4} mt={6}>
                        <Group gap={8}>
                          {Object.entries(botAvatars).map(
                            ([botId, avatarUrl]) => (
                              <Tooltip
                                key={botId}
                                label={
                                  botNames[botId] || `Bot ${botId.slice(0, 6)}`
                                }
                                position="top"
                                withArrow
                              >
                                <Box>
                                  <Avatar
                                    src={avatarUrl}
                                    size="md"
                                    radius="xl"
                                    style={{
                                      cursor: 'pointer',
                                      border:
                                        selectedBot === botId
                                          ? `2px solid ${
                                              isDark ? '#4c7afa' : '#5C7CFA'
                                            }`
                                          : 'none',
                                      opacity:
                                        selectedBot && selectedBot !== botId
                                          ? 0.5
                                          : 1,
                                      transition: 'all 0.2s ease',
                                    }}
                                    onClick={() => handleSelectBot(botId)}
                                  >
                                    <IconRobot size={20} />
                                  </Avatar>
                                </Box>
                              </Tooltip>
                            )
                          )}
                        </Group>
                      </ScrollArea>
                    </Box>
                  </Paper>
                </Box>
              )}
            </Box>

            {/* 输入框区域 */}
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
                disabled={!activeConversation}
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
