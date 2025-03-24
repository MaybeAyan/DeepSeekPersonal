/* eslint-disable @typescript-eslint/no-explicit-any */
import { FC } from 'react';
import { Box, Text, Avatar, Group } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { CodeHighlight } from './CodeHighlight';
import { ChatMessage as ChatMessageType } from '../types';
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

  return (
    <Box
      py="md"
      style={{
        borderBottom: `1px solid ${
          isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
        }`,
      }}
    >
      <Group align="flex-start" gap="md" wrap="nowrap">
        <Avatar
          radius="xl"
          size="md"
          color={isUser ? 'blue' : 'teal'}
          style={{
            backgroundColor: isUser
              ? isDark
                ? '#1E40AF'
                : '#E1F0FF'
              : isDark
              ? '#064E3B'
              : '#ECFDF5',
          }}
        >
          {isUser ? (
            <IconUser
              size={18}
              color={
                isUser && isDark ? '#93C5FD' : isUser ? '#3B82F6' : undefined
              }
            />
          ) : (
            <IconRobot
              size={18}
              color={
                !isUser && isDark ? '#6EE7B7' : !isUser ? '#10B981' : undefined
              }
            />
          )}
        </Avatar>

        <Box
          style={{
            flex: 1,
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
          }}
        >
          <Text
            size="sm"
            fw={600}
            mb={2}
            color={
              isUser
                ? isDark
                  ? '#93C5FD'
                  : '#3B82F6'
                : isDark
                ? '#6EE7B7'
                : '#10B981'
            }
          >
            {isUser ? 'YOU' : 'DEEPSEEK'}
          </Text>

          {isUser ? (
            <Text
              color={isDark ? 'gray.1' : 'inherit'}
              size="md"
              style={{
                fontSize: '16px',
                lineHeight: 1.5,
                letterSpacing: '0.01em',
              }}
            >
              {message.content}
            </Text>
          ) : (
            <ReactMarkdown
              components={{
                p: ({ ...props }) => (
                  <Text
                    size="md"
                    className="message-text"
                    style={{
                      fontSize: '16px',
                      lineHeight: 1.6,
                      letterSpacing: '0.01em',
                      fontWeight: 400,
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
                      fontSize: '22px',
                      lineHeight: 1.4,
                      letterSpacing: '0.01em',
                      borderBottom: isDark
                        ? '1px solid #2C2E33'
                        : '1px solid #e9ecef',
                      paddingBottom: '8px',
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
                      fontSize: '20px',
                      lineHeight: 1.4,
                      letterSpacing: '0.01em',
                      borderBottom: isDark
                        ? '1px solid #2C2E33'
                        : '1px solid #e9ecef',
                      paddingBottom: '6px',
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
                      fontSize: '18px',
                      lineHeight: 1.5,
                      letterSpacing: '0.01em',
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
                      fontSize: '16px',
                      lineHeight: 1.5,
                      letterSpacing: '0.01em',
                    }}
                    {...props}
                  />
                ),
                ul: ({ ...props }) => (
                  <Box
                    component="ul"
                    style={{
                      paddingLeft: 24,
                      fontSize: '16px',
                      marginTop: '8px',
                      marginBottom: '16px',
                    }}
                    {...props}
                  />
                ),
                ol: ({ ...props }) => (
                  <Box
                    component="ol"
                    style={{
                      paddingLeft: 24,
                      fontSize: '16px',
                      marginTop: '8px',
                      marginBottom: '16px',
                    }}
                    {...props}
                  />
                ),
                li: ({ ...props }) => (
                  <Box
                    component="li"
                    style={{
                      fontSize: '16px',
                      marginBottom: 8,
                      lineHeight: 1.6,
                      letterSpacing: '0.01em',
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
                      border: isDark
                        ? '1px solid #2C2E33'
                        : '1px solid #e9ecef',
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
                      fontSize: '16px',
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
                      fontSize: '16px',
                      fontWeight: 600,
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
                      fontSize: '16px',
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
          )}
        </Box>
      </Group>
    </Box>
  );
};
