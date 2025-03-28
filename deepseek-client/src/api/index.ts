/**
 * API 统一导出入口
 */

// 导出API客户端
export { apiClient, createApiClient } from './client';

// 导出API路径
export { API_PATHS } from './config/paths';

// 导出服务
export { npcService } from './services/npc-service';
export type { NpcBot, NpcListResponse } from './services/npc-service';
// API管理的入口文件，导出所有API
export * from './deepseek';
export * from './npc';
