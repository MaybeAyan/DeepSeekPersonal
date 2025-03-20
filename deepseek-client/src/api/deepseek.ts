import axios from 'axios';

const API_BASE_URL = '/api/deepseek'; // 使用相对路径配合Vite代理

export interface CompletionRequest {
  prompt: string;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

// Response interfaces
export interface Message {
  role: string;
  content: string;
}

export interface Choice {
  index: number;
  message: Message;
  finish_reason: string;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface CompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
  usage: Usage;
}

export interface DeltaMessage {
  role?: string;
  content?: string;
}

export interface StreamChoice {
  index: number;
  delta: DeltaMessage;
  finish_reason: null | string;
}

export interface StreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: StreamChoice[];
}

// API client
export const deepseekAPI = {
  // 普通请求
  getCompletion: async (
    request: CompletionRequest
  ): Promise<CompletionResponse> => {
    const response = await axios.post<CompletionResponse>(
      `${API_BASE_URL}/completion`,
      request
    );
    return response.data;
  },

  // 流式请求 - POST方式
  postCompletionStream: (
    request: CompletionRequest,
    onData: (data: StreamResponse) => void,
    onComplete: () => void,
    onError: (error: Error) => void
  ) => {
    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          onError(new Error('Stream not available'));
          return;
        }

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            onComplete();
            break;
          }

          const text = decoder.decode(value);
          const lines = text.split('\n\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.substring(6).trim();

              if (data === '[DONE]') {
                onComplete();
                break;
              }

              try {
                const parsed = JSON.parse(data);
                onData(parsed);
              } catch (e) {
                console.error('Error parsing JSON:', e, data);
              }
            }
          }
        }
      } catch (error) {
        onError(error instanceof Error ? error : new Error('Stream error'));
      }
    })();

    // 返回一个函数，用于中止请求
    return () => {
      controller.abort();
    };
  },
};
