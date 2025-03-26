import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation } from '../../../types';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'deepseek-conversations';
const ACTIVE_CONVERSATION_KEY = 'deepseek-active-conversation';

const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const storedConversations = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedConversations) {
          const parsed = JSON.parse(storedConversations) as Conversation[];
          setConversations(parsed);
          console.log('Loaded conversations from localStorage:', parsed.length);
        }

        const storedActiveConversationId = localStorage.getItem(
          ACTIVE_CONVERSATION_KEY
        );
        if (storedActiveConversationId) {
          setActiveConversationId(storedActiveConversationId);
          console.log(
            'Loaded active conversation ID from localStorage:',
            storedActiveConversationId
          );
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
      } finally {
        setInitialized(true);
      }
    };

    loadConversations();
  }, []);

  useEffect(() => {
    if (!initialized) return;
    // 保存会话列表
    saveConversations(conversations);
    // 保存当前激活的会话 ID
    if (activeConversationId) {
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, activeConversationId);
    } else {
      localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
    }
  }, [conversations, activeConversationId, initialized]);

  const createConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    setActiveConversationId(newConversation.id); // 创建后设为激活
    return newConversation;
  }, []);

  const updateConversation = useCallback(
    (id: string, updates: Partial<Conversation>) => {
      setConversations((prev) => {
        const index = prev.findIndex((conv) => conv.id === id);
        if (index === -1) return prev;

        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          ...updates,
          updatedAt: Date.now(),
        };

        return updated;
      });
    },
    []
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const newConversations = prev.filter(
          (conversation) => conversation.id !== id
        );
        setConversations(newConversations);

        // 如果删除的是当前激活的会话，则清除激活状态
        if (activeConversationId === id) {
          setActiveConversationId(null);
        }
        return newConversations;
      });
    },
    [activeConversationId]
  );

  const saveConversations = useCallback(
    (conversationsToSave: Conversation[]) => {
      try {
        const data = JSON.stringify(conversationsToSave);
        if (data.length > 4 * 1024 * 1024) {
          const trimmedConversations = [...conversationsToSave]
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 20);
          localStorage.setItem(
            LOCAL_STORAGE_KEY,
            JSON.stringify(trimmedConversations)
          );
          console.warn('localStorage接近容量限制，已自动删减旧对话');
          return trimmedConversations;
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY, data);
          return conversationsToSave;
        }
      } catch (error) {
        console.error('保存对话失败:', error);
        return conversationsToSave;
      }
    },
    []
  );

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const setActiveConversation = useCallback((conversation: Conversation) => {
    setActiveConversationId(conversation.id);
  }, []);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized,
  };
};

export default useConversations;
