import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '../types';
import { v4 as uuidv4 } from 'uuid';

const LOCAL_STORAGE_KEY = 'deepseek-conversations';

const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const storedConversations = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedConversations) {
          const parsed = JSON.parse(storedConversations);
          setConversations(parsed);
          console.log('Loaded conversations from localStorage:', parsed.length);
        }
      } catch (error) {
        console.error('Error loading conversations from localStorage:', error);
      } finally {
        // 确保在设置状态后再标记为已初始化
        setInitialized(true);
      }
    };

    loadConversations();
  }, []);
  useEffect(() => {
    if (!initialized) return;
    setConversations((prevConversations) => {
      const savedConversations = saveConversations(prevConversations);
      if (savedConversations !== prevConversations) {
        return savedConversations;
      }
      return prevConversations;
    });
  }, [conversations, initialized]);

  const createConversation = useCallback(() => {
    const newConversation: Conversation = {
      id: uuidv4(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setConversations((prev) => [newConversation, ...prev]);
    return newConversation;
  }, []);

  const updateConversation = useCallback(
    (id: string, updates: Partial<Conversation>) => {
      setConversations((prev) => {
        // 找到要更新的会话
        const index = prev.findIndex((conv) => conv.id === id);
        if (index === -1) return prev;

        // 创建更新后的会话列表
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

  const deleteConversation = useCallback((id: string) => {
    setConversations((prev) =>
      prev.filter((conversation) => conversation.id !== id)
    );
  }, []);
  const saveConversations = (conversationsToSave: Conversation[]) => {
    try {
      const data = JSON.stringify(conversationsToSave);
      // 检查大小
      if (data.length > 4 * 1024 * 1024) {
        // 接近4MB时
        // 保留最近的20个对话
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
  };

  return {
    conversations,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized,
  };
};

export default useConversations;
