import { useState, useRef, useCallback, useMemo, useLayoutEffect } from 'react';
import { unstable_batchedUpdates as batch } from 'react-dom';
import { Conversation, ChatMessage } from '../types';

interface UseChatConversationProps {
  conversations: Conversation[];
  createConversation: () => Promise<Conversation | null>;
  deleteConversation: (id: string) => Promise<void>;
  loadConversationMessages: (id: string) => Promise<ChatMessage[]>;
  fetchConversations: () => Promise<Conversation[] | undefined>;
  isMobile: boolean | undefined;
  setSidebarVisible: (visible: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setMessages: (messages: ChatMessage[]) => void;
  appReady: boolean;
  initializationStageRef: React.MutableRefObject<{
    conversationsLoaded: boolean;
    botsLoaded: boolean;
    messagesLoaded: boolean;
  }>;
  checkAndFinishLoading: () => void;
}

export function useChatConversation({
  conversations,
  createConversation,
  deleteConversation,
  loadConversationMessages,
  fetchConversations,
  isMobile,
  setSidebarVisible,
  setIsLoading,
  setMessages,
  appReady,
  initializationStageRef,
  checkAndFinishLoading,
}: UseChatConversationProps) {
  const [activeConversation, setActiveConversation] =
    useState<Conversation | null>(null);
  const activeConversationRef = useRef<Conversation | null>(null);
  const lastLoadedConversationRef = useRef<string | null>(null);

  // 更新引用
  useLayoutEffect(() => {
    activeConversationRef.current = activeConversation;
  }, [activeConversation]);

  // 排序会话列表
  const sortedConversations = useMemo(() => {
    if (!conversations || conversations.length === 0) {
      console.log('会话列表为空');
      return [];
    }

    return [...conversations]
      .filter((c) => typeof c?.updatedAt === 'number')
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [conversations]);

  // 选择会话
  const handleSelectConversation = useCallback(
    async (conversation: Conversation) => {
      if (!conversation) return;

      // 如果点击的是当前会话，不做任何操作
      if (activeConversation?.id === conversation.id) return;

      try {
        setIsLoading(true);
        lastLoadedConversationRef.current = conversation.id;

        // 加载消息
        const messages = await loadConversationMessages(conversation.id);

        // 排序消息
        const sortedMessages = messages
          ? [...messages].sort((a, b) => {
              if (a.created_at && b.created_at) {
                return a.created_at - b.created_at;
              }
              return 0;
            })
          : [];
        batch(() => {
          const conversationWithMessages = {
            ...conversation,
            messages: sortedMessages,
          };
          setActiveConversation(conversationWithMessages);
          if (setMessages) {
            setMessages(sortedMessages || []);
          }
          if (isMobile) {
            setSidebarVisible(false);
          }
        });

        // 首次加载时检查初始化状态
        if (!initializationStageRef.current.messagesLoaded) {
          initializationStageRef.current.messagesLoaded = true;
          checkAndFinishLoading();
        }
      } catch (error) {
        console.error('加载会话消息失败:', error);
        lastLoadedConversationRef.current = null;
      } finally {
        // 延迟关闭加载状态，提高用户体验
        setTimeout(() => {
          setIsLoading(false);
        }, 300);
      }
    },
    [
      activeConversation,
      loadConversationMessages,
      setIsLoading,
      setMessages,
      isMobile,
      setSidebarVisible,
      initializationStageRef,
      checkAndFinishLoading,
    ]
  );

  // 创建新会话
  const handleCreateConversation = useCallback(async () => {
    try {
      setIsLoading(true);
      const newConversation = await createConversation();
      setActiveConversation(newConversation);
      setMessages([]);

      if (isMobile) {
        setSidebarVisible(false);
      }
    } catch (error) {
      console.error('创建会话失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [
    createConversation,
    setIsLoading,
    setMessages,
    isMobile,
    setSidebarVisible,
  ]);

  // 删除会话
  const handleDeleteConversation = useCallback(
    async (id: string) => {
      await deleteConversation(id);
      await fetchConversations();

      // 如果删除的是当前活动对话，切换到其他对话
      if (activeConversation?.id === id) {
        if (conversations.length > 0) {
          // 按更新时间排序选择最近的一个对话
          const remainingConversations = conversations.filter(
            (c) => c.id !== id
          );
          if (remainingConversations.length > 0) {
            const sortedRemainingConversations = [
              ...remainingConversations,
            ].sort((a, b) => b.updatedAt - a.updatedAt);
            await handleSelectConversation(sortedRemainingConversations[0]);
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
      setMessages,
    ]
  );

  // 自动选择第一个会话
  useLayoutEffect(() => {
    if (appReady && sortedConversations.length > 0 && !activeConversation) {
      console.log('自动选择第一个会话');
      handleSelectConversation(sortedConversations[0]);
    }
  }, [
    appReady,
    sortedConversations,
    activeConversation,
    handleSelectConversation,
  ]);

  return {
    activeConversation,
    setActiveConversation,
    sortedConversations,
    handleSelectConversation,
    handleCreateConversation,
    handleDeleteConversation,
    lastLoadedConversationRef,
  };
}
