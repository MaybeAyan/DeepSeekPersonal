import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '../../../contexts/UserContext';
import { ChatMessage } from '../../../types';

export function useNpcChat() {
  const [npcConversationId, setNpcConversationId] = useState<string>('');
  const [npcMessages, setNpcMessages] = useState<Array<ChatMessage>>([]);
  const [npcLoading, setNpcLoading] = useState(false);
  const [npcError, setNpcError] = useState<string | null>(null);
  const abortControllerRef = useRef<() => void | null>(null);

  const { userId } = useUser();

  const normalizeTimestamp = (timestamp: number | undefined): number => {
    if (!timestamp) return Date.now();
    const timestampStr = timestamp.toString();
    if (timestampStr.length === 10) {
      return timestamp * 1000;
    }
    return timestamp;
  };

  const handleSendToNpc = useCallback(
    async (
      content: string,
      botId: string,
      conversationId: string,
      onMessageUpdate?: (
        content: string,
        isCompleted: boolean,
        allMessages?: Array<ChatMessage>
      ) => void
    ) => {
      if (npcLoading) return;

      if (!conversationId || !botId) {
        setNpcError('请先选择一个角色开始对话');
        return;
      }

      // 添加用户消息
      const userMessageId = uuidv4();
      const userMessageTime = Date.now();
      const userMessage = {
        id: userMessageId,
        content,
        role: 'user' as const,
        created_at: userMessageTime,
      };

      setNpcMessages((prev) => [...prev, userMessage]);
      setNpcLoading(true);

      let eventSource: EventSource | null = null;

      // 用于跟踪消息状态
      const messageTrackers = new Map<
        string,
        {
          id: string;
          botId: string;
          content: string;
          created_at: number;
        }
      >();

      try {
        const url = `http://192.168.10.70:10010/ai-npc/npc/streamChat/create?content=${encodeURIComponent(
          content
        )}&conversationId=${conversationId}&userID=${userId}&botID=${botId}`;

        // 使用 EventSource 处理 SSE 流
        eventSource = new EventSource(url);

        eventSource.onmessage = (event) => {
          try {
            console.log('收到SSE消息:', event.data.substring(0, 100));
            const eventData = JSON.parse(event.data);

            if (eventData.event === 'conversation.message.delta') {
              if (eventData.message && eventData.message.content) {
                const delta = eventData.message.content;

                // 检查是否包含角色标识符 (例如 "李星云Ⅲ...")
                if (delta.includes('Ⅲ') && delta.split('Ⅲ')[0].length < 15) {
                  // 这是一个新角色的消息
                  const parts = delta.split('Ⅲ');
                  const botName = parts[0];

                  // 创建新消息ID
                  const newMessageId = eventData.message.id || uuidv4();
                  const currentBotId = eventData.message.bot_id || botId;

                  // 统一时间戳格式 - 确保与用户消息时间戳格式相同
                  // 同时确保机器人消息总是在用户消息之后显示
                  const serverTime = eventData.message.created_at;
                  const normalizedTime = normalizeTimestamp(serverTime);
                  const messageTime = Math.max(
                    normalizedTime,
                    userMessageTime + 100
                  );

                  // 保存消息跟踪信息
                  messageTrackers.set(botName, {
                    id: newMessageId,
                    botId: currentBotId,
                    content: delta,
                    created_at: messageTime,
                  });

                  // 添加新消息到列表
                  setNpcMessages((prev) => {
                    const updatedMessages = [
                      ...prev,
                      {
                        id: newMessageId,
                        content: delta,
                        role: 'assistant' as const,
                        bot_id: currentBotId,
                        created_at: messageTime,
                      },
                    ];

                    const sortedMessages = sortMessages(updatedMessages);
                    console.log('更新后的消息列表:', sortedMessages);

                    // 通知前端有新消息，并传递完整的消息列表
                    if (onMessageUpdate) {
                      onMessageUpdate(delta, false, sortedMessages);
                    }

                    return sortedMessages;
                  });
                } else {
                  // 需要找到此增量内容属于哪个角色的消息
                  const allBotNames = Array.from(messageTrackers.keys());
                  const matchedBotName = allBotNames.find((name) =>
                    delta.startsWith(name)
                  );

                  if (matchedBotName) {
                    // 找到匹配的角色，更新其消息
                    const tracker = messageTrackers.get(matchedBotName);
                    if (tracker) {
                      const updatedContent =
                        tracker.content +
                        delta.substring(matchedBotName.length);
                      messageTrackers.set(matchedBotName, {
                        ...tracker,
                        content: updatedContent,
                      });

                      // 更新消息内容
                      setNpcMessages((prev) => {
                        const updatedMessages = prev.map((msg) =>
                          msg.id === tracker.id
                            ? { ...msg, content: updatedContent }
                            : msg
                        );
                        // 对消息进行排序
                        const sortedMessages = sortMessages(updatedMessages);

                        // 通知前端更新消息内容
                        if (onMessageUpdate) {
                          onMessageUpdate(
                            updatedContent,
                            false,
                            sortedMessages
                          );
                        }

                        return sortedMessages;
                      });
                    }
                  } else if (messageTrackers.size > 0) {
                    const lastBotName = Array.from(
                      messageTrackers.keys()
                    ).pop();
                    if (lastBotName) {
                      const tracker = messageTrackers.get(lastBotName);
                      if (tracker) {
                        const updatedContent = tracker.content + delta;
                        messageTrackers.set(lastBotName, {
                          ...tracker,
                          content: updatedContent,
                        });

                        // 更新消息内容
                        setNpcMessages((prev) => {
                          const updatedMessages = prev.map((msg) =>
                            msg.id === tracker.id
                              ? { ...msg, content: updatedContent }
                              : msg
                          );

                          // 对消息进行排序
                          const sortedMessages = sortMessages(updatedMessages);

                          // 通知前端更新消息内容
                          if (onMessageUpdate) {
                            onMessageUpdate(
                              updatedContent,
                              false,
                              sortedMessages
                            );
                          }

                          return sortedMessages;
                        });
                      }
                    }
                  }
                }
              }
            } else if (
              eventData.event === 'conversation.chat.completed' ||
              eventData.done === true
            ) {
              // 流式响应完成
              if (eventSource) {
                eventSource.close();
                setNpcLoading(false);
                abortControllerRef.current = null;

                // 获取最终的消息列表
                setNpcMessages((prev) => {
                  const sortedMessages = sortMessages(prev);

                  // 通知前端所有消息都已完成
                  if (onMessageUpdate) {
                    onMessageUpdate('', true, sortedMessages);
                  }

                  return sortedMessages;
                });
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

  // （旧消息在前，新消息在后）
  const sortMessages = (messages: ChatMessage[]) => {
    return [...messages].sort((a, b) => {
      const timeA = a.created_at || 0;
      const timeB = b.created_at || 0;
      if (timeA === timeB) {
        return a.role === 'user' ? -1 : 1;
      }
      return timeA - timeB;
    });
  };

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
