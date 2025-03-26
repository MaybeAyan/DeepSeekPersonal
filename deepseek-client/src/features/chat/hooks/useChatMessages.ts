import { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage, Conversation, ChatSettings } from '../../../types';
import { deepseekAPI, CompletionRequest } from '../../../api/deepseek';

interface UseChatMessagesProps {
  activeConversation: Conversation | null;
  settings: ChatSettings;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  isMobile: boolean;
  setSidebarVisible: (visible: boolean) => void;
}

export function useChatMessages({
  activeConversation,
  settings,
  updateConversation,
  isMobile,
  setSidebarVisible,
}: UseChatMessagesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<() => void | null>(null);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isLoading || !activeConversation) return;

      // 如果这是第一条消息，使用它作为会话标题
      if (activeConversation.messages.length === 0) {
        // 截取前20个字符作为标题
        const newTitle =
          content.length > 20 ? content.substring(0, 20) + '...' : content;

        updateConversation(activeConversation.id, { title: newTitle });
      }

      // 创建用户消息
      const userMessage: ChatMessage = {
        id: uuidv4(),
        role: 'user',
        content,
      };

      // 更新消息列表
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      updateConversation(activeConversation.id, {
        messages: updatedMessages,
        updatedAt: Date.now(),
      });
      setIsLoading(true);

      // 如果是移动端，发送消息后自动关闭侧边栏
      if (isMobile) {
        setSidebarVisible(false);
      }

      // 准备请求参数
      const request: CompletionRequest = {
        prompt: content,
        temperature: settings.temperature,
        max_tokens: settings.maxTokens,
        model: settings.model,
      };

      try {
        // 如果使用流式模式，先创建一个空的助手回复
        let assistantMessageId = '';
        if (settings.streamMode) {
          assistantMessageId = uuidv4();
          const assistantMessage: ChatMessage = {
            id: assistantMessageId,
            role: 'assistant',
            content: '',
          };
          const updatedMessagesWithAssistant = [
            ...updatedMessages,
            assistantMessage,
          ];
          setMessages(updatedMessagesWithAssistant);
          updateConversation(activeConversation.id, {
            messages: updatedMessagesWithAssistant,
            updatedAt: Date.now(),
          });

          // 使用流式API
          const stopStream = deepseekAPI.postCompletionStream(
            request,
            (data) => {
              // 处理流式响应
              const delta = data.choices[0]?.delta?.content || '';
              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: msg.content + delta,
                    };
                  }
                  return msg;
                });

                updateConversation(activeConversation.id, {
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                });

                return updatedMessages;
              });
            },
            () => {
              setIsLoading(false);
              abortControllerRef.current = null;
            },
            (error) => {
              console.error('Stream error:', error);
              setIsLoading(false);
              abortControllerRef.current = null;

              // 更新错误消息
              setMessages((prevMessages) => {
                const updatedMessages = prevMessages.map((msg) => {
                  if (msg.id === assistantMessageId) {
                    return {
                      ...msg,
                      content: `Error: ${error.message}`,
                    };
                  }
                  return msg;
                });

                updateConversation(activeConversation.id, {
                  messages: updatedMessages,
                  updatedAt: Date.now(),
                });

                return updatedMessages;
              });
            }
          );

          abortControllerRef.current = stopStream;
        } else {
          // 使用普通API
          const response = await deepseekAPI.getCompletion(request);

          // 创建助手回复
          const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: response.choices[0].message.content,
          };

          const updatedMessagesWithAssistant = [
            ...updatedMessages,
            assistantMessage,
          ];
          setMessages(updatedMessagesWithAssistant);
          updateConversation(activeConversation.id, {
            messages: updatedMessagesWithAssistant,
            updatedAt: Date.now(),
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error('API error:', error);

        // 创建错误消息
        const errorMessage: ChatMessage = {
          id: uuidv4(),
          role: 'assistant',
          content: `Error: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        };
        const updatedMessagesWithError = [...updatedMessages, errorMessage];
        setMessages(updatedMessagesWithError);
        updateConversation(activeConversation.id, {
          messages: updatedMessagesWithError,
          updatedAt: Date.now(),
        });
        setIsLoading(false);
      }
    },
    [
      activeConversation,
      isMobile,
      isLoading,
      messages,
      settings,
      updateConversation,
      setSidebarVisible,
    ]
  );

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current();
      abortControllerRef.current = null;
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, sendMessage, stopGeneration };
}
