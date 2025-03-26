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
