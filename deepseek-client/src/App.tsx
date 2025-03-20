import { useState, useEffect } from 'react';
import { MantineProvider, createTheme, ColorSchemeScript } from '@mantine/core';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Chat } from './components/Chat';

// 创建更适合PC端的主题
const theme = createTheme({
  fontFamily:
    'SF Pro Text, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
  headings: {
    fontFamily:
      'SF Pro Display, -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", Arial, sans-serif',
  },
  fontSmoothing: 'antialiased', // 确保全局字体平滑
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
      styles: (theme) => ({
        root: {
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.05)',
          borderColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[4]
              : theme.colors.gray[2],
          backgroundColor:
            theme.colorScheme === 'dark' ? theme.colors.dark[7] : theme.white,
          color:
            theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
          'text-rendering': 'optimizeLegibility',
        },
      }),
    },
    AppShell: {
      styles: (theme) => ({
        main: {
          backgroundColor:
            theme.colorScheme === 'dark'
              ? theme.colors.dark[8]
              : theme.colors.gray[0],
        },
      }),
    },
    ActionIcon: {
      styles: (theme) => ({
        root: {
          '&[data-variant="subtle"]:hover': {
            backgroundColor:
              theme.colorScheme === 'dark'
                ? theme.colors.dark[5]
                : theme.colors.gray[1],
          },
        },
      }),
    },
    Text: {
      styles: (theme) => ({
        root: {
          color:
            theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
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

function App() {
  const [colorScheme, setColorScheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // 读取保存的主题设置
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setColorScheme(savedTheme);
    } else if (
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      // 使用系统首选项
      setColorScheme('dark');
    }
  }, []);

  const toggleColorScheme = (value?: 'light' | 'dark') => {
    const newColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
    setColorScheme(newColorScheme);
    // 存储用户偏好
    localStorage.setItem('theme', newColorScheme);
  };

  return (
    <>
      <ColorSchemeScript />
      <MantineProvider theme={{ ...theme, colorScheme }}>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <Chat
                  toggleColorScheme={toggleColorScheme}
                  colorScheme={colorScheme}
                />
              }
            />
          </Routes>
        </Router>
      </MantineProvider>
    </>
  );
}

export default App;
