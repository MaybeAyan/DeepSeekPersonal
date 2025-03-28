import {
  Box,
  Text,
  Avatar,
  ScrollArea,
  Stack,
  Skeleton,
  Tooltip,
  Paper,
  ActionIcon,
  Group,
  Card,
} from '@mantine/core';
import { NpcBot } from '../../api/npc';
import { IconRobot, IconRefresh } from '@tabler/icons-react';
import React, { useCallback } from 'react';

interface NpcBotListProps {
  isDark: boolean;
  onSelectBot: (bot: NpcBot) => void;
  selectedBotId: string | null;
  bots: NpcBot[];
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  isMobile?: boolean;
}

export const NpcBotList = React.memo(function NpcBotList({
  isDark,
  onSelectBot,
  selectedBotId,
  bots,
  loading,
  error,
  onRefresh,
  isMobile = false,
}: NpcBotListProps) {
  // 添加防抖处理
  const handleRefresh = useCallback(() => {
    if (!loading) {
      onRefresh();
    }
  }, [loading, onRefresh]);

  // 移动端渲染为水平滑动列表
  if (isMobile) {
    return (
      <Box
        p="xs"
        style={{
          width: '100%',
          backgroundColor: isDark
            ? 'rgba(26, 27, 30, 0.6)'
            : 'rgba(255, 255, 255, 0.6)',
          borderRadius: '12px',
          backdropFilter: 'blur(5px)',
        }}
      >
        <Group justify="apart" mb={8}>
          <Text size="xs" fw={500} c={isDark ? 'gray.4' : 'gray.7'}>
            选择角色
          </Text>
          <ActionIcon
            size="xs"
            variant="subtle"
            onClick={handleRefresh}
            loading={loading}
          >
            <IconRefresh size={14} />
          </ActionIcon>
        </Group>

        <ScrollArea
          type="auto"
          scrollbarSize={4}
          offsetScrollbars
          styles={{
            viewport: {
              whiteSpace: 'nowrap',
            },
          }}
        >
          <Group gap={12} wrap="nowrap">
            {loading ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <Skeleton key={i} height={60} width={60} radius="md" />
                ))
            ) : error ? (
              <Text size="xs" c="dimmed">
                加载失败
              </Text>
            ) : bots && bots.length > 0 ? (
              bots.map((bot) => (
                <Tooltip
                  key={bot.bot_id}
                  label={bot.bot_name || '未命名角色'}
                  position="top"
                  withArrow
                >
                  <Card
                    shadow={selectedBotId === bot.bot_id ? 'md' : 'sm'}
                    padding={8}
                    radius="md"
                    style={{
                      cursor: 'pointer',
                      width: 60,
                      height: 60,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor:
                        selectedBotId === bot.bot_id
                          ? isDark
                            ? 'rgba(76, 122, 250, 0.2)'
                            : 'rgba(76, 122, 250, 0.15)'
                          : isDark
                          ? 'rgba(37, 38, 43, 0.7)'
                          : 'white',
                      border:
                        selectedBotId === bot.bot_id
                          ? `2px solid ${isDark ? '#4c7afa' : '#4c7afa'}`
                          : `1px solid ${
                              isDark
                                ? 'rgba(44, 46, 51, 0.5)'
                                : 'rgba(238, 238, 238, 0.8)'
                            }`,
                      transition: 'all 0.15s ease',
                      transform:
                        selectedBotId === bot.bot_id
                          ? 'scale(1.05)'
                          : 'scale(1)',
                    }}
                    onClick={() => onSelectBot(bot)}
                  >
                    <Avatar
                      src={bot.icon_url}
                      radius="md"
                      size="md"
                      color={selectedBotId === bot.bot_id ? 'blue' : 'gray'}
                      style={{
                        border: 'none',
                      }}
                    >
                      <IconRobot size={20} />
                    </Avatar>
                  </Card>
                </Tooltip>
              ))
            ) : (
              <Text size="xs" c="dimmed">
                暂无角色
              </Text>
            )}
          </Group>
        </ScrollArea>
      </Box>
    );
  }

  // 桌面端渲染为垂直列表
  return (
    <Paper
      shadow="sm"
      radius="lg"
      style={{
        width: '120px', // 增加宽度
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: isDark
          ? 'rgba(26, 27, 30, 0.9)'
          : 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${
          isDark ? 'rgba(44, 46, 51, 0.5)' : 'rgba(238, 238, 238, 0.8)'
        }`,
      }}
    >
      <Group justify="center" p="xs">
        <ActionIcon
          variant="light"
          color={isDark ? 'blue.5' : 'blue.5'}
          radius="xl"
          size="md"
          mt={6}
          onClick={handleRefresh}
          title="刷新角色列表"
          loading={loading}
        >
          <IconRefresh size={16} />
        </ActionIcon>
      </Group>

      <ScrollArea style={{ flex: 1 }} offsetScrollbars scrollbarSize={4}>
        {loading ? (
          <Stack p="xs" gap="sm" align="center">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} height={90} width={90} radius="md" />
            ))}
          </Stack>
        ) : error ? (
          <Box p="xs" style={{ textAlign: 'center' }}>
            <Text c="dimmed" size="xs">
              加载失败
            </Text>
          </Box>
        ) : bots && bots.length > 0 ? (
          <Stack p="md" gap="md" align="center">
            {bots.map((bot) => (
              <Tooltip
                key={bot.bot_id}
                label={
                  <Box p="xs">
                    <Text fw={600} size="sm" c={isDark ? 'white' : 'dark.8'}>
                      {bot.bot_name || '未命名角色'}
                    </Text>
                    {bot.description && (
                      <Text size="xs" mt="xs" c={isDark ? 'gray.3' : 'gray.7'}>
                        {bot.description}
                      </Text>
                    )}
                  </Box>
                }
                position="right"
                withArrow
                multiline
                w={320}
                styles={{
                  tooltip: {
                    backgroundColor: isDark
                      ? 'rgba(37, 38, 43, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                    color: isDark ? '#C1C2C5' : '#333',
                    border: `1px solid ${isDark ? '#2C2E33' : '#eee'}`,
                    backdropFilter: 'blur(4px)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
                  },
                  arrow: {
                    backgroundColor: isDark
                      ? 'rgba(37, 38, 43, 0.95)'
                      : 'rgba(255, 255, 255, 0.95)',
                    border: `1px solid ${isDark ? '#2C2E33' : '#eee'}`,
                  },
                }}
              >
                <Card
                  shadow={selectedBotId === bot.bot_id ? 'md' : 'sm'}
                  padding="sm"
                  radius="md"
                  style={{
                    cursor: 'pointer',
                    width: 88,
                    height: 100, // 近似正方形
                    backgroundColor:
                      selectedBotId === bot.bot_id
                        ? isDark
                          ? 'rgba(76, 122, 250, 0.2)'
                          : 'rgba(76, 122, 250, 0.15)'
                        : isDark
                        ? 'rgba(37, 38, 43, 0.7)'
                        : 'white',
                    border:
                      selectedBotId === bot.bot_id
                        ? `2px solid ${isDark ? '#4c7afa' : '#4c7afa'}`
                        : `1px solid ${
                            isDark
                              ? 'rgba(44, 46, 51, 0.5)'
                              : 'rgba(238, 238, 238, 0.8)'
                          }`,
                    transition: 'all 0.2s ease',
                    transform: `scale(${
                      selectedBotId === bot.bot_id ? 1.02 : 1
                    })`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onClick={() => onSelectBot(bot)}
                >
                  <Avatar
                    src={bot.icon_url}
                    radius="md"
                    size="lg"
                    color={selectedBotId === bot.bot_id ? 'blue' : 'gray'}
                    style={{
                      border: 'none',
                      marginBottom: '6px',
                    }}
                  >
                    <IconRobot size={24} />
                  </Avatar>
                  <Text
                    size="xs"
                    fw={selectedBotId === bot.bot_id ? 600 : 400}
                    style={{
                      fontSize: '12px',
                      maxWidth: '80px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      textAlign: 'center',
                      color:
                        selectedBotId === bot.bot_id
                          ? isDark
                            ? '#4c7afa'
                            : '#4c7afa'
                          : isDark
                          ? '#C1C2C5'
                          : '#333',
                    }}
                  >
                    {bot.bot_name || '未命名'}
                  </Text>
                </Card>
              </Tooltip>
            ))}
          </Stack>
        ) : (
          <Box p="xs" style={{ textAlign: 'center' }}>
            <Text c="dimmed" size="xs">
              暂无角色
            </Text>
          </Box>
        )}
      </ScrollArea>
    </Paper>
  );
});
