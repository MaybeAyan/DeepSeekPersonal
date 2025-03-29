import { useEffect, useState, useRef } from 'react';
import { AppShell } from '@mantine/core';
import { Header } from '../components/layout/Header';
import { Chat } from '../components/Chat';
import { ChatSettings } from '../types';
import { useNpcChat } from '../features/npc/hooks/useNpcChat'; // 导入 useNpcChat

interface ChatProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  settings: ChatSettings;
  updateSettings: (settings: Partial<ChatSettings>) => void;
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

  useEffect(() => {
    if (!pageInitializedRef.current) {
      pageInitializedRef.current = true;
    }
  }, []); // 空依赖数组，确保只执行一次

  // 使用 useNpcChat hook
  const { handleSendToNpc, handleStopNpcGeneration } = useNpcChat();

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
          // 这里不需要做额外处理，直接传递allMessages参数给onUpdate
          handleSendToNpc(
            content,
            botId,
            conversationId,
            (content, isCompleted, allMessages) => {
              if (onUpdate) {
                // 将完整消息列表传递给onUpdate回调
                onUpdate(content, isCompleted, allMessages);
              }
            }
          );
        }}
        stopNpcGeneration={handleStopNpcGeneration}
        settings={settings}
        updateSettings={updateSettings}
      />
    </AppShell>
  );
}
