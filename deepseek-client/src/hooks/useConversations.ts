import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

let isConversationListFetching = false;

// 服务器返回的对话列表类型
interface ConversationResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  conversationId: string;
  userId: number;
}

interface ConversationListResponse {
  code: number;
  msg: string;
  data: ConversationResponse[];
}

// 使用一个单例模式来记录全局请求状态
const requestStatus = {
  isListFetching: false,
  lastListFetchTime: 0,
  debounceTime: 500, // 防抖时间：500ms
};

const useConversations = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [initialized, setInitialized] = useState(false);
  const { userId } = useUser();

  // 使用 ref 来跟踪是否已经加载过会话列表，防止重复请求
  const hasLoadedRef = useRef(false);
  const isComponentMountedRef = useRef(true);

  // 从服务器获取指定对话的消息
  const loadConversationMessages = useCallback(
    async (conversationId: string) => {
      try {
        console.log(`加载会话 ${conversationId} 的消息...`);
        const response = await axios.get(
          `http://192.168.10.70:10010/ai-npc/npc/conversation/message/list?conversationId=${conversationId}`
        );

        if (response.data.code === 200) {
          // 修改这里，确保正确提取 items 数组
          const messagesData = response.data.data?.items || [];

          // 将接口返回的消息格式转换为应用内部使用的格式
          const messages: ChatMessage[] = messagesData.map((msg: any) => ({
            id: msg.id || uuidv4(),
            role: msg.role,
            content: msg.content,
            bot_id: msg.bot_id,
            chat_id: msg.chat_id,
            conversation_id: msg.conversation_id,
            section_id: msg.section_id,
            created_at: msg.created_at,
            updated_at: msg.updated_at,
          }));

          console.log(`成功加载会话 ${conversationId} 的消息:`, messages.length);
          return messages;
        } else {
          console.error('获取对话消息失败:', response.data?.msg || '未知错误');
          return [];
        }
      } catch (error) {
        console.error('获取对话消息时发生错误:', error);
        return [];
      }
    },
    []
  );

  // 从服务器获取对话列表
  const fetchConversations = useCallback(
    async (force = false, immediate = false) => {
      if (!userId) return;

      // 全局请求锁
      if (isConversationListFetching && !force) {
        console.log('会话列表正在获取中，跳过重复请求');
        return;
      }

      const now = Date.now();
      if (
        !immediate && !force &&
        (!initialized ||
          requestStatus.isListFetching ||
          now - requestStatus.lastListFetchTime < requestStatus.debounceTime)
      ) {
        console.log('跳过会话列表请求：防抖或未初始化');
        return;
      }



      try {
        console.log('获取对话列表...');
        // 设置全局请求状态
        isConversationListFetching = true;
        requestStatus.isListFetching = true;
        requestStatus.lastListFetchTime = now;
        const response = await axios.get<ConversationListResponse>(
          `http://192.168.10.70:10010/ai-npc/npc/conversation/list?userId=${userId}`
        );

        // 如果组件已卸载，不更新状态
        if (!isComponentMountedRef.current) return;

        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          // 将服务器返回的对话数据转换为本地格式
          const conversationsData: Conversation[] = response.data.data.map(
            (conv) => ({
              id: conv.conversationId,
              title: `对话 ${new Date(conv.createdAt).toLocaleString()}`,
              messages: [],
              createdAt: new Date(conv.createdAt).getTime(),
              updatedAt: new Date(conv.updatedAt).getTime(),
            })
          );

          console.log('转换后的对话列表:', conversationsData);
          setConversations(conversationsData);

          // 只在没有活跃对话时设置第一个为活跃
          if (conversationsData.length > 0 && !activeConversationId) {
            setActiveConversationId(conversationsData[0].id);

            // 自动加载第一个对话的消息
            if (!hasLoadedRef.current) {
              loadConversationMessages(conversationsData[0].id);
              hasLoadedRef.current = true;
            }
          }
        }
      } catch (error) {
        console.error('获取对话列表时发生错误:', error);
      } finally {
        // 重置全局请求状态
        isConversationListFetching = false;
        requestStatus.isListFetching = false;
      }
    },
    [userId, initialized]
  );

  // 组件挂载时获取对话列表
  useEffect(() => {
    // 重置组件挂载状态
    isComponentMountedRef.current = true;

    const initializeConversations = async () => {
      try {
        await fetchConversations();
      } catch (error) {
        console.error('初始化对话列表失败:', error);
      } finally {
        // 无论成功失败，都设置为已初始化
        if (isComponentMountedRef.current) {
          setInitialized(true);
        }
      }
    };

    if (userId) {
      initializeConversations();
    } else {
      // 如果没有用户ID，也标记为已初始化
      setInitialized(true);
    }

    // 清理函数
    return () => {
      isComponentMountedRef.current = false;
    };
  }, [fetchConversations, userId]);

  // 创建新对话
  const createConversation = useCallback(async () => {
    if (!userId) {
      console.warn('没有用户ID，无法创建对话');
      return null;
    }

    try {
      // 先通过 API 创建一个新对话
      const response = await axios.get<any>(
        `http://192.168.10.70:10010/ai-npc/npc/conversation/create?userId=${userId}`
      );

      // 如果组件已卸载，不更新状态
      if (!isComponentMountedRef.current) return null;

      if (response.data.code === 200 && response.data.data.conversation) {
        const serverConversation = response.data.data.conversation;

        // 创建本地对话对象
        const newConversation: Conversation = {
          id: serverConversation.id,
          title: '新对话',
          messages: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setConversations((prev) => [newConversation, ...prev]);
        setActiveConversationId(newConversation.id);
        return newConversation;
      } else {
        console.error('创建对话失败:', response.data.msg);
        return null;
      }
    } catch (error) {
      console.error('创建对话时发生错误:', error);
      return null;
    }
  }, [userId]);

  // 更新对话 - 不需要发送请求
  const updateConversation = useCallback(
    (id: string, updates: Partial<Conversation>) => {
      if (!id) return;

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

  // 删除对话
  const deleteConversation = useCallback(
    async (id: string) => {
      if (!id) return;

      try {
        // 可以添加 API 调用来从服务器删除对话
        // const response = await axios.delete(`http://192.168.10.70:10010/ai-npc/npc/conversation/delete?conversationId=${id}`);

        // 从本地状态中删除对话
        setConversations((prev) => {
          const newConversations = prev.filter(
            (conversation) => conversation.id !== id
          );

          // 如果删除的是当前激活的对话，则清除激活状态
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
          return newConversations;
        });
      } catch (error) {
        console.error('删除对话时发生错误:', error);
      }
    },
    [activeConversationId]
  );

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  const setActiveConversation = useCallback((conversation: Conversation) => {
    if (conversation) {
      setActiveConversationId(conversation.id);
    }
  }, []);

  return {
    conversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    initialized,
    fetchConversations,
    loadConversationMessages,
  };
};

export default useConversations;
