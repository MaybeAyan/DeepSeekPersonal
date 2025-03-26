import { FC, useState, KeyboardEvent } from 'react';
import { Textarea, Button, Group, Paper } from '@mantine/core';
import { IconSend, IconPlayerStop } from '@tabler/icons-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  onStopGeneration: () => void;
}

export const ChatInput: FC<ChatInputProps> = ({
  onSendMessage,
  isLoading,
  onStopGeneration,
}) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Paper
      p="xs"
      radius="lg"
      withBorder
      style={{
        backgroundColor: 'transparent',
        borderColor: 'rgba(134, 142, 150, 0.2)',
      }}
    >
      <Textarea
        placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
        value={input}
        onChange={(e) => setInput(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        autosize
        minRows={2}
        maxRows={6}
        radius="md"
        style={{
          width: '100%',
          fontSize: '15px',
          border: 'none',
        }}
        styles={{
          input: {
            border: 'none',
            backgroundColor: 'transparent',
          },
        }}
      />
      <Group justify="flex-end" gap="md" mt="xs">
        {isLoading && (
          <Button
            color="red"
            onClick={onStopGeneration}
            size="sm"
            variant="light"
            rightSection={<IconPlayerStop size={16} />}
            radius="md"
          >
            停止生成
          </Button>
        )}
        <Button
          onClick={handleSend}
          loading={isLoading}
          disabled={!input.trim()}
          size="sm"
          rightSection={<IconSend size={16} />}
          radius="md"
        >
          发送
        </Button>
      </Group>
    </Paper>
  );
};
