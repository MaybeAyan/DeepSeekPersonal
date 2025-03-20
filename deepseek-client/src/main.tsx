import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './mantine.css'; // 添加这一行
/**
 *  github (亮色主题)
    github-dark (暗色主题)
    atom-one-dark (类似 VS Code 暗色主题)
    tomorrow-night (流行的暗色主题)
    xcode (类似 Xcode 的亮色主题)
    monokai-sublime (类似 Sublime Text 的主题)
 */
import 'highlight.js/styles/github.css'; // 使用暗色主题
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
