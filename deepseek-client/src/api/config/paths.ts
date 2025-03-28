/**
 * API路径常量管理
 * 集中管理所有接口路径，按功能模块分组
 */

export const API_PATHS = {
  // NPC相关API
  npc: {
    // 机器人管理
    bots: {
      list: '/ai-npc/npc/bot/list',
      detail: (botId: string) => `/ai-npc/npc/bot/detail?botId=${botId}`,
    },
    // 对话管理
    conversations: {
      list: '/ai-npc/npc/conversation/list',
      create: '/ai-npc/npc/conversation/create',
      detail: (id: string) => `/ai-npc/npc/conversation/detail?id=${id}`,
      delete: (id: string) => `/ai-npc/npc/conversation/delete?id=${id}`,
      messages: {
        list: (conversationId: string) =>
          `/ai-npc/npc/conversation/message/list?conversationId=${conversationId}`,
      },
    },
    // 聊天功能
    chat: {
      stream: '/ai-npc/npc/streamChat/create',
    },
  },

  // 用户相关API
  user: {
    login: '/ai-npc/api/user/login',
  },
};
