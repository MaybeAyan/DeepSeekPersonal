import { useRef, useEffect, useMemo, useState } from 'react';
import {
  Paper,
  ScrollArea,
  Stack,
  Text,
  Avatar,
  Box,
  Flex,
  Center,
  Loader,
} from '@mantine/core';
import type { ChatMessage as ChatMessageType } from '../../types';
import { IconRobot, IconUser } from '@tabler/icons-react';

interface MessageListProps {
  messages: ChatMessageType[];
  style?: React.CSSProperties;
  isDark?: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode;
  botAvatars?: Record<string, string>;
  botNames?: Record<string, string>;
  nameToIdMap?: Record<string, string>;
}

// 添加消息去重处理函数
const getDeduplicatedMessages = (messages: ChatMessageType[]) => {
  const result: ChatMessageType[] = [];

  for (let i = 0; i < messages.length; i++) {
    const currentMsg = messages[i];

    // 检查是否是用户消息以及下一条是否存在
    if (currentMsg.role === 'user' && i + 1 < messages.length) {
      const nextMsg = messages[i + 1];

      // 如果下一条也是用户消息，且内容相同，跳过当前消息
      if (nextMsg.role === 'user' && nextMsg.content === currentMsg.content) {
        // 如果时间间隔小于30秒，认为是重复消息
        const timeDiff =
          (nextMsg.created_at || 0) - (currentMsg.created_at || 0);
        if (timeDiff < 30000) {
          continue;
        }
      }
    }

    result.push(currentMsg);
  }

  return result;
};

export function MessageList({
  messages,
  style,
  isDark = false,
  customRenderer,
  botAvatars = {},
  botNames = {},
  nameToIdMap = {},
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [prevMessagesLength, setPrevMessagesLength] = useState(0);
  const [isInitialRender, setIsInitialRender] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 20;
    setIsScrolledToBottom(isBottom);
  };

  const scrollToBottom = (smooth = false) => {
    if (!scrollRef.current) return;

    // 使用带有选项的scrollTo方法实现平滑滚动
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // 自动滚动到底部
  useEffect(() => {
    // 如果是初次加载或已滚动到底部或消息数增加，则滚动到底部
    if (
      isInitialRender ||
      isScrolledToBottom ||
      messages.length > prevMessagesLength
    ) {
      // 对新会话使用即时滚动，对同一会话的新消息使用平滑滚动
      const shouldUseSmooth =
        !isInitialRender &&
        prevMessagesLength > 0 &&
        messages.length - prevMessagesLength <= 2;

      // 使用requestAnimationFrame确保DOM更新后再滚动
      requestAnimationFrame(() => {
        scrollToBottom(shouldUseSmooth);

        // 只在第一次渲染后将初始渲染标志设为false
        if (isInitialRender) {
          setIsInitialRender(false);
        }
      });
    }

    // 更新前一次的消息长度，用于比较
    setPrevMessagesLength(messages.length);
  }, [messages, isScrolledToBottom, isInitialRender, prevMessagesLength]);

  // 检查是否显示发送者信息
  const shouldShowSender = (
    message: ChatMessageType,
    index: number,
    messages: ChatMessageType[]
  ) => {
    return true;
  };

  const deduplicatedMessages = useMemo(
    () => getDeduplicatedMessages(messages),
    [messages]
  );

  return (
    <ScrollArea
      style={style}
      viewportRef={scrollRef}
      offsetScrollbars
      onScrollPositionChange={handleScroll}
    >
      <Stack gap="xs" p="sm">
        {deduplicatedMessages.map((message, index) => (
          <MessageItem
            key={message.id}
            message={message}
            isDark={isDark}
            customRenderer={customRenderer}
            showSender={shouldShowSender(message, index, deduplicatedMessages)}
            botAvatars={botAvatars}
            botNames={botNames}
            nameToIdMap={nameToIdMap}
          />
        ))}
      </Stack>
    </ScrollArea>
  );
}

// 创建思考中动画组件
const ThinkingAnimation = ({ isDark }: { isDark: boolean }) => {
  return (
    <Center>
      <Loader
        size="sm"
        color={isDark ? 'gray.5' : 'blue.5'}
        type="dots"
        style={{ marginRight: 8 }}
      />
    </Center>
  );
};

function MessageItem({
  message,
  isDark,
  customRenderer,
  showSender,
  botAvatars,
  botNames,
  nameToIdMap = {},
}: {
  message: ChatMessageType;
  isDark: boolean;
  customRenderer?: (message: ChatMessageType) => React.ReactNode;
  showSender: boolean;
  botAvatars: Record<string, string>;
  botNames: Record<string, string>;
  nameToIdMap?: Record<string, string>;
}) {
  const isUser = message.role === 'user';
  const originalBotId = message.bot_id || '';
  const isThinking = !!message.isThinking;

  const transparentAvatarUrl =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='; // 一个1x1的透明PNG

  // 提取前缀角色名和实际内容
  const parseMessageContent = () => {
    const content = message.content;

    // 如果消息在思考中状态，不显示角色信息
    if (isThinking) {
      return {
        sender: '',
        // 可配置
        content: '...',
        showAvatar: true,
        botId: originalBotId,
      };
    }

    if (content.includes('|')) {
      const parts = content.split('|');
      const senderName = parts[0].trim();
      return {
        sender: senderName,
        content: parts.slice(1).join('|').trim(),
        showAvatar: true,
        botId: nameToIdMap[senderName],
      };
    }

    // 没有角色前缀，返回默认前缀
    return {
      sender:
        message.role === 'user' ? '玩家' : botNames[originalBotId] || '助手',
      content: content,
      showAvatar: true,
      botId: originalBotId,
    };
  };

  const { sender, content, showAvatar, botId } = parseMessageContent();
  const avatarUrl = !isUser ? botAvatars[botId] : '';

  return (
    <Box mb={8}>
      {/* 助手名称 - 只在非思考中状态且是助手消息时显示 */}
      {!isUser && showSender && showAvatar && sender && (
        <Text
          size="xs"
          fw={500}
          c={isDark ? '#E6E6E7' : 'gray.6'}
          ml={48} // 与头像对齐
          mb={4}
        >
          {sender}
        </Text>
      )}

      <Flex
        justify={isUser ? 'flex-end' : 'flex-start'}
        align="flex-start"
        wrap="nowrap"
        gap={8}
      >
        {/* 助手端显示头像 - 只在非思考中状态显示 */}
        {!isUser && showSender && showAvatar && (
          <Avatar
            src={message.isThinking ? transparentAvatarUrl : avatarUrl} // 思考中时不显示头像图片，但保留占位
            color="blue"
            radius="xl"
            size="md"
            style={{
              border: isDark ? '1px solid #373A40' : '1px solid #e9ecef',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
              opacity: message.isThinking ? 0.4 : 1, // 思考中状态下透明度降低
            }}
          >
            <IconRobot size={18} />
          </Avatar>
        )}

        <Box style={{ maxWidth: '80%' }}>
          {/* 消息气泡 */}
          <Paper
            shadow="sm"
            radius="md"
            p="sm"
            withBorder={false}
            style={{
              backgroundColor: isUser
                ? isDark
                  ? 'rgba(76, 122, 250, 0.7)' // 增加用户消息的不透明度
                  : 'rgba(227, 242, 253, 0.92)'
                : isDark
                ? message.isThinking
                  ? 'rgba(37, 38, 43, 0.4)'
                  : 'rgba(37, 38, 43, 0.7)' // 增加助手消息的不透明度
                : message.isThinking
                ? 'rgba(240, 240, 240, 0.4)'
                : 'rgba(255, 255, 255, 0.92)',
              border: isUser
                ? `1px solid ${
                    isDark
                      ? 'rgba(76, 122, 250, 0.8)'
                      : 'rgba(145, 202, 255, 0.9)'
                  }`
                : `1px solid ${
                    isDark
                      ? 'rgba(55, 58, 64, 0.8)'
                      : 'rgba(233, 236, 239, 0.9)'
                  }`,
              boxShadow: isDark
                ? '0 4px 8px rgba(0, 0, 0, 0.25)' // 增强阴影
                : '0 2px 6px rgba(0, 0, 0, 0.12)',
              // backdropFilter: 'blur(5px)', // 添加模糊效果，增加文本的可读性
              fontStyle: message.isThinking ? 'italic' : 'normal',
              opacity: message.isThinking ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {customRenderer ? (
              customRenderer({ ...message, content })
            ) : (
              <Text
                size="sm"
                style={{
                  wordBreak: 'break-word',
                  color: isDark ? '#E6E6E7' : isUser ? '#333' : '#212529', // 增强浅色模式下文字颜色对比度
                  lineHeight: 1.6,
                  letterSpacing: '0.01em',
                  fontWeight: message.isThinking ? 400 : 450, // 非思考状态字体稍微加粗
                }}
              >
                {content}
              </Text>
            )}
          </Paper>
        </Box>

        {/* 用户端显示头像 */}
        {isUser && showSender && (
          <Avatar
            color="blue"
            radius="xl"
            size="md"
            style={{
              border: isDark ? '1px solid #373A40' : '1px solid #e9ecef',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}
          >
            <IconUser size={18} />
          </Avatar>
        )}
      </Flex>
    </Box>
  );
}
