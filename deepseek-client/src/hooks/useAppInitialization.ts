import { useState, useRef, useCallback, useEffect } from 'react';

interface UseAppInitializationProps {
  conversationsInitialized: boolean;
  loadBotData: () => Promise<any>;
  setIsLoading: (loading: boolean) => void;
}

export function useAppInitialization({
  conversationsInitialized,
  loadBotData,
  setIsLoading,
}: UseAppInitializationProps) {
  const [appReady, setAppReady] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const initializationStageRef = useRef({
    conversationsLoaded: false,
    botsLoaded: false,
    messagesLoaded: false,
  });

  const hasInitializedRef = useRef({
    conversations: false,
    botList: false,
  });

  // 检查初始化状态
  const checkAndFinishLoading = useCallback(() => {
    const { conversationsLoaded, botsLoaded, messagesLoaded } =
      initializationStageRef.current;

    console.log('检查初始化状态:', {
      conversationsLoaded,
      botsLoaded,
      messagesLoaded,
    });

    if (conversationsLoaded && botsLoaded && messagesLoaded) {
      console.log('所有初始化步骤都已完成，关闭loading状态');
      setIsLoading(false);
    }
  }, [setIsLoading]);

  // 初始化应用
  const initializeApp = useCallback(async () => {
    if (conversationsInitialized && !hasInitializedRef.current.conversations) {
      hasInitializedRef.current.conversations = true;
      console.log('初始化应用数据...');
      setIsLoading(true);

      try {
        await loadBotData();
        hasInitializedRef.current.botList = true;
        initializationStageRef.current.botsLoaded = true;

        // 标记会话已加载
        initializationStageRef.current.conversationsLoaded = true;

        setIsInitialLoad(false);
        setAppReady(true);
        checkAndFinishLoading();
      } catch (error) {
        console.error('初始化应用失败:', error);
      }
    }
  }, [
    conversationsInitialized,
    loadBotData,
    setIsLoading,
    checkAndFinishLoading,
  ]);

  // 组件初始化逻辑
  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  return {
    appReady,
    setAppReady,
    isInitialLoad,
    setIsInitialLoad,
    initializationStageRef,
    hasInitializedRef,
    checkAndFinishLoading,
  };
}
