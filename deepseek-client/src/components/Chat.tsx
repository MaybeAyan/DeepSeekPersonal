import React, { memo, useEffect } from 'react';
import {
  AppShell,
  Container,
  Paper,
  Box,
  Title,
  Group,
  ActionIcon,
  Button,
  Overlay,
  Transition,
  Stack,
  Modal,
  LoadingOverlay,
  Tooltip,
  Menu,
  Text,
  Avatar,
  ScrollArea,
  Burger,
} from '@mantine/core';
import {
  IconBrandOpenai,
  IconEdit,
  IconTrash,
  IconPlus,
  IconSun,
  IconMoon,
  IconMessage,
  IconChevronLeft,
  IconLogout,
  IconRobot,
  IconX,
  IconPhotoEdit,
  IconPhoto,
} from '@tabler/icons-react';
import { MessageList } from './chat/MessageList';
import { ChatInput } from './chat/ChatInput';
import { SettingsModal } from './SettingsModal';
import { NpcBotList } from './npc/NpcBotList';
import { ImageGallery } from './chat/ImageGallery';
import { ChatMessage, ChatSettings } from '../types';
import { NpcBot, npcAPI } from '../api';

// 导入自定义钩子
import useConversations from '../hooks/useConversations';
import { useChatBackground } from '../hooks/useChatBackground';
import { useChatUI } from '../hooks/useChatUI';
import { useMessageHandling } from '../hooks/useMessageHandling';
import { useBotData } from '../hooks/useBotData';
import { useAppInitialization } from '../hooks/useAppInitialization';
import { useChatConversation } from '../hooks/useChatConversation';

interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  settings?: ChatSettings;
  updateSettings?: (settings: Partial<ChatSettings>) => void;
  customMessageRenderer?: (message: ChatMessage) => React.ReactNode;
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
  // 使用UI状态钩子
  const {
    sidebarVisible,
    setSidebarVisible,
    logoutModalOpen,
    setLogoutModalOpen,
    settingsOpened,
    setSettingsOpened,
    selectedBot,
    handleSelectBot,
    isDark,
    isMobile,
    isTablet,
    handleLogoutConfirm,
  } = useChatUI(colorScheme);

  // 为isLoading状态创建独立的状态管理
  const [isLoading, setIsLoading] = React.useState(false);

  // 使用会话数据钩子
  const {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized: conversationsInitialized,
    loadConversationMessages,
    fetchConversations,
  } = useConversations();

  // 使用机器人数据钩子
  const {
    botAvatars,
    botNames,
    botDecs,
    nameToIdMap,
    loadBotData,
    updateBotData,
  } = useBotData();

  // 使用背景图片钩子
  const {
    chatBgImage,
    handleBgImageSelect,
    handleRemoveBgImage,
    handleBgImageUpload,
  } = useChatBackground();

  // 使用初始化钩子
  const {
    appReady,
    initializationStageRef,
    hasInitializedRef,
    checkAndFinishLoading,
  } = useAppInitialization({
    conversationsInitialized,
    loadBotData,
    setIsLoading,
  });

  // 创建一个消息设置的占位符
  const messagesSetter = React.useCallback((messages: ChatMessage[]) => {
    // 在会话钩子初始化时此函数不会被调用，只是为了满足类型需要
    console.log('Messages setter placeholder', messages.length);
  }, []);

  // 初始化会话钩子
  const {
    activeConversation,
    sortedConversations,
    handleSelectConversation,
    handleCreateConversation,
    handleDeleteConversation,
  } = useChatConversation({
    conversations,
    createConversation,
    deleteConversation,
    loadConversationMessages,
    fetchConversations,
    isMobile,
    setSidebarVisible,
    setIsLoading,
    setMessages: messagesSetter,
    appReady,
    initializationStageRef,
    checkAndFinishLoading,
  });

  // 使用消息处理钩子
  const { messages, handleSendMessage, stopGeneration } = useMessageHandling({
    activeConversation,
    selectedBot,
    sendMessageToNpc,
    initialMessages: activeConversation?.messages || [],
  });

  // 初始化逻辑 - 在此仅做必要的数据加载
  useEffect(() => {
    if (
      conversationsInitialized &&
      hasInitializedRef.current &&
      !hasInitializedRef.current.conversations
    ) {
      hasInitializedRef.current.conversations = true;
      setIsLoading(true);

      loadBotData(true).catch((error) => {
        console.error('加载机器人数据失败', error);
        setIsLoading(false);
      });
    }
  }, [conversationsInitialized, loadBotData, hasInitializedRef, setIsLoading]);

  // 应用未就绪时显示加载画面
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
          overlayProps={{ blur: 2 }}
          loaderProps={{ color: isDark ? 'blue.6' : 'blue.5', size: 'xl' }}
        />
      </Box>
    );
  }

  // 将MessageList组件记忆化，避免不必要的重渲染
  const MemoizedMessageList = memo(MessageList);

  // 处理选择机器人
  const handleBotSelection = (bot: NpcBot) => {
    if (bot && bot.bot_id) {
      handleSelectBot(bot.bot_id);
    }
  };

  // 安全设置标题
  const handleSetTitle = (conversationId: string, currentTitle?: string) => {
    const newTitle = prompt('请输入新的会话标题', currentTitle || '');
    if (newTitle) {
      updateConversation(conversationId, { title: newTitle });
    }
  };

  return (
    <AppShell
      padding={0}
      style={{ height: '100vh', overflow: 'hidden' }}
      header={{ height: 60 }}
    >
      {/* 应用头部 */}
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
              color={isDark ? '#E6E6E7' : '#333'}
              mr="sm"
              display={isMobile || isTablet ? 'block' : 'none'}
            />
            <IconBrandOpenai size={28} color={isDark ? '#61AFEF' : '#5C7CFA'} />
            <Title
              order={3}
              style={{ fontWeight: 600, color: isDark ? '#E6E6E7' : '#333' }}
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
          {/* 移动端侧边栏覆盖层 */}
          {isMobile && sidebarVisible && (
            <Overlay
              color={isDark ? '#000' : '#f0f0f0'}
              backgroundOpacity={0.5}
              zIndex={99}
              onClick={() => setSidebarVisible(false)}
            />
          )}

          {/* 侧边栏对话列表 */}
          <Transition
            mounted={sidebarVisible}
            transition={isMobile ? 'slide-right' : 'fade'}
            duration={200}
          >
            {(styles) => (
              <Box
                style={{
                  ...styles,
                  display: 'flex',
                  gap: 12,
                  width: isMobile ? '100%' : 'auto',
                  position: isMobile ? 'absolute' : 'relative',
                  zIndex: 100,
                  left: 0,
                  top: 0,
                }}
              >
                {/* 会话列表面板 */}
                <Paper
                  shadow="md"
                  radius="lg"
                  style={{
                    width: isMobile ? '100%' : isTablet ? '260px' : '320px',
                    flexShrink: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: isDark ? '#1A1B1E' : 'white',
                    transition: 'all 0.2s ease-out',
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
                        style={{ color: isDark ? '#E6E6E7' : '#333' }}
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
                      {sortedConversations && sortedConversations.length > 0 ? (
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
                                <Group
                                  gap="sm"
                                  wrap="nowrap"
                                  style={{ flex: 1 }}
                                >
                                  <IconMessage
                                    size={18}
                                    color={
                                      isActive
                                        ? isDark
                                          ? '#4c7afa'
                                          : '#4c7afa'
                                        : isDark
                                        ? '#E6E6E7'
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
                                          ? '#E6E6E7'
                                          : '#333'
                                        : isDark
                                        ? '#E6E6E7'
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
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleSetTitle(
                                          conversation.id,
                                          conversation.title
                                        );
                                      }}
                                      radius="xl"
                                    >
                                      <IconEdit size={14} />
                                    </ActionIcon>
                                    <ActionIcon
                                      size="xs"
                                      variant="subtle"
                                      color="red"
                                      onClick={(e: React.MouseEvent) => {
                                        e.stopPropagation();
                                        handleDeleteConversation(
                                          conversation.id
                                        );
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

                {/* 角色列表 - 添加到左侧 */}
                {!isMobile && (
                  <NpcBotList
                    bots={Object.entries(botAvatars).map(
                      ([botId, iconUrl]) => ({
                        bot_id: botId,
                        bot_name: botNames[botId] || `Bot ${botId.slice(0, 6)}`,
                        icon_url: iconUrl,
                        description: botDecs[botId] || '',
                      })
                    )}
                    loading={isLoading}
                    error={null}
                    isDark={isDark}
                    onSelectBot={handleBotSelection}
                    selectedBotId={selectedBot}
                    onRefresh={() => {
                      // 设置加载状态，确保用户有反馈
                      setIsLoading(true);
                      npcAPI
                        .getBotList(true)
                        .then((bots) => {
                          console.log('刷新获取机器人列表成功:', bots?.length);
                          updateBotData(bots);
                        })
                        .catch((err) =>
                          console.error('刷新获取机器人列表失败:', err)
                        )
                        .finally(() => setIsLoading(false));
                    }}
                  />
                )}
              </Box>
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
              backgroundImage: chatBgImage ? `url(${chatBgImage})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              transition: 'all 0.2s ease-out',
            }}
          >
            {/* 聊天背景遮罩层 */}
            {chatBgImage && (
              <>
                {/* 主遮罩层 */}
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isDark
                      ? 'rgba(26, 27, 30, 0.65)'
                      : 'rgba(255, 255, 255, 0.5)',
                    // backdropFilter: 'blur(4px)',
                    zIndex: 1,
                  }}
                />

                {/* 亮色模式的额外蒙层 */}
                {!isDark && (
                  <Box
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background:
                        'linear-gradient(rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.15) 100%)',
                      zIndex: 1,
                    }}
                  />
                )}
              </>
            )}

            {/* 会话标题区域 */}
            {activeConversation && (
              <Box
                p="sm"
                style={{
                  borderBottom: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  position: 'relative',
                  zIndex: 2,
                }}
              >
                <Group>
                  {/* 当前选中角色的头像 */}
                  {selectedBot && botAvatars[selectedBot] && (
                    <Avatar
                      src={botAvatars[selectedBot]}
                      size="sm"
                      radius="xl"
                      style={{
                        border: `1px solid ${isDark ? '#4c7afa' : '#5C7CFA'}`,
                      }}
                    >
                      <IconRobot size={16} />
                    </Avatar>
                  )}

                  <Box>
                    {/* 当前角色名称 */}
                    {selectedBot && (
                      <Text size="xs" c={isDark ? 'gray.2' : 'gray.9'} fw={600}>
                        {botNames[selectedBot] || '未命名角色'}
                      </Text>
                    )}

                    {/* 会话标题 */}
                    <Text
                      fw={600}
                      size="sm"
                      c={isDark ? '#E6E6E7' : '#222'}
                      style={{
                        textShadow: isDark
                          ? 'none'
                          : '0 1px 2px rgba(0,0,0,0.1)',
                      }}
                    >
                      {activeConversation.title || '新对话'}
                    </Text>
                  </Box>
                </Group>

                {/* 添加背景选择按钮到标题区域 */}
                <Group>
                  <Menu shadow="md" width={220} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon
                        size="sm"
                        variant="subtle"
                        color={isDark ? 'gray.4' : 'gray.7'}
                        title="更换聊天背景"
                      >
                        <IconPhotoEdit size={14} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Menu.Label>聊天背景</Menu.Label>
                      <Menu.Item
                        leftSection={<IconPhoto size={14} />}
                        onClick={handleBgImageUpload}
                      >
                        上传背景图
                      </Menu.Item>

                      <Menu.Divider />

                      <Menu.Label>预设背景</Menu.Label>
                      <Box p="xs">
                        <ImageGallery
                          onSelect={handleBgImageSelect}
                          isDark={isDark}
                        />
                      </Box>

                      {chatBgImage && (
                        <>
                          <Menu.Divider />
                          <Menu.Item
                            color="red"
                            leftSection={<IconTrash size={14} />}
                            onClick={handleRemoveBgImage}
                          >
                            移除背景
                          </Menu.Item>
                        </>
                      )}
                    </Menu.Dropdown>
                  </Menu>

                  {/* 编辑按钮 */}
                  <ActionIcon
                    size="sm"
                    variant="subtle"
                    color={isDark ? 'gray.4' : 'gray.7'}
                    onClick={() => {
                      if (activeConversation) {
                        handleSetTitle(
                          activeConversation.id,
                          activeConversation.title
                        );
                      }
                    }}
                  >
                    <IconEdit size={14} />
                  </ActionIcon>
                </Group>
              </Box>
            )}

            {/* 聊天区域 - 消息显示 */}
            <Box
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                position: 'relative',
                padding: '6px',
                zIndex: 2,
              }}
            >
              {/* 加载状态覆盖层 */}
              {isLoading && (
                <Box
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'transparent', // 移除背景色，使用更微妙的效果
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10,
                    pointerEvents: 'none', // 允许点击穿透，只在必要时阻止交互
                  }}
                >
                  <Box
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 10,
                      padding: '12px',
                      borderRadius: '12px',
                      backdropFilter: 'blur(8px)',
                      backgroundColor: isDark
                        ? 'rgba(37, 38, 43, 0.7)'
                        : 'rgba(255, 255, 255, 0.7)',
                      boxShadow: isDark
                        ? '0 8px 20px rgba(0, 0, 0, 0.3)'
                        : '0 8px 20px rgba(0, 0, 0, 0.1)',
                      animation: 'fadeIn 0.3s ease',
                      minWidth: '80px',
                      minHeight: '80px',
                    }}
                  >
                    <Box
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        borderTop: `3px solid ${
                          isDark ? '#4c7afa' : '#5C7CFA'
                        }`,
                        borderRight: `3px solid transparent`,
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <Text
                      size="xs"
                      fw={500}
                      opacity={0.8}
                      c={isDark ? 'gray.3' : 'gray.7'}
                      style={{ marginTop: '8px' }}
                    >
                      少侠请稍等...
                    </Text>
                  </Box>
                </Box>
              )}

              {!messages || messages.length === 0 ? (
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
                    c={isDark ? 'gray.1' : 'gray.9'}
                    ta="center"
                    fw={600}
                    style={{
                      textShadow: isDark
                        ? 'none'
                        : '0 1px 2px rgba(0,0,0,0.08)',
                    }}
                  >
                    {!activeConversation
                      ? '请选择或创建一个对话'
                      : '开始新的对话'}
                  </Text>
                  <Text
                    size="sm"
                    c={isDark ? 'gray.3' : 'gray.8'}
                    mt="md"
                    maw={450}
                    ta="center"
                    px="lg"
                    style={{
                      textShadow: isDark
                        ? 'none'
                        : '0 1px 1px rgba(0,0,0,0.05)',
                    }}
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
                  <MemoizedMessageList
                    messages={messages}
                    style={{ flex: 1 }}
                    isDark={isDark}
                    customRenderer={customMessageRenderer}
                    botAvatars={botAvatars}
                    botNames={botNames}
                    nameToIdMap={nameToIdMap}
                  />

                  {/* 移动设备的角色选择器 */}
                  {isMobile && (
                    <Paper
                      p="xs"
                      radius="md"
                      style={{
                        marginTop: '8px',
                        marginBottom: '4px',
                        backgroundColor: isDark
                          ? 'rgba(37, 38, 43, 0.85)'
                          : 'rgba(248, 249, 250, 0.85)',
                        borderTop: `1px solid ${
                          isDark ? '#2C2E33' : '#f0f0f0'
                        }`,
                        backdropFilter: 'blur(5px)',
                      }}
                    >
                      <Box>
                        <Group justify="apart">
                          <Text
                            size="xs"
                            c={isDark ? 'gray.2' : 'gray.8'}
                            fw={500}
                          >
                            {selectedBot
                              ? `已选择 ${
                                  botNames[selectedBot] || '未命名角色'
                                } 回复`
                              : '请选择一个角色进行对话'}
                          </Text>
                          {selectedBot && (
                            <ActionIcon
                              size="xs"
                              variant="subtle"
                              color={isDark ? 'gray.4' : 'gray.7'}
                              onClick={() => handleSelectBot(null)}
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
                                    botNames[botId] ||
                                    `Bot ${botId.slice(0, 6)}`
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
                  )}
                </Box>
              )}
            </Box>

            {/* 输入框区域 */}
            <Box
              p="md"
              style={{
                borderTop: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
                position: 'relative',
                zIndex: 2,
              }}
            >
              <ChatInput
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                onStopGeneration={stopGeneration}
                disabled={!activeConversation}
                selectedBot={selectedBot}
                isDark={isDark}
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
        overlayProps={{ opacity: 0.55, blur: 3 }}
        style={{ boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)' }}
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
              onClick={() => handleLogoutConfirm(onLogout)}
            >
              确认退出
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* 设置弹窗 */}
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
