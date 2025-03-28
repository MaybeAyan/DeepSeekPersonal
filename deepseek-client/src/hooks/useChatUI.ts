import { useState, useEffect, useCallback } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import { useMantineTheme } from '@mantine/core';

export function useChatUI(colorScheme: 'light' | 'dark') {
  // UI状态
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);
  const [selectedBot, setSelectedBot] = useState<string | null>(null);

  // 主题和响应式布局
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);
  const isDark = colorScheme === 'dark';

  // 响应式布局处理
  useEffect(() => {
    if (isMobile || isTablet) {
      setSidebarVisible(false);
    } else {
      setSidebarVisible(true);
    }
  }, [isMobile, isTablet]);

  // 处理选择机器人
  const handleSelectBot = useCallback((botId: string | null) => {
    setSelectedBot((prev) => (prev === botId ? null : botId));
  }, []);

  // 处理退出确认
  const handleLogoutConfirm = useCallback((onLogout: () => void) => {
    setLogoutModalOpen(false);
    onLogout();
  }, []);

  return {
    sidebarVisible,
    setSidebarVisible,
    logoutModalOpen,
    setLogoutModalOpen,
    settingsOpened,
    setSettingsOpened,
    selectedBot,
    handleSelectBot,
    isDark,
    theme,
    isMobile,
    isTablet,
    handleLogoutConfirm,
  };
}
