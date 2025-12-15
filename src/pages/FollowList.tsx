/**
 * 关注列表/粉丝列表页面
 */

import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';

import CyberCard from '../components/ui/CyberCard';
import { User, ArrowLeft, Users, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { UserResponse, PaginatedResponse } from '../api';

const FollowList = () => {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const isFollowers = location.pathname.includes('followers');
  const title = isFollowers ? t('profile.followers') : t('profile.following');

  const { data, isLoading } = useQuery<PaginatedResponse<UserResponse>>({
    queryKey: [isFollowers ? 'followers' : 'following', userId],
    queryFn: async () => {
      const endpoint = isFollowers
        ? `/users/${userId}/followers`
        : `/users/${userId}/following`;
      const res = await api.get(endpoint);
      return res.data;
    },
    enabled: !!userId,
  });

  const users = data?.items || [];

  return (
    <div className="max-w-2xl mx-auto">
      {/* 头部 */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          {isFollowers ? (
            <Users className="w-6 h-6 text-neon-purple" />
          ) : (
            <UserPlus className="w-6 h-6 text-cyber-cyan" />
          )}
          <h1 className="text-2xl font-orbitron font-bold text-white">{title}</h1>
        </div>
      </div>

      {/* 列表 */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-12 h-12 border-4 border-neon-purple rounded-full animate-spin border-t-transparent"></div>
        </div>
      ) : users.length > 0 ? (
        <div className="space-y-3">
          {users.map((user) => (
            <CyberCard
              key={user.id}
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => navigate(`/user/${user.id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan p-[2px]">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-deep-space flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white font-orbitron">{user.username}</h3>
                  <p className="text-gray-500 text-sm font-mono">ID-{user.id}</p>
                </div>
              </div>
            </CyberCard>
          ))}
        </div>
      ) : (
        <CyberCard className="p-12 text-center border-dashed border-gray-700">
          <Users className="w-12 h-12 text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500 font-orbitron">
            {isFollowers ? t('profile.no_followers') : t('profile.no_following')}
          </p>
        </CyberCard>
      )}
    </div>
  );
};

export default FollowList;
