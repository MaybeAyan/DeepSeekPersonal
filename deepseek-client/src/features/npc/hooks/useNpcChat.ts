import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { NpcBot } from '../../../api';
import { useUser } from '../../../contexts/UserContext';

export function useNpcChat() {
  const [npcConversationId, setNpcConversationId] = useState<string>('');
  const [npcMessages, setNpcMessages] = useState<
    Array<{ id: string; content: string; role: 'user' | 'assistant' }>
  >([]);
  const [npcLoading, setNpcLoading] = useState(false);
  const [npcError, setNpcError] = useState<string | null>(null);
  const abortControllerRef = useRef<() => void | null>(null);

  const { userId } = useUser();

  const handleSendToNpc = useCallback(
    async (content: string, botId: string, conversationId: string) => {
      if (npcLoading) return;

      if (!conversationId || !botId) {
        setNpcError('请先选择一个角色开始对话');
        return;
      }

      // 添加用户消息
      const userMessageId = uuidv4();
      const userMessage = {
        id: userMessageId,
        content,
        role: 'user' as const,
      };

      setNpcMessages((prev) => [...prev, userMessage]);
      setNpcLoading(true);

      let eventSource: EventSource | null = null; // 添加局部变量

      try {
        // 创建助手消息
        const assistantMessageId = uuidv4();
        const assistantMessage = {
          id: assistantMessageId,
          content: '正在思考中...', // 初始内容为空
          role: 'assistant' as const,
        };

        setNpcMessages((prev) => [...prev, assistantMessage]);
        const url = `/ai-npc/npc/streamChat/create?content=${encodeURIComponent(
          content
        )}&conversationId=${conversationId}&userID=${userId}&botID=${botId}`;

        // 使用 EventSource 处理 SSE 流
        eventSource = new EventSource(url); // 初始化局部变量

        eventSource.onmessage = (event) => {
          try {
            const eventData = JSON.parse(event.data);

            if (eventData.event === 'conversation.message.delta') {
              if (eventData.message && eventData.message.content) {
                setNpcMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: msg.content + eventData.message.content,
                        }
                      : msg
                  )
                );
              }
            } else if (eventData.event === 'conversation.message.completed') {
              // 完整的消息内容
              if (
                eventData.message &&
                eventData.message.content &&
                eventData.message.type === 'answer'
              ) {
                setNpcMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: eventData.message.content }
                      : msg
                  )
                );
              }
            } else if (eventData.event === 'conversation.chat.completed') {
              if (eventData.chat && eventData.chat.conversation_id) {
                setNpcConversationId(eventData.chat.conversation_id);
              }
            } else if (eventData.done === true) {
              // 所有数据接收完毕，关闭连接
              eventSource?.close();
              setNpcLoading(false);
            }
          } catch (error) {
            console.error('解析SSE数据出错:', error, event.data);
            setNpcError('解析SSE数据出错');
            eventSource?.close(); // 确保关闭
            setNpcLoading(false);
          }
        };

        eventSource.onerror = (error) => {
          console.error('EventSource error:', error);
          setNpcError('EventSource error');
          eventSource?.close(); // 确保关闭
          setNpcLoading(false);
        };

        // 中止请求
        abortControllerRef.current = () => {
          eventSource?.close(); // 确保关闭
          setNpcLoading(false);
        };
      } catch (error: any) {
        console.error('NPC聊天错误:', error);
        setNpcError('与AI助手对话时发生错误');
        eventSource?.close(); // 确保关闭
        setNpcLoading(false);
      }
    },
    []
  );

  const handleStopNpcGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setNpcLoading(false);
    }
  }, []);

  return {
    npcConversationId,
    setNpcConversationId,
    npcMessages,
    setNpcMessages,
    npcLoading,
    setNpcLoading,
    npcError,
    setNpcError,
    handleSendToNpc,
    handleStopNpcGeneration,
  };
}
