/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC, useMemo } from 'react';
import { Box, Text, Avatar, Group, useMantineTheme } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { CodeHighlight } from '../CodeHighlight';
import { ChatMessage as ChatMessageType } from '../../types';
import { IconRobot, IconUser } from '@tabler/icons-react';

interface ChatMessageProps {
  message: ChatMessageType;
  isDark?: boolean;
}

export const ChatMessage: FC<ChatMessageProps> = ({
  message,
  isDark = false,
}) => {
  const isUser = message.role === 'user';
  const theme = useMantineTheme();

  // 使用 useMemo 缓存 ReactMarkdown 组件，避免不必要的重新渲染
  const markdownContent = useMemo(() => {
    return (
      <ReactMarkdown
        components={{
          p: ({ ...props }) => (
            <Text
              size="sm" // 修改为 sm
              className="message-text"
              style={{
                fontSize: '15px', // 修改字体大小
                lineHeight: 1.6,
                letterSpacing: '0.02em', // 修改字距
                fontWeight: 400,
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          h1: ({ ...props }) => (
            <Text
              size="xl"
              fw={700}
              mb="md"
              mt="lg"
              style={{
                fontSize: '21px',
                lineHeight: 1.4,
                letterSpacing: '0.02em',
                borderBottom: isDark
                  ? '1px solid #2C2E33'
                  : '1px solid #e9ecef',
                paddingBottom: '8px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          h2: ({ ...props }) => (
            <Text
              size="lg"
              fw={700}
              mb="sm"
              mt="md"
              style={{
                fontSize: '19px',
                lineHeight: 1.4,
                letterSpacing: '0.02em',
                borderBottom: isDark
                  ? '1px solid #2C2E33'
                  : '1px solid #e9ecef',
                paddingBottom: '6px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          h3: ({ ...props }) => (
            <Text
              size="md"
              fw={700}
              mb="xs"
              mt="sm"
              style={{
                fontSize: '17px',
                lineHeight: 1.5,
                letterSpacing: '0.02em',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          h4: ({ ...props }) => (
            <Text
              size="md"
              fw={600}
              mb="xs"
              style={{
                fontSize: '15px',
                lineHeight: 1.5,
                letterSpacing: '0.02em',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          ul: ({ ...props }) => (
            <Box
              component="ul"
              style={{
                paddingLeft: 24,
                fontSize: '15px',
                marginTop: '8px',
                marginBottom: '16px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          ol: ({ ...props }) => (
            <Box
              component="ol"
              style={{
                paddingLeft: 24,
                fontSize: '15px',
                marginTop: '8px',
                marginBottom: '16px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          li: ({ ...props }) => (
            <Box
              component="li"
              style={{
                fontSize: '15px',
                marginBottom: 8,
                lineHeight: 1.6,
                letterSpacing: '0.02em',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          blockquote: ({ ...props }) => (
            <Box
              component="blockquote"
              style={{
                borderLeft: `4px solid ${isDark ? '#4c5c96' : '#90caf9'}`,
                paddingLeft: 16,
                margin: '16px 0',
                color: isDark ? '#a9b1d6' : '#555',
                fontStyle: 'italic',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          a: ({ ...props }) => (
            <Text
              component="a"
              variant="link"
              style={{
                color: isDark ? '#90caf9' : '#1976d2',
                textDecoration: 'none',
                fontWeight: 500,
                '&:hover': {
                  textDecoration: 'underline',
                },
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          img: ({ ...props }) => (
            <Box
              component="img"
              style={{
                maxWidth: '100%',
                margin: '16px 0',
                borderRadius: '8px',
                border: isDark ? '1px solid #2C2E33' : '1px solid #e9ecef',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          table: ({ ...props }) => (
            <Box
              component="table"
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: 16,
                marginBottom: 16,
                fontSize: '15px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          th: ({ ...props }) => (
            <Box
              component="th"
              style={{
                padding: '10px',
                textAlign: 'left',
                borderBottom: isDark
                  ? '2px solid #2C2E33'
                  : '2px solid #e9ecef',
                fontSize: '15px',
                fontWeight: 600,
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          td: ({ ...props }) => (
            <Box
              component="td"
              style={{
                padding: '10px',
                borderBottom: isDark
                  ? '1px solid #2C2E33'
                  : '1px solid #e9ecef',
                fontSize: '15px',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          hr: ({ ...props }) => (
            <Box
              component="hr"
              style={{
                border: 0,
                height: '1px',
                backgroundColor: isDark ? '#2C2E33' : '#e9ecef',
                margin: '16px 0',
                fontFamily:
                  'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif', // 添加苹果字体
              }}
              {...props}
            />
          ),
          code: ({ className, children, inline }: any) => {
            if (inline) {
              return (
                <code
                  className="inline-code"
                  style={{
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.1)',
                    fontSize: '13px',
                  }}
                >
                  {String(children)}
                </code>
              );
            }

            const match = /language-(\w+)/.exec(className || '');
            const lang = match ? match[1] : '';
            const codeContent = String(children).replace(/\n$/, '');

            return (
              <CodeHighlight
                code={codeContent}
                language={lang}
                inline={false}
                isDark={isDark}
              />
            );
          },
        }}
      >
        {message.content}
      </ReactMarkdown>
    );
  }, [message, isDark]);

  return (
    <Box
      py="xs"
      px="md"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start', // 保持消息卡片对齐方式
        marginBottom: '8px',
      }}
    >
      <Group
        align="apart"
        mb="xs"
        style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
      >
        {/* DeepSeek 的头像和用户名 */}
        {!isUser && (
          <>
            <Avatar
              radius="xl"
              size="sm"
              color="teal"
              style={{
                backgroundColor: theme.colors.gray[2],
                color: theme.white,
              }}
            >
              <IconRobot size={16} />
            </Avatar>
            <Text
              size="sm"
              color="dimmed"
              style={{ fontWeight: 600, letterSpacing: '0.01em' }}
            >
              DeepSeek
            </Text>
          </>
        )}

        {/* 用户的头像和用户名 */}
        {isUser && (
          <>
            <Text
              size="sm"
              color="dimmed"
              style={{ fontWeight: 600, letterSpacing: '0.01em' }}
            >
              You
            </Text>
            <Avatar
              radius="xl"
              size="sm"
              color="blue"
              style={{
                backgroundColor: theme.colors.blue[6],
                color: theme.white,
              }}
            >
              <IconUser size={16} color={theme.white} />
            </Avatar>
          </>
        )}
      </Group>
      <Box
        style={{
          maxWidth: '70%',
          backgroundColor: isUser
            ? theme.colors.blue[4]
            : isDark
            ? theme.colors.dark[6]
            : theme.colors.gray[0], // 调整底色
          borderRadius: isUser ? '10px 0 10px 10px' : '0 10px 10px 10px',
          padding: '10px 14px',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)', // 添加阴影，增加质感
          fontSize: '16px', // 统一字体大小
          lineHeight: 1.6, // 统一行高
          letterSpacing: '0.01em', // 统一字距
        }}
      >
        {isUser ? (
          <Text
            size="sm"
            style={{ color: 'white', fontWeight: 500, letterSpacing: '0.05em' }}
          >
            {message.content}
          </Text>
        ) : (
          markdownContent // 使用缓存的 ReactMarkdown 组件
        )}
      </Box>
    </Box>
  );
};
