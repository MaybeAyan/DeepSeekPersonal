import { useState } from 'react';
import {
  MantineProvider,
  createTheme,
  ColorSchemeScript,
  MantineTheme,
  localStorageColorSchemeManager,
} from '@mantine/core';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { ChatPage } from './pages/ChatPage';
import { Login } from './components/Login';
import { ChatSettings } from './types';
import { useAuth } from './features/auth/hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { UserProvider } from './contexts/UserContext';

// 创建颜色方案管理器
const colorSchemeManager = localStorageColorSchemeManager({
  key: 'mantine-color-scheme',
});

// 创建更适合PC端的主题
const theme = createTheme({
  fontFamily:
    'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      'SF Pro Display, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
  },
  fontSmoothing: true,
  // 暗色模式下的组件样式可以在这里配置
  components: {
    Button: {
      styles: () => ({
        root: {
          fontWeight: 500,
          borderRadius: '8px',
        },
      }),
    },
    Paper: {
      styles: (theme: MantineTheme) => ({
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
          borderColor: theme.colors.dark[4],
          backgroundColor: theme.white,
          color: theme.black,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'optimizeLegibility',
        },
      }),
    },
    AppShell: {
      styles: (theme: MantineTheme) => ({
        main: {
          backgroundColor: theme.colors.gray[0],
        },
      }),
    },
    ActionIcon: {
      styles: (theme: MantineTheme) => ({
        root: {
          '&[dataVariant="subtle"]:hover': {
            backgroundColor: theme.colors.gray[1],
          },
        },
      }),
    },
    Text: {
      styles: (theme: MantineTheme) => ({
        root: {
          color: theme.black,
        },
      }),
    },
  },
  breakpoints: {
    xs: '36em',
    sm: '48em',
    md: '62em',
    lg: '75em',
    xl: '88em',
  },
});

function AppContent() {
  const { colorScheme, toggleColorScheme } = useTheme();
  const { isLoggedIn, handleLogin, handleLogout } = useAuth();
  const [settings, setSettings] = useState<ChatSettings>({
    temperature: 0.7,
    maxTokens: 500,
    model: 'deepseek-chat',
    streamMode: true,
  });

  const updateSettings = (newSettings: Partial<ChatSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isLoggedIn ? <Navigate to="/" /> : <Login onLogin={handleLogin} />
        }
      />
      <Route
        path="/"
        element={
          isLoggedIn ? (
            <ChatPage
              toggleColorScheme={toggleColorScheme}
              colorScheme={colorScheme}
              onLogout={handleLogout}
              settings={settings}
              updateSettings={updateSettings}
            />
          ) : (
            <Navigate to="/login" />
          )
        }
      />
    </Routes>
  );
}

function App() {
  return (
    <>
      <ColorSchemeScript />
      <MantineProvider
        theme={theme}
        defaultColorScheme="light"
        colorSchemeManager={colorSchemeManager}
      >
        <UserProvider>
          <Router>
            <AppContent />
          </Router>
        </UserProvider>
      </MantineProvider>
    </>
  );
}

export default App;
