import { apiClient } from '../client';
import { API_PATHS } from '../config/paths';
import { ChatMessage } from '../../types';

// API类型定义
export interface NpcBot {
  bot_id: string;
  bot_name: string;
  icon_url?: string;
  description?: string;
  publish_time?: string;
}

export interface NpcListResponse {
  total: number;
  items: NpcBot[];
  iterator: unknown[];
  hasMore: boolean;
  lastID: string | null;
  firstID: string | null;
  logID: string;
}

// 添加缓存机制
const CACHE_TTL = 60000; // 缓存有效期1分钟
const cache = {
  bots: {
    data: null as NpcBot[] | null,
    timestamp: 0,
  },
};

// 实现请求锁，避免重复请求
const requestLocks = {
  getBotList: false,
};

/**
 * NPC 服务 - 管理所有与NPC相关的API调用
 */
class NpcService {
  /**
   * 获取NPC机器人列表
   * @param forceRefresh 是否强制刷新
   */
  async getBotList(forceRefresh = false): Promise<NpcBot[]> {
    const now = Date.now();

    // 使用缓存
    if (
      !forceRefresh &&
      cache.bots.data &&
      now - cache.bots.timestamp < CACHE_TTL
    ) {
      return cache.bots.data;
    }

    // 检查是否有正在进行的请求
    if (requestLocks.getBotList) {
      // 轮询等待请求完成
      return new Promise((resolve) => {
        const checkCache = () => {
          if (!requestLocks.getBotList && cache.bots.data) {
            resolve(cache.bots.data);
          } else {
            setTimeout(checkCache, 100);
          }
        };
        checkCache();
      });
    }

    try {
      requestLocks.getBotList = true;
      console.log('从服务器获取机器人列表');
      const response = await apiClient.get<{ data: NpcListResponse }>(
        API_PATHS.npc.bots.list
      );
      console.log(response.data);
      // 更新缓存
      cache.bots.data = response.data?.items || [];
      cache.bots.timestamp = now;
      return cache.bots.data;
    } catch (error) {
      console.error('获取机器人列表时发生错误:', error);
      throw error;
    } finally {
      requestLocks.getBotList = false;
    }
  }

  /**
   * 获取会话消息记录
   * @param conversationId 会话ID
   */
  async getConversationMessages(
    conversationId: string
  ): Promise<ChatMessage[]> {
    try {
      const path = API_PATHS.npc.conversations.messages.list(conversationId);
      const response = await apiClient.get<{ data: { items: ChatMessage[] } }>(
        path
      );

      if (response.data?.items) {
        return response.data.items;
      }
      return [];
    } catch (error) {
      console.error('获取会话消息时发生错误:', error);
      return [];
    }
  }
}

// 导出服务实例
export const npcService = new NpcService();
