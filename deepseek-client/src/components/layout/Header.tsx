import {
  Container,
  Group,
  Title,
  ActionIcon,
  Burger,
  useMantineTheme,
  AppShell,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconBrandOpenai,
  IconSun,
  IconMoon,
  IconBrandGithub,
  IconLogout,
  IconSettings,
} from '@tabler/icons-react';

interface HeaderProps {
  toggleColorScheme: (value?: 'light' | 'dark') => void;
  colorScheme: 'light' | 'dark';
  onLogout: () => void;
  sidebarVisible: boolean;
  setSidebarVisible: (visible: boolean) => void;
  setLogoutModalOpen: (open: boolean) => void;
  setSettingsOpened: (open: boolean) => void;
}

export function Header({
  toggleColorScheme,
  colorScheme,
  sidebarVisible,
  setSidebarVisible,
  setLogoutModalOpen,
  setSettingsOpened,
}: HeaderProps) {
  const isDark = colorScheme === 'dark';
  const theme = useMantineTheme();
  const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);
  const isTablet = useMediaQuery(`(max-width: ${theme.breakpoints.md})`);

  return (
    <AppShell.Header
      style={{
        backgroundColor: isDark ? '#1A1B1E' : 'white',
        borderBottom: `1px solid ${isDark ? '#2C2E33' : '#f0f0f0'}`,
        zIndex: 200,
      }}
    >
      <Container
        size="100%"
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <Group gap="sm">
          <Burger
            opened={sidebarVisible}
            onClick={() => setSidebarVisible(!sidebarVisible)}
            size="sm"
            color={isDark ? '#C1C2C5' : '#333'}
            mr="sm"
            display={isMobile || isTablet ? 'block' : 'none'}
          />
          <IconBrandOpenai size={28} color={isDark ? '#61AFEF' : '#5C7CFA'} />
          <Title
            order={3}
            style={{
              fontWeight: 600,
              color: isDark ? '#C1C2C5' : '#333',
            }}
          >
            DeepSeek Chat
          </Title>
        </Group>

        <Group gap="sm">
          <ActionIcon
            variant="subtle"
            size="lg"
            onClick={() => toggleColorScheme()}
            color={isDark ? 'gray.4' : 'gray.7'}
            radius="xl"
          >
            {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            size="lg"
            component="a"
            href="https://github.com/deepseek-ai/DeepSeek-Coder"
            target="_blank"
            color={isDark ? 'gray.4' : 'gray.7'}
            radius="xl"
          >
            <IconBrandGithub size={20} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            color={isDark ? 'blue.6' : 'blue.5'}
            size="lg"
            onClick={() => setSettingsOpened(true)}
            radius="xl"
          >
            <IconSettings size={20} />
          </ActionIcon>

          <ActionIcon
            variant="subtle"
            color={isDark ? 'red.6' : 'red.5'}
            size="lg"
            onClick={() => setLogoutModalOpen(true)}
            radius="xl"
          >
            <IconLogout size={20} />
          </ActionIcon>
        </Group>
      </Container>
    </AppShell.Header>
  );
}
