import { useState, useEffect } from 'react';

export function useTheme() {
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

  return { colorScheme, toggleColorScheme };
}
