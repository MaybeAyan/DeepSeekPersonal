import { useState } from 'react';
import {
  Box,
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Group,
  Title,
  Stack,
  Text,
  useMantineTheme,
  Flex,
} from '@mantine/core';
import { IconUser, IconLock } from '@tabler/icons-react';

interface LoginProps {
  onLogin: (phoneNo: string, code: number) => Promise<boolean>;
}

export function Login({ onLogin }: LoginProps) {
  const [phoneNo, setPhoneNo] = useState('');
  const [code, setCode] = useState<string>(''); // 初始化 code 为数字类型
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const theme = useMantineTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const codeNumber = code ? parseInt(code, 10) : 0;
      const success = await onLogin(phoneNo, codeNumber);
      if (!success) {
        setError('用户名或密码错误');
      }
    } catch (err) {
      setError('登录过程中发生错误');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme.colors.dark[0] !== undefined;

  return (
    <Box
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: isDark ? theme.colors.dark[8] : theme.colors.gray[0],
      }}
    >
      <Paper
        radius="md"
        p="xl"
        withBorder
        style={{
          width: '100%',
          maxWidth: 420,
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Title order={2} ta="center" mt="md" mb={30}>
          欢迎使用 AI 智能体
        </Title>

        <form onSubmit={handleSubmit}>
          <Stack>
            <TextInput
              required
              label="手机号"
              placeholder="请输入您的手机号"
              value={phoneNo}
              onChange={(event) => setPhoneNo(event.currentTarget.value)}
              leftSection={<IconUser size={16} />}
              size="md"
            />

            <Box>
              <Text size="sm" fw={500} mb={5}>
                验证码
              </Text>
              <Flex gap="md" align="center">
                <TextInput
                  required
                  placeholder="请输入验证码"
                  value={code}
                  onChange={(event) => {
                    // 直接存储字符串，不需要转换
                    const val = event.currentTarget.value;
                    // 只允许数字输入
                    if (val === '' || /^[0-9]*$/.test(val)) {
                      setCode(val);
                    }
                  }}
                  leftSection={<IconLock size={16} />}
                  size="md"
                  style={{ flex: 1 }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <Button
                  variant="light"
                  color="blue"
                  size="md"
                  type="button"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  获取验证码
                </Button>
              </Flex>
            </Box>

            {error && (
              <Text color="red" size="sm">
                {error}
              </Text>
            )}
          </Stack>

          <Group justify="space-between" mt="xl">
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              type="submit"
              loading={loading}
            >
              登录
            </Button>
          </Group>
        </form>
      </Paper>
    </Box>
  );
}
