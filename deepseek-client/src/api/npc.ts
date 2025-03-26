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

export const npcAPI = {
  // 获取NPC机器人列表
  getBotList: async (): Promise<NpcBot[]> => {
    const now = Date.now();

    // 如果缓存存在且未过期，直接返回缓存
    if (cachedBots && now - lastFetchTime < CACHE_TTL) {
      console.log('使用缓存的机器人列表，数量:', cachedBots.length);
      return cachedBots;
    }

    try {
      console.log('从服务器获取机器人列表');
      const response = await axios.get<NpcBotListResponse>(
        '/ai-npc/npc/bot/list'
      );

      // 打印完整的响应数据进行调试
      console.log('NPC机器人列表响应:', JSON.stringify(response.data, null, 2));

      if (response.data.code === 200) {
        // 确保正确处理嵌套数据结构
        let botList: NpcBot[] = [];

        if (response.data.data?.items) {
          // 如果是符合预期的嵌套结构
          botList = response.data.data.items;
          console.log(botList);
        } else if (Array.isArray(response.data.data)) {
          // 如果是直接数组
          botList = response.data.data;
        } else {
          console.error('未知的机器人列表数据结构:', response.data.data);
          botList = [];
        }

        console.log('处理后的机器人列表，数量:', botList.length);

        // 更新缓存
        cachedBots = botList;
        lastFetchTime = now;
        return botList;
      } else {
        console.error('获取机器人列表失败:', response.data.msg);
        return [];
      }
    } catch (error) {
      console.error('获取机器人列表时发生错误:', error);
      return [];
    }
  },
  // 获取会话消息记录
  getConversationMessages: async (
    conversationId: string
  ): Promise<ChatMessage[]> => {
    try {
      const response = await axios.get<ConversationMessagesResponse>(
        `/ai-npc/npc/conversation/message/list?conversationId=${conversationId}`
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
