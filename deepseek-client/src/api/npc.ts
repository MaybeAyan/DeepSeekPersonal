import axios from 'axios';
import { ChatMessage } from '../types';

export interface NpcBot {
  bot_id: string;
  bot_name: string;
  icon_url?: string;
  description?: string;
  publish_time?: string;
}

// 更新接口定义匹配实际的嵌套结构
interface NpcBotListResponse {
  code: number;
  msg: string;
  data: NpcListDataList;
}

interface NpcListDataList {
  total: number;
  items: NpcBot[];
  iterator: unknown[];
  hasMore: boolean;
  lastID: string | null;
  firstID: string | null;
  logID: string;
}

// 消息记录接口的响应类型
interface ConversationMessagesResponse {
  code: number;
  msg: string;
  data: {
    total: number;
    items: ChatMessage[];
    iterator: any[];
    hasMore: boolean;
    lastID: string | null;
    firstID: string | null;
    logID: string;
  };
}

// 添加缓存机制
let cachedBots: NpcBot[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 缓存有效期1分钟

let isCurrentlyFetching = false; // 添加全局锁

export const npcAPI = {
  // 获取NPC机器人列表 - 添加强制刷新参数
  getBotList: async (forceRefresh = false): Promise<NpcBot[]> => {
    const now = Date.now();

    // 全局请求锁，避免并发请求
    if (isCurrentlyFetching) {
      console.log('机器人列表正在获取中，跳过重复请求');

      // 如果缓存存在返回缓存，否则等待当前请求完成
      if (cachedBots) {
        return cachedBots;
      }

      // 等待当前请求完成
      await new Promise(resolve => setTimeout(resolve, 100));
      return npcAPI.getBotList(forceRefresh);
    }

    // 如果缓存存在且未过期，并且不强制刷新，直接返回缓存
    if (cachedBots && now - lastFetchTime < CACHE_TTL && !forceRefresh) {
      console.log('使用缓存的机器人列表，数量:', cachedBots.length);
      return cachedBots;
    }

    try {
      isCurrentlyFetching = true; // 设置锁
      console.log('从服务器获取机器人列表');

      const response = await axios.get<NpcBotListResponse>(
        'http://192.168.10.70:10010/ai-npc/npc/bot/list'
      );

      if (response.data.code === 200) {
        let botList: NpcBot[] = [];

        if (response.data.data?.items) {
          botList = response.data.data.items;
        } else if (Array.isArray(response.data.data)) {
          botList = response.data.data;
        }

        // 更新缓存
        cachedBots = botList;
        lastFetchTime = now;

        console.log('机器人列表已更新，缓存数量:', botList.length);
        return botList;
      }

      throw new Error('获取机器人列表失败：' + response.data.msg);
    } catch (error) {
      console.error('获取机器人列表时发生错误:', error);
      throw error;
    } finally {
      isCurrentlyFetching = false; // 释放锁
    }
  },
  // 获取会话消息记录
  getConversationMessages: async (
    conversationId: string
  ): Promise<ChatMessage[]> => {
    try {
      const response = await axios.get<ConversationMessagesResponse>(
        `http://192.168.10.70:10010/ai-npc/npc/conversation/message/list?conversationId=${conversationId}`
      );

      if (response.data.code === 200 && response.data.data.items) {
        return response.data.data.items;
      } else {
        console.error('获取会话消息失败：', response.data.msg);
        return [];
      }
    } catch (error) {
      console.error('获取会话消息时发生错误：', error);
      return [];
    }
  },
};
