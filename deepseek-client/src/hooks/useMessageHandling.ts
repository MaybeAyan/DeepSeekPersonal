import { useState, useRef, useCallback, useEffect } from 'react';
import { ChatMessage, Conversation } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface UseMessageHandlingProps {
  activeConversation: Conversation | null;
  selectedBot: string | null;
  sendMessageToNpc?: (
    content: string,
    botId: string,
    conversationId: string,
    onUpdate?: (content: string, isCompleted: boolean) => void
  ) => void;
  initialMessages?: ChatMessage[]; // 接收初始消息
}

export function useMessageHandling({
  activeConversation,
  selectedBot,
  sendMessageToNpc,
  initialMessages = [],
}: UseMessageHandlingProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef<ChatMessage[]>([]);
  const abortControllerRef = useRef<(() => void) | null>(null);
  const previousConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeConversation?.id !== previousConversationIdRef.current) {
      console.log('对话ID变化，重置消息列表', activeConversation?.id);
      previousConversationIdRef.current = activeConversation?.id || null;

      // 检查 activeConversation 是否有消息，如果有则使用它们
      if (
        activeConversation?.messages &&
        activeConversation.messages.length > 0
      ) {
        console.log('使用会话中的消息:', activeConversation.messages.length);
        setMessages(activeConversation.messages);
      } else {
        console.log('重置为空消息列表');
        setMessages([]);
      }
    }
  }, [activeConversation]);

  // 更新引用
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // 处理消息发送
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (
        isLoading ||
        !activeConversation ||
        !selectedBot ||
        !sendMessageToNpc
      ) {
        console.warn('无法发送消息：状态不允许或缺少必要参数');
        return;
      }

      // 创建用户消息和占位符助手消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content: content.trim(),
        created_at: Date.now(),
        bot_id: '',
      };

      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '思考中...',
        created_at: Date.now(),
        bot_id: selectedBot,
        isThinking: true,
      };

      // 更新消息列表
      setMessages((prev) => [...prev, userMessage, assistantMessage]);
      setIsLoading(true);

      // 发送消息并处理响应
      sendMessageToNpc(
        content,
        selectedBot,
        activeConversation.id,
        (newContent, isCompleted) => {
          if (isCompleted) {
            setIsLoading(false);
            setMessages((prev) => {
              const updatedMessages = prev.map((msg) =>
                msg.id === assistantMessageId
                  ? {
                      ...msg,
                      content: newContent,
                      fullContent: newContent,
                      isThinking: false,
                    }
                  : msg
              );

              // 启动打字机效果
              startTypewriterEffect(assistantMessageId, newContent);
              return updatedMessages;
            });
          }
        }
      );
    },
    [isLoading, activeConversation, selectedBot, sendMessageToNpc]
  );

  // 打字机效果
  const startTypewriterEffect = useCallback(
    (messageId: string, fullContent: string) => {
      const typingSpeed = 30;
      let displayedContent = '';

      // 检查内容是否包含分隔符
      if (fullContent.includes('|')) {
        const parts = fullContent.split('|');
        const prefix = parts[0] + '|';
        const actualContent = parts.slice(1).join('|');

        let currentIndex = 0;
        displayedContent = prefix;

        // 递归函数，显示实际内容
        const typeNextChar = () => {
          if (currentIndex < actualContent.length) {
            currentIndex++;
            displayedContent =
              prefix + actualContent.substring(0, currentIndex);

            // 更新消息显示
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === messageId
                  ? { ...msg, content: displayedContent }
                  : msg
              )
            );

            // 如果检测到换行或标点符号，可以适当增加延迟
            const nextChar = actualContent[currentIndex] || '';
            const delay = /[\n,.!?;:]/.test(nextChar)
              ? typingSpeed * 5
              : typingSpeed;

            setTimeout(typeNextChar, delay);
          }
        };

        typeNextChar();
      } else {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, content: fullContent } : msg
          )
        );
      }
    },
    []
  );

  // 停止生成
  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return {
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    handleSendMessage,
    startTypewriterEffect,
    stopGeneration,
    abortControllerRef,
  };
}
