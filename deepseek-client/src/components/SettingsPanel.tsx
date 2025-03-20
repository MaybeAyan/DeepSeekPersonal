import { FC } from 'react';
import {
  Group,
  Box,
  Text,
  Slider,
  NumberInput,
  Button,
  Select,
} from '@mantine/core';
import { ChatSettings } from '../types';

interface SettingsPanelProps {
  settings: ChatSettings;
  onSettingsChange: (settings: Partial<ChatSettings>) => void;
  disabled: boolean;
}

export const SettingsPanel: FC<SettingsPanelProps> = ({
  settings,
  onSettingsChange,
  disabled,
}) => {
  const models = [
    { value: 'deepseek-chat', label: 'DeepSeek Chat' },
    { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  ];

  return (
    <Box style={{ padding: '0 0 16px 0', borderBottom: '1px solid #eee' }}>
      <Group justify="space-between" mb="md" align="flex-end" grow>
        <Box style={{ flex: 2 }}>
          <Text size="sm" fw={500} mb={5}>
            Temperature: {settings.temperature}
          </Text>
          <Slider
            min={0}
            max={1}
            step={0.1}
            value={settings.temperature}
            onChange={(value) => onSettingsChange({ temperature: value })}
            disabled={disabled}
          />
        </Box>

        <Select
          label="Model"
          data={models}
          value={settings.model}
          onChange={(value) =>
            onSettingsChange({ model: value || 'deepseek-chat' })
          }
          disabled={disabled}
          style={{ flex: 1 }}
        />

        <NumberInput
          label="Max Tokens"
          value={settings.maxTokens}
          onChange={(val) =>
            onSettingsChange({
              maxTokens: val !== '' ? Number(val) : 500,
            })
          }
          min={1}
          max={2000}
          disabled={disabled}
          style={{ flex: 1 }}
        />

        <Button
          variant={settings.streamMode ? 'filled' : 'outline'}
          onClick={() => onSettingsChange({ streamMode: !settings.streamMode })}
          disabled={disabled}
          style={{ alignSelf: 'flex-end' }}
        >
          {settings.streamMode ? 'Stream Mode' : 'Normal Mode'}
        </Button>
      </Group>
    </Box>
  );
};
