import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Conversation, ChatMessage } from '../types';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

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

// 全局单例锁
const GLOBAL_STATE = {
  isFetching: false,
  lastFetchTime: 0,
  requestId: 0,
  initialized: false,
  debug: true,
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
          const messages: ChatMessage[] = messagesData.map(
            (msg: ChatMessage) => ({
              id: msg.id || uuidv4(),
              role: msg.role,
              content: msg.content,
              bot_id: msg.bot_id,
              chat_id: msg.chat_id,
              conversation_id: msg.conversation_id,
              section_id: msg.section_id,
              created_at: msg.created_at,
              updated_at: msg.updated_at,
            })
          );

          console.log(
            `成功加载会话 ${conversationId} 的消息:`,
            messages.length
          );
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

      // 直接打印请求状态便于调试
      if (GLOBAL_STATE.debug) {
        console.log('fetchConversations 被调用:', {
          force,
          immediate,
          isGlobalFetching: GLOBAL_STATE.isFetching,
          isInitialized: GLOBAL_STATE.initialized,
          lastFetchTime: new Date(GLOBAL_STATE.lastFetchTime).toISOString(),
          requestId: GLOBAL_STATE.requestId,
        });
      }

      if (GLOBAL_STATE.initialized && !force) {
        console.log('⚠️ 全局已初始化，跳过重复请求');
        if (!initialized) {
          setInitialized(true);
        }
        return conversations;
      }

      // 如果正在获取中且不是强制获取，跳过
      if (GLOBAL_STATE.isFetching && !force) {
        console.log('⚠️ 跳过请求: 另一个请求正在进行中');
        return;
      }

      // 递增请求ID
      const currentRequestId = ++GLOBAL_STATE.requestId;

      try {
        console.log(`🚀 开始获取对话列表 (请求ID: ${currentRequestId})`);
        // 设置全局请求状态
        GLOBAL_STATE.isFetching = true;
        GLOBAL_STATE.lastFetchTime = Date.now();

        const response = await axios.get<ConversationListResponse>(
          `http://192.168.10.70:10010/ai-npc/npc/conversation/list?userId=${userId}`
        );

        // 如果当前请求不是最新的请求，则忽略结果
        if (currentRequestId !== GLOBAL_STATE.requestId) {
          console.log(`⚠️ 忽略过时的请求结果 (ID: ${currentRequestId})`);
          return;
        }

        // 如果组件已卸载，不更新状态
        if (!isComponentMountedRef.current) return;

        if (response.data.code === 200 && Array.isArray(response.data.data)) {
          console.log('服务器返回的原始数据:', response.data.data);

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

          // 确保有会话选中
          if (conversationsData.length > 0) {
            // 如果没有活跃对话，选择第一个
            if (!activeConversationId) {
              console.log('设置活跃对话:', conversationsData[0].id);
              setActiveConversationId(conversationsData[0].id);

              // 自动加载第一个对话的消息
              if (!hasLoadedRef.current) {
                console.log('自动加载第一个对话的消息');
                loadConversationMessages(conversationsData[0].id);
                hasLoadedRef.current = true;
              }
            }
          }

          // 标记初始化完成
          if (!initialized) {
            setInitialized(true);
          }
        }
      } catch (error) {
        console.error('获取对话列表时发生错误:', error);
      } finally {
        // 只有当这是最新的请求时，才重置请求状态
        if (currentRequestId === GLOBAL_STATE.requestId) {
          GLOBAL_STATE.isFetching = false;
        }
      }
    },
    [userId, initialized, loadConversationMessages, activeConversationId]
  );

  // 组件挂载时获取对话列表
  useEffect(() => {
    // 重置组件挂载状态
    isComponentMountedRef.current = true;

    if (GLOBAL_STATE.initialized) {
      console.log('全局已初始化，跳过组件挂载初始化');
      if (!initialized) {
        setInitialized(true);
      }
      return;
    }

    if (userId) {
      fetchConversations(true, true);
    }

    // 清理函数
    return () => {
      isComponentMountedRef.current = false;
    };
  }, []);

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
