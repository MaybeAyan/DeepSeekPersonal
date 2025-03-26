import { useEffect, useState, useCallback } from 'react';
import { AppShell, useMantineTheme } from '@mantine/core';
import { Header } from '../components/layout/Header';
import { Chat } from '../components/Chat';
import { NpcBot } from '../api';
import { ChatSettings } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { useNpcBots } from '../features/npc/hooks/useNpcBots';
import { useNpcChat } from '../features/npc/hooks/useNpcChat'; // 导入 useNpcChat
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
}

interface CreateConversationResponse {
  code: number;
  msg: string;
  data: {
    logID: string;
    conversation: {
      id: string;
      created_at: number;
      meta_data: any;
      last_section_id: string;
    };
  };
}

export function ChatPage({
  toggleColorScheme,
  colorScheme,
  onLogout,
  settings,
  updateSettings,
}: ChatProps) {
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);

  const { userId } = useUser();

  const {
    bots,
    loading: botsLoading,
    error: botsError,
    fetchBots,
    selectedBot,
    setSelectedBot,
  } = useNpcBots();
  const theme = useMantineTheme();
  const isDark = theme.primaryColor === 'dark';
  const [appReady, setAppReady] = useState(false);

  // 新增状态来跟踪当前对话中的所有角色
  const [activeBots, setActiveBots] = useState<string[]>([]);

  const createConversation = useCallback(async () => {
    try {
      const response = await axios.get<CreateConversationResponse>(
        `/ai-npc/npc/conversation/create?userId=${userId}`
      );

      if (response.data.code === 200) {
        return response.data.data.conversation.id;
      } else {
        console.error('创建会话失败：' + response.data.msg);
        return null;
      }
    } catch (error) {
      console.error('创建会话时发生错误：', error);
      return null;
    }
  }, [userId]);

  // 使用 useNpcChat hook
  const {
    npcConversationId,
    setNpcConversationId,
    npcMessages,
    setNpcMessages,
    npcLoading,
    setNpcError,
    handleSendToNpc,
    handleStopNpcGeneration,
  } = useNpcChat();

  const stableFetchBots = useCallback(() => {
    fetchBots();
  }, [fetchBots]);

  useEffect(() => {
    setAppReady(true);
  }, []);

  const handleSelectBot = useCallback(
    async (bot: NpcBot) => {
      setSelectedBot(bot);

      if (bot) {
        const conversationId = await createConversation();
        if (conversationId) {
          setNpcConversationId(conversationId);
          setNpcMessages([]);
          setActiveBots([bot.bot_id]);
          handleSendToNpc('自我介绍', bot.bot_id, conversationId);
        } else {
          setNpcError('创建会话失败，请重试');
        }
      }
    },
    [
      setSelectedBot,
      createConversation,
      setNpcConversationId,
      setNpcMessages,
      handleSendToNpc,
      setNpcError,
    ]
  );

  return (
    <AppShell header={{ height: 60 }}>
      <Header
        onLogout={onLogout}
        colorScheme={colorScheme}
        toggleColorScheme={toggleColorScheme}
        sidebarVisible={sidebarVisible}
        setSidebarVisible={setSidebarVisible}
        setLogoutModalOpen={setLogoutModalOpen}
        setSettingsOpened={setSettingsOpened}
      />

      <Chat
        toggleColorScheme={toggleColorScheme}
        colorScheme={colorScheme}
        onLogout={onLogout}
        bots={bots}
        botsLoading={botsLoading}
        botsError={botsError}
        selectedBot={selectedBot}
        onSelectBot={handleSelectBot}
        fetchBots={stableFetchBots}
        npcMessages={npcMessages}
        npcLoading={npcLoading}
        sendMessageToNpc={(content) => {
          if (selectedBot && npcConversationId) {
            handleSendToNpc(content, selectedBot.bot_id, npcConversationId);
          } else if (selectedBot) {
            const newConversationId = uuidv4();
            setNpcConversationId(newConversationId);
            handleSendToNpc(content, selectedBot.bot_id, newConversationId);
          } else {
            setNpcError('请先选择一个角色开始对话');
          }
        }}
        stopNpcGeneration={handleStopNpcGeneration}
        settings={settings}
        updateSettings={updateSettings}
      />
    </AppShell>
  );
}
