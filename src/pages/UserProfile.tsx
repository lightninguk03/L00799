/**
 * 用户主页
 * 显示其他用户的资料、关注/取消关注按钮、用户动态列表
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

import CyberCard from '../components/ui/CyberCard';
import PostCard from '../components/ui/PostCard';
import { User, Users, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl, cn } from '../lib/utils';
import type { UserResponse, PostResponse, PaginatedResponse, UserProfile as UserProfileType } from '../api';

const UserProfile = () => {
  const { t } = useTranslation();
  const { id: userId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 获取当前登录用户
  const { data: currentUser } = useQuery<UserResponse>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    },
  });

  // 调试：打印 userId
  console.log('UserProfile - userId from params:', userId);

  // 获取目标用户信息（包含关注状态和统计）
  const { data: user, isLoading, error, refetch: refetchUser } = useQuery<UserProfileType>({
    queryKey: ['user', userId],
    queryFn: async () => {
      console.log('Fetching user with ID:', userId);
      const res = await api.get(`/users/${userId}`);
      console.log('User API response:', res.data);
      console.log('User API response keys:', Object.keys(res.data));
      return res.data;
    },
    enabled: !!userId && userId !== 'undefined',
  });

  // 调试：打印 user 数据
  console.log('User data:', user);
  console.log('API error:', error);

  // 获取用户动态
  const { data: postsData } = useQuery<PaginatedResponse<PostResponse>>({
    queryKey: ['userPosts', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/posts`);
      return res.data;
    },
    enabled: !!userId,
  });

  // 关注/取消关注
  const followMutation = useMutation({
    mutationFn: async () => {
      console.log('Follow mutation triggered, is_following:', user?.is_following);
      if (user?.is_following) {
        const res = await api.delete(`/users/${userId}/follow`);
        return res.data;
      } else {
        const res = await api.post(`/users/${userId}/follow`);
        return res.data;
      }
    },
    onSuccess: () => {
      console.log('Follow mutation success');
      // 刷新用户数据以获取最新的关注状态
      refetchUser();
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      // 刷新当前用户的关注统计（Profile 页面使用）
      queryClient.invalidateQueries({ queryKey: ['followStats'] });
      // 刷新目标用户的关注统计
      queryClient.invalidateQueries({ queryKey: ['user', userId] });
      // 刷新当前登录用户的关注统计
      if (currentUser?.id) {
        queryClient.invalidateQueries({ queryKey: ['followStats', currentUser.id] });
      }
    },
    onError: (error) => {
      console.error('Follow mutation error:', error);
    },
  });

  const isOwnProfile = currentUser?.id === Number(userId);
  const posts = postsData?.items || [];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-neon-purple rounded-full animate-spin border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">{t('errors.user_not_found')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* 返回按钮 */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t('common.back')}</span>
      </button>

      {/* 用户信息卡片 */}
      <CyberCard className="bg-glass-black/90 p-8 border-neon-purple/30 relative overflow-visible">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* 头像 */}
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-neon-purple to-cyber-cyan flex-shrink-0">
            <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
              {user.avatar ? (
                <img src={getAvatarUrl(user.avatar) || ''} alt={user.username} className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-gray-400" />
              )}
            </div>
          </div>

          {/* 用户信息 */}
          <div className="flex-1">
            <h1 className="text-3xl font-orbitron font-bold text-white mb-2">
              {user.username || `用户 ${user.id}`}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="font-mono px-2 py-0.5 border border-cyber-cyan/30 rounded bg-cyber-cyan/10 text-cyber-cyan">
                ID-{user.id || userId}
              </span>
            </div>

            {/* 关注统计 */}
            <div className="flex items-center gap-6 text-sm">
              <button 
                onClick={() => navigate(`/user/${userId}/following`)}
                className="flex items-center gap-2 text-gray-400 hover:text-cyber-cyan transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span className="font-orbitron">{user?.following_count || 0}</span>
                <span>{t('profile.following')}</span>
              </button>
              <button 
                onClick={() => navigate(`/user/${userId}/followers`)}
                className="flex items-center gap-2 text-gray-400 hover:text-neon-purple transition-colors"
              >
                <Users className="w-4 h-4" />
                <span className="font-orbitron">{user?.follower_count || 0}</span>
                <span>{t('profile.followers')}</span>
              </button>
              <div className="flex items-center gap-2 text-gray-400">
                <span className="font-orbitron">{user?.post_count || 0}</span>
                <span>{t('profile.posts')}</span>
              </div>
            </div>
          </div>

          {/* 关注按钮 */}
          {!isOwnProfile && currentUser && (
            <div className="flex-shrink-0 relative z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Button clicked');
                  followMutation.mutate();
                }}
                disabled={followMutation.isPending}
                className={cn(
                  "min-w-[120px] px-6 py-2.5 font-orbitron text-sm tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  user?.is_following
                    ? "bg-transparent border-2 border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10"
                    : "bg-cyber-cyan text-black font-bold border-2 border-cyber-cyan hover:bg-cyber-cyan/80"
                )}
              >
                {followMutation.isPending ? (
                  <span className="animate-pulse">...</span>
                ) : user?.is_following ? (
                  <>
                    <UserMinus className="w-4 h-4" />
                    {t('user.following')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    {t('user.follow')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </CyberCard>

      {/* 用户动态 */}
      <div>
        <h2 className="text-xl font-orbitron font-bold text-white mb-6">
          {t('profile.posts')}
        </h2>

        {posts.length > 0 ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            {t('community.no_posts')}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
