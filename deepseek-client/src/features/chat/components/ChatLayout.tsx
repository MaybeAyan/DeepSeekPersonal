/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Box,
  Paper,
  Overlay,
  Transition,
  Group,
  ActionIcon,
  Title,
  ScrollArea,
  Stack,
  Text,
  Button,
} from '@mantine/core';
import {
  IconChevronLeft,
  IconPlus,
  IconBrandOpenai,
} from '@tabler/icons-react';
import { NpcBotList } from '../../../components/npc/NpcBotList';
import { ChatArea } from './ChatArea';
import { ChatInput } from '../../../components/chat/ChatInput';
import { ChatSettings, Conversation } from '../../../types';
import React from 'react';

interface ChatLayoutProps {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conversation: Conversation) => void;
  messages: any[];
  sendMessage: (content: string) => Promise<void>;
  isLoading: boolean;
  sidebarVisible: boolean;
  bots: any[];
  botsLoading: boolean;
  botsError: string | null;
  fetchBots: () => void;
  selectedBot: any;
  onSelectBot: (bot: any) => void;
  isMobile: boolean;
  isDark: boolean;
  stopGeneration: () => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  createConversation: () => Conversation;
  deleteConversation: (id: string) => void;
  setSidebarVisible: (visible: boolean) => void;
  settings: ChatSettings; // 添加 settings 属性
  setLogoutModalOpen: (flag: boolean) => void;
}

export const ChatLayout = React.memo(function ChatLayout({
  conversations,
  activeConversation,
  setActiveConversation,
  messages,
  sendMessage,
  isLoading,
  sidebarVisible,
  bots,
  botsLoading,
  botsError,
  fetchBots,
  selectedBot,
  onSelectBot,
  isMobile,
  isDark,
  stopGeneration,
  createConversation,
  setSidebarVisible,
}: ChatLayoutProps) {
  return (
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
          <Paper
            shadow="md"
            radius="lg"
            style={{
              ...styles,
              width: isMobile ? '100%' : '250px',
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
                <Title order={5} style={{ color: isDark ? '#C1C2C5' : '#333' }}>
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
                    onClick={createConversation}
                    title="新建对话"
                  >
                    <IconPlus size={16} />
                  </ActionIcon>
                </Group>
              </Group>
            </Box>

            {/* 对话列表滚动区域 */}
            <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={6}>
              <Stack p="md" gap="sm">
                {conversations.map((conversation) => {
                  const isActive = activeConversation?.id === conversation.id;
                  return (
                    <Paper
                      key={conversation.id}
                      shadow="none"
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
                      onClick={() => setActiveConversation(conversation)}
                    >
                      <Group justify="space-between" wrap="nowrap">
                        <Group gap="sm" wrap="nowrap" style={{ flex: 1 }}>
                          <IconBrandOpenai
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
                onClick={createConversation}
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

      {/* 添加角色列表*/}
      <NpcBotList
        bots={bots}
        loading={botsLoading}
        error={botsError}
        isDark={isDark}
        onSelectBot={onSelectBot}
        selectedBotId={selectedBot?.bot_id}
        onRefresh={fetchBots}
      />

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
              <Box style={{ flex: 1 }}>
                <ChatArea messages={messages} isDark={isDark} />
              </Box>
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
            onSendMessage={sendMessage}
            isLoading={isLoading}
            onStopGeneration={stopGeneration}
          />
        </Box>
      </Paper>
    </Box>
  );
});
