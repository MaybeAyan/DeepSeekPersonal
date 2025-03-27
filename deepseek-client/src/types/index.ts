export interface ChatMessage {
  id: string;
  conversation_id?: string;
  section_id?: string;
  bot_id?: string;
  chat_id?: string;
  created_at?: number;
  updated_at?: number;
  audio?: string;
  role: 'user' | 'assistant';
  type?: string;
  content: string;
  content_type?: string;
  meta_data?: any;
  reasoning_content?: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ChatSettings {
  temperature: number;
  maxTokens: number;
  model: string;
  streamMode: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

// 扩展带有bot_id信息的会话类型
export interface EnrichedConversation extends Conversation {
  botIds?: string[];    // 会话中包含的所有bot_id
  primaryBotId?: string; // 主要使用的bot_id
}