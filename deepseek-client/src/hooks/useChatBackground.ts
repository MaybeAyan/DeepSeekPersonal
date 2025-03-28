import { useState, useEffect, useCallback } from 'react';

export function useChatBackground() {
  const [chatBgImage, setChatBgImage] = useState<string | null>(null);

  // 从localStorage加载保存的背景图
  useEffect(() => {
    const savedBg = localStorage.getItem('chat_background_image');
    if (savedBg) {
      setChatBgImage(savedBg);
    }
  }, []);

  // 保存背景图到localStorage
  const saveBgImage = useCallback((bgUrl: string | null) => {
    if (bgUrl) {
      localStorage.setItem('chat_background_image', bgUrl);
    } else {
      localStorage.removeItem('chat_background_image');
    }
    setChatBgImage(bgUrl);
  }, []);

  // 处理背景图选择
  const handleBgImageSelect = useCallback(
    (imageUrl: string) => {
      saveBgImage(imageUrl);
    },
    [saveBgImage]
  );

  // 移除背景图
  const handleRemoveBgImage = useCallback(() => {
    saveBgImage(null);
  }, [saveBgImage]);

  // 允许用户上传自定义背景图
  const handleBgImageUpload = useCallback(() => {
    // 创建隐藏的文件输入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    document.body.appendChild(fileInput);

    // 监听文件选择事件
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          if (dataUrl) {
            saveBgImage(dataUrl);
          }
        };
        reader.readAsDataURL(file);
      }
      document.body.removeChild(fileInput);
    };

    // 触发文件选择
    fileInput.click();
  }, [saveBgImage]);

  return {
    chatBgImage,
    handleBgImageSelect,
    handleRemoveBgImage,
    handleBgImageUpload,
  };
}
