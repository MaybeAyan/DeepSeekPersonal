import { useState, useCallback } from 'react';
import { npcAPI, NpcBot, npcService } from '../api';

// 全局API状态管理
const API_STATE = {
  botsRequest: null as Promise<any> | null,
};

interface UseBotDataResult {
  botAvatars: Record<string, string>;
  botNames: Record<string, string>;
  botDecs: Record<string, string>;
  nameToIdMap: Record<string, string>;
  loadBotData: (force?: boolean) => Promise<NpcBot[]>;
  updateBotData: (bots: any[]) => void;
}

export function useBotData(): UseBotDataResult {
  const [botAvatars, setBotAvatars] = useState<Record<string, string>>({});
  const [botNames, setBotNames] = useState<Record<string, string>>({});
  const [botDecs, setBotDecs] = useState<Record<string, string>>({});
  const [nameToIdMap, setNameToIdMap] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 加载机器人数据
  const loadBotData = useCallback(async (force = false) => {
    try {
      console.log('加载机器人数据...');
      const bots = await (API_STATE.botsRequest ||
        (API_STATE.botsRequest = npcAPI.getBotList(force)));

      const avatarMap: Record<string, string> = {};
      const nameMap: Record<string, string> = {};
      const botDecsMap: Record<string, string> = {};
      const nameToIdMapping: Record<string, string> = {};

      bots.forEach((bot: any) => {
        if (bot.bot_id && bot.icon_url) {
          avatarMap[bot.bot_id] = bot.icon_url;
        }
        if (bot.bot_name) {
          nameMap[bot.bot_id] = bot.bot_name;
          nameToIdMapping[bot.bot_name] = bot.bot_id;
        }
        if (bot.description) {
          botDecsMap[bot.bot_id] = bot.description;
        }
      });

      // 更新机器人数据
      setBotAvatars(avatarMap);
      setBotNames(nameMap);
      setBotDecs(botDecsMap);
      setNameToIdMap(nameToIdMapping);

      // 清除缓存的请求
      API_STATE.botsRequest = null;

      return bots;
    } catch (error) {
      console.error('加载机器人数据失败:', error);
      API_STATE.botsRequest = null;
      throw error;
    }
  }, []);

  // 加载机器人数据
  // const loadBotData = useCallback(async (force = false): Promise<NpcBot[]> => {
  //   try {
  //     console.log('加载机器人数据...', { force });
  //     setIsLoading(true);

  //     // 使用新的 npcService
  //     const bots = await npcService.getBotList(force);
  //     console.log(`获取到 ${bots.length} 个机器人`);

  //     if (!bots || bots.length === 0) {
  //       console.warn('没有获取到机器人数据');
  //       return [];
  //     }

  //     const avatarMap: Record<string, string> = {};
  //     const nameMap: Record<string, string> = {};
  //     const botDecsMap: Record<string, string> = {};
  //     const nameToIdMapping: Record<string, string> = {};

  //     bots.forEach((bot) => {
  //       if (bot.bot_id) {
  //         // 即使没有图片URL也创建条目，防止数据缺失
  //         avatarMap[bot.bot_id] = bot.icon_url || '';

  //         if (bot.bot_name) {
  //           nameMap[bot.bot_id] = bot.bot_name;
  //           nameToIdMapping[bot.bot_name] = bot.bot_id;
  //         } else {
  //           nameMap[bot.bot_id] = `Bot ${bot.bot_id.slice(0, 6)}`;
  //         }

  //         if (bot.description) {
  //           botDecsMap[bot.bot_id] = bot.description;
  //         }
  //       }
  //     });

  //     // 更新状态
  //     setBotAvatars(avatarMap);
  //     setBotNames(nameMap);
  //     setBotDecs(botDecsMap);
  //     setNameToIdMap(nameToIdMapping);

  //     console.log('机器人数据已加载完成', {
  //       botCount: bots.length,
  //       avatarsCount: Object.keys(avatarMap).length,
  //       namesCount: Object.keys(nameMap).length,
  //     });

  //     return bots;
  //   } catch (error) {
  //     console.error('加载机器人数据失败:', error);

  //     // 如果新服务失败，尝试使用旧API作为备选方案
  //     console.log('尝试使用旧API作为备选');
  //     try {
  //       const fallbackBots = await npcAPI.getBotList(force);

  //       // 如果成功获取到数据，做同样的处理
  //       if (fallbackBots && fallbackBots.length > 0) {
  //         const avatarMap: Record<string, string> = {};
  //         const nameMap: Record<string, string> = {};
  //         const botDecsMap: Record<string, string> = {};
  //         const nameToIdMapping: Record<string, string> = {};

  //         fallbackBots.forEach((bot) => {
  //           if (bot.bot_id) {
  //             avatarMap[bot.bot_id] = bot.icon_url || '';

  //             if (bot.bot_name) {
  //               nameMap[bot.bot_id] = bot.bot_name;
  //               nameToIdMapping[bot.bot_name] = bot.bot_id;
  //             } else {
  //               nameMap[bot.bot_id] = `Bot ${bot.bot_id.slice(0, 6)}`;
  //             }

  //             if (bot.description) {
  //               botDecsMap[bot.bot_id] = bot.description;
  //             }
  //           }
  //         });

  //         // 更新状态
  //         setBotAvatars(avatarMap);
  //         setBotNames(nameMap);
  //         setBotDecs(botDecsMap);
  //         setNameToIdMap(nameToIdMapping);

  //         console.log('通过备选方案成功加载机器人数据');
  //         return fallbackBots;
  //       }
  //     } catch (fallbackError) {
  //       console.error('备选方案也失败:', fallbackError);
  //     }

  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // }, []);
  // 快速更新机器人数据，用于刷新时
  const updateBotData = useCallback((bots: any[]) => {
    const avatarMap: Record<string, string> = {};
    const nameMap: Record<string, string> = {};
    const botDecsMap: Record<string, string> = {};
    const nameToIdMapping: Record<string, string> = {};

    bots.forEach((bot: any) => {
      if (bot.bot_id && bot.icon_url) {
        avatarMap[bot.bot_id] = bot.icon_url;
      }
      if (bot.bot_name) {
        nameMap[bot.bot_id] = bot.bot_name;
      }
    });

    setBotAvatars((prevAvatars) => ({ ...prevAvatars, ...avatarMap }));
    setBotNames((prevNames) => ({ ...prevNames, ...nameMap }));
    setBotDecs((prevDecs) => ({ ...prevDecs, ...botDecsMap }));
    setNameToIdMap((prevMap) => ({ ...prevMap, ...nameToIdMapping }));
  }, []);

  return {
    botAvatars,
    botNames,
    botDecs,
    nameToIdMap,
    loadBotData,
    updateBotData,
  };
}
