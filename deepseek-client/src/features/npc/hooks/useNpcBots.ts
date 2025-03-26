import { useState, useEffect, useCallback, useRef } from 'react';
import { NpcBot } from '../../../api';
import { npcAPI } from '../../../api/npc';

// 全局请求锁
const requestLock = {
  isLoading: false,
  timestamp: 0,
};

export function useNpcBots() {
  const [bots, setBots] = useState<NpcBot[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedBot, setSelectedBot] = useState<NpcBot | null>(null);

  // 使用 ref 跟踪组件状态
  const isComponentMountedRef = useRef(true);
  const isInitialLoadDoneRef = useRef(false);

  // 获取机器人列表 - 使用 npcAPI 缓存机制
  const fetchBots = useCallback(
    async (force = false) => {
      // 防止重复请求或组件卸载后请求
      if ((!force && loading) || !isComponentMountedRef.current) {
        return;
      }

      // 防止多个组件同时请求
      const now = Date.now();
      if (
        !force &&
        requestLock.isLoading &&
        now - requestLock.timestamp < 500
      ) {
        console.log('跳过重复请求');
        return;
      }

      // 设置加载状态
      setLoading(true);
      requestLock.isLoading = true;
      requestLock.timestamp = now;

      try {
        // 使用 npcAPI 的缓存机制
        const botsData = await npcAPI.getBotList();

        // 检查组件是否仍然挂载
        if (isComponentMountedRef.current) {
          setBots(botsData);
          setError(null);
        }
      } catch (error) {
        if (isComponentMountedRef.current) {
          console.error('获取机器人列表失败:', error);
          setError('获取机器人列表失败');
        }
      } finally {
        // 重置加载状态
        if (isComponentMountedRef.current) {
          setLoading(false);
        }
        requestLock.isLoading = false;
        isInitialLoadDoneRef.current = true;
      }
    },
    [loading]
  );

  // 只在组件挂载时获取一次数据
  useEffect(() => {
    isComponentMountedRef.current = true;

    // 只在首次挂载时加载
    if (!isInitialLoadDoneRef.current) {
      fetchBots();
    }

    return () => {
      isComponentMountedRef.current = false;
    };
  }, [fetchBots]);

  return {
    bots,
    loading,
    error,
    fetchBots,
    selectedBot,
    setSelectedBot,
  };
}
