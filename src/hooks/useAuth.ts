import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../api';
import type { UserResponse } from '../api';

interface UseAuthReturn {
  isAuthenticated: boolean;
  user: UserResponse | null;
  isLoading: boolean;
  token: string | null;
  requireAuth: (callback?: () => void, message?: string) => boolean;
  logout: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const { data: user, isLoading } = useQuery<UserResponse>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // 只要有 token 就认为已登录（用户数据可能还在加载中）
  const isAuthenticated = !!token;

  const requireAuth = useCallback((callback?: () => void, message?: string): boolean => {
    if (!token) {
      toast.error(message || '请先登录以使用此功能', {
        style: {
          background: '#0a0a14',
          color: '#00ffff',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        },
        icon: '🔒',
      });
      // 可选：跳转到登录页
      // navigate('/login');
      return false;
    }
    if (callback) {
      callback();
    }
    return true;
  }, [token]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    navigate('/login');
    toast.success('已退出登录', {
      style: {
        background: '#0a0a14',
        color: '#00ffff',
        border: '1px solid rgba(0, 255, 255, 0.3)',
      },
    });
  }, [navigate]);

  return {
    isAuthenticated,
    user: user || null,
    isLoading,
    token,
    requireAuth,
    logout,
  };
};

export default useAuth;
