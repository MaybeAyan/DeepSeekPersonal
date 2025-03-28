import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
    async (
      content: string,
      botId: string,
      conversationId: string,
      onMessageUpdate?: (content: string, isCompleted: boolean) => void
    ) => {
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
          content: '正在思考中...',
          role: 'assistant' as const,
          bot_id: botId,
        };

        setNpcMessages((prev) => [...prev, assistantMessage]);
        const url = `http://192.168.10.70:10010/ai-npc/npc/streamChat/create?content=${encodeURIComponent(
          content
        )}&conversationId=${conversationId}&userID=${userId}&botID=${botId}`;

        // 使用 EventSource 处理 SSE 流
        eventSource = new EventSource(url); // 初始化局部变量

        let accumulatedContent = '';
        let isFirstMessage = true;

        eventSource.onmessage = (event) => {
          try {
            console.log('收到SSE消息:', event.data.substring(0, 100)); // 打印前100字符
            const eventData = JSON.parse(event.data);

            if (eventData.event === 'conversation.message.delta') {
              if (eventData.message && eventData.message.content) {
                const delta = eventData.message.content;
                accumulatedContent += delta;

                // // 立即更新本地消息，不要等待
                // setNpcMessages((prev) =>
                //   prev.map((msg) =>
                //     msg.id === assistantMessageId
                //       ? { ...msg, content: accumulatedContent }
                //       : msg
                //   )
                // );

                if (isFirstMessage) {
                  isFirstMessage = false;
                  // 通知前端有新消息，但未完成（前端可获取但不开始动画）
                  if (onMessageUpdate) {
                    onMessageUpdate(accumulatedContent, false);
                  }
                }
              }
            } else if (
              eventData.event === 'conversation.chat.completed' ||
              eventData.done === true
            ) {
              // 流式响应完成，关闭连接
              if (eventSource) {
                eventSource.close();
                setNpcLoading(false);
                abortControllerRef.current = null;

                // 调用外部回调，标记完成
                if (onMessageUpdate) {
                  onMessageUpdate(accumulatedContent, true);
                }

                // 更新本地消息状态
                setNpcMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }
            }
          } catch (error) {
            console.error('处理事件流数据时出错:', error);
          }
        };

        // 保存中断控制器
        abortControllerRef.current = () => {
          if (eventSource) {
            eventSource.close();
            setNpcLoading(false);
          }
        };
      } catch (error: any) {
        setNpcError(error.message || '请求失败');
        setNpcLoading(false);
      }
    },
    [userId, npcLoading, setNpcError, setNpcMessages, setNpcLoading]
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
