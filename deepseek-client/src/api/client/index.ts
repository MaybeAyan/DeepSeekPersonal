import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// API环境配置
export const API_CONFIG = {
  // 开发环境
  development: {
    baseUrl: 'http://192.168.10.70:10010',
    timeout: 30000,
  },
  // 测试环境
  test: {
    baseUrl: 'http://test-api.example.com',
    timeout: 30000,
  },
  // 生产环境
  production: {
    baseUrl:
      // 使用Vite的方式访问环境变量
      import.meta.env.PROD ? '/api' : 'http://192.168.10.70:10010',
    timeout: 30000,
  },
};

// 确定当前环境
const currentEnv = import.meta.env.MODE || 'development';
const config = API_CONFIG[currentEnv as keyof typeof API_CONFIG];

class ApiClient {
  private instance: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string, options: AxiosRequestConfig = {}) {
    this.baseUrl = baseUrl;
    this.instance = axios.create({
      baseURL: baseUrl,
      timeout: config.timeout,
      ...options,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        // 在这里可以添加通用的请求头，如token等
        // const token = localStorage.getItem('token');
        // if (token) {
        //   config.headers = config.headers || {};
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => {
        // 统一处理响应
        const { data } = response;

        // 检查API响应状态码
        if (data && data.code !== undefined) {
          if (data.code === 200) {
            return data;
          } else {
            // 业务错误处理
            const error = new Error(data.msg || '请求失败') as Error & {
              code?: number;
              response?: AxiosResponse;
            };
            error.name = 'ApiError';
            error.code = data.code;
            error.response = response;
            return Promise.reject(error);
          }
        }

        return data;
      },
      (error) => {
        // 统一处理网络错误
        if (error.response) {
          // 服务器返回了错误状态码
          console.error(
            `HTTP Error: ${error.response.status}`,
            error.response.data
          );
          error.name = 'HttpError';
          error.message =
            error.response.data?.message ||
            `请求失败: ${error.response.status}`;
        } else if (error.request) {
          // 请求发出但没有收到响应
          console.error('Network Error: No response received', error.request);
          error.name = 'NetworkError';
          error.message = '网络异常，请检查网络连接';
        } else {
          // 请求配置时出错
          console.error('Request Error', error.message);
          error.name = 'RequestError';
        }

        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(
    url: string,
    params?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.instance.get(url, { params, ...config });
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.instance.post(url, data, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response = await this.instance.put(url, data, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.instance.delete(url, config);
      return response.data;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  // 流式响应处理方法
  async stream(
    url: string,
    data: any,
    onData: (chunk: any) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
    method: 'GET' | 'POST' = 'POST'
  ): Promise<() => void> {
    // 创建一个 AbortController 用于取消请求
    const controller = new AbortController();

    (async () => {
      try {
        // 构建URL，确保GET请求正确附加参数
        const fullUrl = this.baseUrl + url;

        const requestInit: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        };

        // 对于POST请求添加请求体
        if (method === 'POST' && data) {
          requestInit.body = JSON.stringify(data);
        }

        // 对于GET请求，如果有data，将其作为URL参数
        const requestUrl =
          method === 'GET' && data
            ? `${fullUrl}${
                fullUrl.includes('?') ? '&' : '?'
              }${new URLSearchParams(data).toString()}`
            : fullUrl;

        const response = await fetch(requestUrl, requestInit);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // 确保响应体可用
        if (!response.body) {
          throw new Error('Response body is not available');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onComplete();
            break;
          }

          const chunkText = decoder.decode(value, { stream: true });
          const lines = chunkText.split('\n\n');

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
      } catch (error: unknown) {
        // 类型断言确保error是Error类型或者可以转换为Error
        const err = error instanceof Error ? error : new Error(String(error));

        // 请求被取消不算错误
        if (err.name === 'AbortError') {
          console.log('Stream request aborted');
          onComplete();
        } else {
          onError(err);
        }
      }
    })();

    // 返回取消函数
    return () => controller.abort();
  }

  private handleApiError(error: unknown) {
    // 确保error是带有name属性的对象
    if (typeof error !== 'object' || error === null) return;

    const err = error as { name?: string; code?: number };

    // 统一错误处理
    if (err.name === 'ApiError') {
      // 业务逻辑错误
      if (err.code === 401) {
        // 处理未授权错误
        console.error('认证失败，请重新登录');
        // 可以在这里触发重定向到登录页
      } else if (err.code === 403) {
        // 处理权限错误
        console.error('没有权限访问该资源');
      }
    } else if (err.name === 'HttpError') {
      // 处理HTTP错误
    } else if (err.name === 'NetworkError') {
      // 处理网络错误
    }
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient(config.baseUrl);

// 导出工厂函数，用于创建特定基础URL的客户端
export const createApiClient = (
  baseUrl: string,
  options?: AxiosRequestConfig
) => {
  return new ApiClient(baseUrl, options);
};
