/**
 * 用户主页
 * 显示其他用户的资料、关注/取消关注按钮、用户动态列表
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';

import CyberCard from '../components/ui/CyberCard';
import PostCard from '../components/ui/PostCard';
import NeonButton from '../components/ui/NeonButton';
import { User, Users, UserPlus, UserMinus, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../lib/utils';
import type { UserResponse, PostResponse, PaginatedResponse } from '../api';

interface FollowStats {
  following_count: number;
  followers_count: number;
  is_following: boolean;
}

const UserProfile = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
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

  // 获取目标用户信息
  const { data: user, isLoading } = useQuery<UserResponse>({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}`);
      return res.data;
    },
    enabled: !!userId,
  });

  // 获取关注状态和统计
  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ['followStats', userId],
    queryFn: async () => {
      const res = await api.get(`/users/${userId}/follow-stats`);
      return res.data;
    },
    enabled: !!userId,
  });

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
      if (followStats?.is_following) {
        await api.delete(`/users/${userId}/follow`);
      } else {
        await api.post(`/users/${userId}/follow`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['followStats', userId] });
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
            <h1 className="text-3xl font-orbitron font-bold text-white mb-2">{user.username}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
              <span className="font-mono px-2 py-0.5 border border-cyber-cyan/30 rounded bg-cyber-cyan/10 text-cyber-cyan">
                ID-{user.id}
              </span>
            </div>

            {/* 关注统计 */}
            <div className="flex items-center gap-6 text-sm">
              <button className="flex items-center gap-2 text-gray-400 hover:text-cyber-cyan transition-colors">
                <UserPlus className="w-4 h-4" />
                <span className="font-orbitron">{followStats?.following_count || 0}</span>
                <span>{t('profile.following')}</span>
              </button>
              <button className="flex items-center gap-2 text-gray-400 hover:text-neon-purple transition-colors">
                <Users className="w-4 h-4" />
                <span className="font-orbitron">{followStats?.followers_count || 0}</span>
                <span>{t('profile.followers')}</span>
              </button>
            </div>
          </div>

          {/* 关注按钮 */}
          {!isOwnProfile && currentUser && (
            <div className="flex-shrink-0">
              <NeonButton
                variant={followStats?.is_following ? 'outline' : 'primary'}
                onClick={() => followMutation.mutate()}
                disabled={followMutation.isPending}
                className="min-w-[100px]"
              >
                {followStats?.is_following ? (
                  <>
                    <UserMinus className="w-4 h-4 mr-2" />
                    {t('user.unfollow')}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    {t('user.follow')}
                  </>
                )}
              </NeonButton>
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
