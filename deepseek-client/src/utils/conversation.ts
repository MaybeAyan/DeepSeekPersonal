import { ChatMessage } from '../types';

/**
 * 从消息数组中提取所有唯一的bot_id
 */
export function extractBotIds(messages: ChatMessage[]): string[] {
  const botIdSet = new Set<string>();

  messages.forEach(message => {
    if (message.role === 'assistant' && message.bot_id) {
      botIdSet.add(message.bot_id);
    }
  });

  return Array.from(botIdSet);
}

/**
 * 获取消息中使用最多的bot_id
 */
export function getPrimaryBotId(messages: ChatMessage[]): string | undefined {
  const botIdCounts = new Map<string, number>();

  messages.forEach(message => {
    if (message.role === 'assistant' && message.bot_id) {
      const count = botIdCounts.get(message.bot_id) || 0;
      botIdCounts.set(message.bot_id, count + 1);
    }
  });

  if (botIdCounts.size === 0) return undefined;

  return Array.from(botIdCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0];
}