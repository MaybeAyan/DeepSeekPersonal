import { FC } from 'react';
import { Box, Text, Paper, useMantineColorScheme } from '@mantine/core';
import ReactMarkdown from 'react-markdown';
import { CodeHighlight } from './CodeHighlight';
import { ChatMessage as ChatMessageType } from '../types';

interface ChatMessageProps {
  message: ChatMessageType;
}

export const ChatMessage: FC<ChatMessageProps> = ({ message }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const isUser = message.role === 'user';

  return (
    <Box
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 12,
      }}
    >
      <Paper
        p="md"
        radius="md"
        style={{
          maxWidth: '85%',
          backgroundColor: isUser
            ? isDark
              ? '#1E3A8A'
              : '#e3f2fd'
            : isDark
            ? '#2C2E33'
            : '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Text
          size="sm"
          fw={700}
          color={
            isUser ? (isDark ? 'blue.3' : 'blue') : isDark ? 'teal.4' : 'green'
          }
          transform="uppercase" // 添加大写转换，增强视觉效果
          mb={10} // 增加下边距
          style={{
            letterSpacing: '0.03em', // 增加字间距
            opacity: 0.9, // 略微降低不透明度，使其与内容区分
          }}
        >
          {isUser ? 'You' : 'DeepSeek'}
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
                    border: isDark ? '1px solid #2C2E33' : '1px solid #e9ecef',
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
              code: ({ className, children, inline }) => {
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
      </Paper>
    </Box>
  );
};
