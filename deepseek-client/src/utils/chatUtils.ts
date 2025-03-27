import { ChatMessage } from "../types";

/**
 * 处理群聊历史消息 - 只折叠因API轮询导致的重复用户问题
 * 规则：
 * 1. 只折叠时间接近且内容相同的重复用户问题（轮询API产生的）
 * 2. 保留所有机器人回复，不进行任何折叠（同一个NPC回答同一个问题多次也不折叠）
 * 3. 不同时间的相同问题不折叠（保留用户主动的重复提问）
 * 4. 确保消息按正确的时间顺序排列
 */
export const processGroupChatHistory = (messages: ChatMessage[]): ChatMessage[] => {
  if (!messages || messages.length === 0) return [];

  // 首先确保所有消息按时间顺序排序
  const sortedMessages = [...messages].sort((a, b) =>
    (a.created_at || 0) - (b.created_at || 0)
  );

  console.log("原始消息已按时间排序");

  const result: ChatMessage[] = [];

  // 识别连续的对话轮次
  let i = 0;
  while (i < sortedMessages.length) {
    const currentMsg = sortedMessages[i];

    // 如果是用户消息，检查是否是轮询产生的重复
    if (currentMsg.role === 'user') {
      // 记录当前用户问题
      const userQuestion = currentMsg.content;
      const userMsgTime = currentMsg.created_at || 0;

      // 添加用户问题到结果
      result.push(currentMsg);
      i++;

      // 收集该问题的所有机器人回复（按时间顺序）
      const botReplies: ChatMessage[] = [];

      // 收集所有回复，保留所有NPC回复（不折叠任何NPC回复）
      while (i < sortedMessages.length) {
        if (sortedMessages[i].role === 'assistant') {
          // 收集机器人回复
          botReplies.push(sortedMessages[i]);
          i++;
        }
        else if (sortedMessages[i].role === 'user') {
          // 检查是否是同一轮对话中的API轮询产生的重复问题
          const isCloseInTime = Math.abs((sortedMessages[i].created_at || 0) - userMsgTime) < 10000;

          if (sortedMessages[i].content === userQuestion && isCloseInTime) {
            // 这是API轮询产生的重复问题，跳过它
            console.log(`跳过API轮询产生的重复问题: "${userQuestion.substring(0, 20)}..."`);
            i++;

            // 继续收集这个轮询问题的回复
            continue;
          } else {
            // 这是一个新的问题或用户主动的重复提问，结束当前轮次
            break;
          }
        }
        else {
          // 其他类型消息
          botReplies.push(sortedMessages[i]);
          i++;
        }
      }

      // 确保机器人回复按时间顺序
      botReplies.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));

      // 将排序后的机器人回复添加到结果
      result.push(...botReplies);
    }
    else {
      // 不是用户消息，直接添加
      result.push(currentMsg);
      i++;
    }
  }

  console.log(`群聊消息处理: 原始消息数 ${sortedMessages.length}, 处理后 ${result.length}`);
  return result;
};