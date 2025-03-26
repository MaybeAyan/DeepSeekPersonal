import {
  Paper,
  Box,
  Title,
  Text,
  Group,
  Avatar,
  ScrollArea,
  Stack,
  Skeleton,
  ActionIcon,
} from '@mantine/core';
import { NpcBot } from '../../api/npc';
import { IconRefresh, IconRobot } from '@tabler/icons-react';
import React, { useCallback } from 'react';

interface NpcBotListProps {
  isDark: boolean;
  onSelectBot: (bot: NpcBot) => void;
  selectedBotId?: string;
  bots: NpcBot[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export const NpcBotList = React.memo(function NpcBotList({
  isDark,
  onSelectBot,
  selectedBotId,
  bots,
  loading,
  error,
  onRefresh,
}: NpcBotListProps) {
  // 添加防抖处理
  const handleRefresh = useCallback(() => {
    if (!loading) {
      onRefresh();
    }
  }, [loading, onRefresh]);

  return (
    <Paper
      shadow="md"
      radius="lg"
      style={{
        width: '250px',
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark ? '#1A1B1E' : 'white',
      }}
    >
      <Box
        p="md"
        style={{ borderBottom: `1px solid ${isDark ? '#2C2E33' : '#eee'}` }}
      >
        <Group justify="space-between" align="center">
          <Title order={5} style={{ color: isDark ? '#C1C2C5' : '#333' }}>
            角色列表 {bots?.length ? `(${bots.length})` : ''}
          </Title>
          <ActionIcon
            variant="light"
            color={isDark ? 'blue.7' : 'blue.5'}
            radius="xl"
            size="md"
            onClick={handleRefresh}
            title="刷新列表"
            loading={loading}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>
      </Box>

      <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={6}>
        {loading ? (
          <Stack p="md" gap="sm">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} height={60} radius="md" />
            ))}
          </Stack>
        ) : error ? (
          <Box p="md" style={{ textAlign: 'center' }}>
            <Text c="red" size="sm">
              {error}
            </Text>
            <ActionIcon
              variant="subtle"
              color="blue"
              style={{ margin: '10px auto' }}
              onClick={onRefresh}
            >
              <IconRefresh size={20} />
            </ActionIcon>
          </Box>
        ) : bots && bots.length > 0 ? (
          <Stack p="md" gap="sm">
            {bots.map((bot) => (
              <Paper
                key={bot.bot_id}
                shadow="none"
                p="sm"
                radius="md"
                withBorder={selectedBotId === bot.bot_id}
                style={{
                  cursor: 'pointer',
                  backgroundColor:
                    selectedBotId === bot.bot_id
                      ? isDark
                        ? '#25262B'
                        : '#f8f9fa'
                      : 'transparent',
                  borderColor:
                    selectedBotId === bot.bot_id
                      ? isDark
                        ? '#4c7afa'
                        : '#4c7afa'
                      : 'transparent',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => onSelectBot(bot)}
              >
                <Group gap="sm">
                  <Avatar
                    src={bot.icon_url}
                    radius="xl"
                    size="md"
                    color={selectedBotId === bot.bot_id ? 'blue' : 'gray'}
                  >
                    <IconRobot size={20} />
                  </Avatar>
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      size="sm"
                      fw={selectedBotId === bot.bot_id ? 600 : 500}
                      lineClamp={1}
                    >
                      {bot.bot_name || '未命名角色'}
                    </Text>
                    {bot.description && (
                      <Text size="xs" c="dimmed" lineClamp={1}>
                        {bot.description}
                      </Text>
                    )}
                  </Box>
                </Group>
              </Paper>
            ))}
          </Stack>
        ) : (
          <Box p="md" style={{ textAlign: 'center' }}>
            <Text c="dimmed" size="sm">
              暂无角色数据
            </Text>
          </Box>
        )}
      </ScrollArea>
    </Paper>
  );
});
