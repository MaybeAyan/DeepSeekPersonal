import { FC } from 'react';
import {
  Modal,
  Group,
  Box,
  Text,
  Slider,
  NumberInput,
  Select,
  Stack,
  Tooltip,
  SegmentedControl,
} from '@mantine/core';
import { ChatSettings } from '../types';
import { IconSettings, IconInfoCircle } from '@tabler/icons-react';

interface SettingsModalProps {
  opened: boolean;
  onClose: () => void;
  settings: ChatSettings;
  onSettingsChange: (settings: Partial<ChatSettings>) => void;
  isDark: boolean;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  opened,
  onClose,
  settings,
  onSettingsChange,
}) => {
  const models = [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconSettings size={20} />
          <Text fw={500}>对话设置</Text>
        </Group>
      }
      centered
      size="md"
      padding="md"
    >
      <Stack gap="lg" mt="md">
        {/* Temperature 设置 */}
        <Box>
          <Group mb={5} align="center">
            <Text size="sm" fw={500}>
              温度 ({settings.temperature})
            </Text>
            <Tooltip
              label="较高的值使输出更随机多样，较低的值使输出更确定和集中"
              position="right"
              withArrow
            >
              <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
            </Tooltip>
          </Group>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={settings.temperature}
            onChange={(value) => onSettingsChange({ temperature: value })}
            // marks={[
            //   { value: 0, label: '精确' },
            //   { value: 0.5, label: '平衡' },
            //   { value: 1, label: '创意' },
            // ]}
          />
        </Box>

        {/* 模型选择 */}
        <Group align="flex-start" mt={10} mb={5}>
          <Select
            label={
              <Group gap={5} mb={5}>
                <Text size="sm" fw={500}>
                  AI 模型
                </Text>
                <Tooltip
                  label="不同模型具有不同的专长和能力"
                  position="right"
                  withArrow
                >
                  <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
                </Tooltip>
              </Group>
            }
            data={models}
            value={settings.model}
            onChange={(value) =>
              onSettingsChange({ model: value || 'deepseek-chat' })
            }
            style={{ flex: 1 }}
          />

          <NumberInput
            label={
              <Group gap={5} mb={5}>
                <Text size="sm" fw={500}>
                  最大输出长度
                </Text>
                <Tooltip
                  label="控制AI回复的最大token数量"
                  position="right"
                  withArrow
                >
                  <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
                </Tooltip>
              </Group>
            }
            value={settings.maxTokens}
            onChange={(val) =>
              onSettingsChange({
                maxTokens: val !== '' ? Number(val) : 500,
              })
            }
            min={1}
            max={2000}
            style={{ width: '40%' }}
          />
        </Group>

        {/* 流式响应设置 */}
        <Box>
          <Group mb={5} align="center">
            <Text size="sm" fw={500}>
              响应模式
            </Text>
            <Tooltip
              label="流式响应可实时显示AI生成过程，完整响应则等待全部生成后一次性显示"
              position="right"
              withArrow
            >
              <IconInfoCircle size={16} style={{ opacity: 0.5 }} />
            </Tooltip>
          </Group>
          <SegmentedControl
            value={settings.streamMode ? 'stream' : 'normal'}
            onChange={(value) =>
              onSettingsChange({ streamMode: value === 'stream' })
            }
            data={[
              { label: '流式响应', value: 'stream' },
              { label: '完整响应', value: 'normal' },
            ]}
            fullWidth
          />
        </Box>
      </Stack>
    </Modal>
  );
};
