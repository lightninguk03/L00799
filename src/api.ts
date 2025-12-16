import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// --- Types based on Backend V2.1 ---

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  page_size: number;
  items: T[];
}

export interface UserRegister {
  email: string;
  username: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  username: string;
  avatar?: string | null;
  is_verified?: boolean;
  created_at: string;
}

export interface UserProfile extends UserResponse {
  post_count: number;
  following_count: number;
  follower_count: number;
  is_following?: boolean;
}

export interface UserStats {
  post_count: number;
  like_count: number;
  favorite_count: number;
  comment_count: number;
}

// V2.1 双 Token 认证
export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_verified: boolean;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export type MediaType = 'text' | 'image' | 'video';

export interface PostResponse {
  id: number;
  user_id: number;
  content: string;
  media_type: MediaType;
  media_urls?: string | string[] | null;  // V2.3: 后端现在返回数组，保留 string 兼容旧版
  thumbnail?: string | null;  // 视频封面图
  category_id?: number | null;
  repost_source_id?: number | null;
  created_at: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  is_liked?: boolean;
  is_collected?: boolean;
  user?: UserResponse;
}

export interface CommentCreate {
  content: string;
}

export interface CommentResponse {
  id: number;
  user_id: number;
  post_id: number;
  content: string;
  created_at: string;
  user?: UserResponse;
}

export interface InteractRequest {
  interaction_type: 'like' | 'bookmark';
}

export interface ChatRequest {
  message: string;
}

export interface MessageResponse {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ChatResponse {
  user_message: MessageResponse;
  assistant_message: MessageResponse;
}

export interface Notification {
  id: number;
  user_id: number;
  actor_id: number;
  actor_username: string;
  actor_avatar?: string;
  type: 'like' | 'comment' | 'follow' | 'repost';
  post_id?: number;
  is_read: boolean;
  created_at: string;
}

export interface ApiError {
  error_code: string;
  message: string;
}

// --- 系统公告 (V2.4) ---
export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'important';
  is_active: boolean;
  created_at: string;
  expires_at?: string;
}

// --- 举报 (V2.4) ---
export type ReportTargetType = 'post' | 'comment' | 'user';

export interface ReportCreate {
  target_type: ReportTargetType;
  target_id: number;
  reason: string;
}

export interface ReportResponse {
  id: number;
  reporter_id: number;
  target_type: ReportTargetType;
  target_id: number;
  reason: string;
  status: 'pending' | 'resolved' | 'rejected';
  created_at: string;
}

// --- 封禁信息 (V2.4) ---
export interface BanInfo {
  is_banned: boolean;
  ban_reason?: string;
  banned_until?: string;
}

// --- Token 管理 ---

export const TokenManager = {
  getAccessToken: () => localStorage.getItem('access_token'),
  getRefreshToken: () => localStorage.getItem('refresh_token'),
  
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  },
  
  clearTokens: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
  },
  
  isLoggedIn: () => !!localStorage.getItem('access_token'),
};


// --- API Client ---

export const API_URL = '';

const api = axios.create({
  baseURL: API_URL,
});

// 标记是否正在刷新 Token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Token
api.interceptors.request.use((config) => {
  const token = TokenManager.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle 401, 403, 429 and Auto Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ ban_reason?: string; banned_until?: string }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // V2.3: 处理 429 限流错误
    if (error.response?.status === 429) {
      // 限流错误，让调用方处理显示提示
      return Promise.reject(error);
    }
    
    // V2.4: 处理 403 封禁错误
    if (error.response?.status === 403) {
      const data = error.response.data;
      if (data?.ban_reason) {
        // 用户被封禁，清除 token 并跳转到封禁页面
        TokenManager.clearTokens();
        const banInfo = encodeURIComponent(JSON.stringify({
          reason: data.ban_reason,
          until: data.banned_until
        }));
        window.location.href = `/banned?info=${banInfo}`;
        return Promise.reject(error);
      }
    }
    
    // 如果是 401 错误且不是刷新 Token 的请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      // 如果是登录、刷新、注册或公开 API 请求失败，直接返回错误（不跳转登录）
      const publicUrls = ['/auth/login', '/auth/refresh', '/auth/register', '/system/config', '/posts/'];
      if (publicUrls.some(url => originalRequest.url?.includes(url))) {
        return Promise.reject(error);
      }
      
      if (isRefreshing) {
        // 如果正在刷新，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = TokenManager.getRefreshToken();
      
      if (!refreshToken) {
        // 没有 refresh_token，清除并跳转登录
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post<LoginResponse>(`${API_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        
        const { access_token, refresh_token } = response.data;
        TokenManager.setTokens(access_token, refresh_token);
        
        processQueue(null, access_token);
        
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

// --- Auth API ---

export const authApi = {
  login: (username: string, password: string) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    return api.post<LoginResponse>('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
  
  register: (data: UserRegister) => api.post<UserResponse>('/auth/register', data),
  
  logout: async () => {
    const refreshToken = TokenManager.getRefreshToken();
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refresh_token: refreshToken });
      } catch {
        // 忽略登出 API 错误
      }
    }
    TokenManager.clearTokens();
  },
  
  getMe: () => api.get<UserResponse>('/auth/me'),
  updateMe: (data: { username?: string; avatar?: string }) => api.put<UserResponse>('/auth/me', data),
  getMyStats: () => api.get<UserStats>('/auth/me/stats'),
  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<UserResponse>('/auth/me/avatar', formData);
  },
};

// --- System API (V2.4) ---
export const systemApi = {
  // 获取系统公告（公开）
  getAnnouncements: () => api.get<Announcement[]>('/system/announcements'),
};

// --- Report API (V2.4) ---
export const reportApi = {
  // 提交举报（需登录）
  create: (data: ReportCreate) => api.post<ReportResponse>('/reports', data),
};

export default api;
