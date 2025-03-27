import { useEffect, useState, useCallback, useRef } from 'react';
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
  // 使用ref防止重复初始化
  const pageInitializedRef = useRef(false);

  const { userId } = useUser();

  const { fetchBots } = useNpcBots();
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!pageInitializedRef.current) {
      pageInitializedRef.current = true;

      console.log('ChatPage组件初始化');
      setAppReady(true);

      // 只在组件首次加载时获取机器人列表
      // 注意：这里使用 false 参数，表示如果缓存存在则使用缓存
      fetchBots(false);
    }
  }, []); // 空依赖数组，确保只执行一次

  // 使用 useNpcChat hook
  const { handleSendToNpc, handleStopNpcGeneration } = useNpcChat();

  useEffect(() => {
    setAppReady(true);
  }, []);

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
        sendMessageToNpc={(content, botId, conversationId, onUpdate) => {
          handleSendToNpc(content, botId, conversationId, onUpdate);
        }}
        stopNpcGeneration={handleStopNpcGeneration}
        settings={settings}
        updateSettings={updateSettings}
      />
    </AppShell>
  );
}
