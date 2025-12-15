import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import EditProfileModal from '../components/ui/EditProfileModal';
import { User, Settings, Activity, Grid, Bell, Users, UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAvatarUrl } from '../lib/utils';

import type { UserResponse, UserStats } from '../api';

interface NotificationCount {
  unread_count: number;
}

interface FollowStats {
  following_count: number;
  followers_count: number;
}

const Profile = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: user, isLoading: isUserLoading } = useQuery<UserResponse>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const res = await api.get('/auth/me');
      return res.data;
    }
  });

  const { data: stats } = useQuery<UserStats>({
    queryKey: ['userStats'],
    queryFn: async () => {
      const res = await api.get('/auth/me/stats');
      return res.data;
    },
    enabled: !!user
  });

  // 获取未读通知数量
  const { data: notificationCount } = useQuery<NotificationCount>({
    queryKey: ['notificationCount'],
    queryFn: async () => {
      const res = await api.get('/notifications/unread-count');
      return res.data;
    },
    enabled: !!user,
    refetchInterval: 30000, // 每30秒刷新一次
  });

  // 获取关注/粉丝数
  const { data: followStats } = useQuery<FollowStats>({
    queryKey: ['followStats', user?.id],
    queryFn: async () => {
      const res = await api.get(`/users/${user?.id}/follow-stats`);
      return res.data;
    },
    enabled: !!user?.id,
  });

  const unreadCount = notificationCount?.unread_count || 0;

  if (isUserLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="relative">
          <div className="w-12 h-12 border-4 border-neon-purple rounded-full animate-spin border-t-transparent"></div>
          <div className="w-12 h-12 border-4 border-cyber-cyan rounded-full animate-ping absolute inset-0 opacity-20"></div>
        </div>
      </div>
    );
  }

  return (

    <>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* 顶部芯片插槽样式数据条 - 赛博朋克增强 */}
        <div className="bg-glass-black/60 border border-cyber-cyan/30 rounded-lg p-4 flex items-center justify-between mb-4 border-glow relative overflow-hidden">
          {/* 背景数据流 */}
          <div className="absolute inset-0 data-flow opacity-20" />
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-3 h-3 bg-cyber-cyan rounded-full heartbeat shadow-[0_0_10px_#00ffff]" />
            <span className="font-mono text-cyber-cyan text-sm rgb-split-hover">SYNC_STATUS: ACTIVE</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded neon-pulse relative z-10">
            <span className="font-mono text-cyber-cyan text-sm">同步率：</span>
            <span className="font-orbitron text-cyber-cyan font-bold neon-flicker">99.9%</span>
          </div>
        </div>

        {/* Digital Identity Card (Profile Header) */}
        <CyberCard className="bg-glass-black/90 p-0 border-neon-purple/30 relative overflow-hidden mt-8" chamfered={true}>
          {/* Identity Header Strip - 渐变动画 */}
          <div className="h-2 w-full gradient-border" />

          <div className="p-8 relative">
            {/* Background ID Watermark */}
            <div className="absolute right-0 top-0 opacity-10 pointer-events-none select-none overflow-hidden h-full flex items-center">
              <span className="text-[150px] font-orbitron font-bold text-white whitespace-nowrap -rotate-12 transform translate-x-10">IDENTITY</span>
            </div>

            <div className="flex flex-col md:flex-row items-start gap-8 relative z-10">
              {/* Avatar Section */}
              <div className="relative group">
                {/* Rotating Rings */}
                <div className="absolute inset-[-10px] rounded-full border border-neon-purple/30 border-dashed animate-[spin_10s_linear_infinite]" />
                <div className="absolute inset-[-4px] rounded-full border border-cyber-cyan/50 border-dotted animate-[spin_5s_linear_infinite_reverse]" />

                {/* Avatar Container */}
                <div className="w-32 h-32 rounded-full p-1 bg-black overflow-hidden relative z-10 shadow-[0_0_30px_rgba(138,43,226,0.3)]">
                  {user?.avatar ? (
                    <img
                      src={getAvatarUrl(user.avatar) || ''}
                      alt={user.username}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                </div>

                {/* Lv Badge */}
                <div className="absolute -bottom-2 -right-2 bg-black border border-cyber-cyan px-2 py-0.5 rounded text-xs font-mono text-cyber-cyan font-bold shadow-[0_0_10px_rgba(0,243,255,0.5)]">
                  LV.{(stats?.post_count || 0) > 10 ? '2' : '1'}
                </div>
              </div>

              {/* Info Section */}
              <div className="flex-1 space-y-4 pt-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-4xl font-orbitron font-bold text-white tracking-wider flex items-center gap-3 rgb-split-hover">
                      {user?.username || 'GUEST_USER'}
                      <Settings
                        className="w-5 h-5 text-gray-500 hover:text-white cursor-pointer transition-colors"
                        onClick={() => setIsEditModalOpen(true)}
                      />
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm font-mono">
                      <span className="text-neon-purple bg-neon-purple/10 px-2 py-1 rounded border border-neon-purple/30">
                        UID: {user?.id?.toString().padStart(6, '0')}
                      </span>
                      <span className="text-gray-400">
                        {user?.email}
                      </span>
                    </div>
                  </div>

                  {/* Digital Signature / Barcode Placeholder */}
                  <div className="hidden md:flex flex-col items-end opacity-70">
                    <div className="h-8 w-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAiPjxyZWN0IHdpZHRoPSIyIiBoZWlnaHQ9IjEwIiB4PSIwIiBmaWxsPSIjNDQ0Ii8+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMTAiIHg9IjQiIGZpbGw9IiM0NDQiLz48cmVjdCB3aWR0aD0iMyIgaGVpZ2h0PSIxMCIgeD0iNyIgZmlsbD0iIzQ0NCIvPjwvc3ZnPg==')] bg-repeat-x opacity-50" />
                    <span className="text-[10px] text-cyber-cyan tracking-[0.2em] mt-1">AUTHORIZED</span>
                  </div>
                </div>

                {/* Follow Stats */}
                <div className="flex items-center gap-8 py-2 border-t border-white/5 border-b border-white/5">
                  <button onClick={() => navigate('/following')} className="group flex items-center gap-2">
                    <span className="text-xl font-orbitron font-bold text-white group-hover:text-cyber-cyan transition-colors">{followStats?.following_count || 0}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{t('profile.following')}</span>
                  </button>
                  <div className="w-[1px] h-4 bg-white/10" />
                  <button onClick={() => navigate('/followers')} className="group flex items-center gap-2">
                    <span className="text-xl font-orbitron font-bold text-white group-hover:text-neon-purple transition-colors">{followStats?.followers_count || 0}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">{t('profile.followers')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hex Stats Grid (Bottom of Card) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
              {[
                { label: 'CONTRIBUTION', value: stats?.post_count || 0, color: 'text-neon-purple', icon: '📝' },
                { label: 'ENERGY_VAL', value: stats?.like_count || 0, color: 'text-cyber-cyan', icon: '⚡' },
                { label: 'ARCHIVES', value: stats?.favorite_count || 0, color: 'text-pink-500', icon: '💾' },
                { label: 'NEURAL_LINKS', value: stats?.comment_count || 0, color: 'text-white', icon: '🔗' },
              ].map((stat, i) => (
                <div key={i} className="bg-black/40 border border-white/5 rounded p-3 flex items-center justify-between hover:bg-white/5 transition-colors group">
                  <div>
                    <div className="text-[10px] text-gray-500 font-mono tracking-widest mb-1 group-hover:text-white transition-colors">{stat.label}</div>
                    <div className={`text-xl font-orbitron font-bold ${stat.color} drop-shadow-md`}>{stat.value}</div>
                  </div>
                  <div className="text-2xl opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all">{stat.icon}</div>
                </div>
              ))}
            </div>
          </div>
        </CyberCard>

        {/* Dashboard Grid - System Modules */}
        <h2 className="text-xl font-orbitron font-bold text-gray-500 mt-12 mb-6 flex items-center gap-4">
          <span className="w-2 h-8 bg-neon-purple" />
          SYSTEM MODULES
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Module 1: Notifications */}
          <CyberCard
            className="p-6 cursor-pointer group hover:bg-white/5 border-yellow-500/20 hover:border-yellow-500/60"
            onClick={() => navigate('/notifications')}
            variant="outline"
          >
            <div className="flex justify-between items-start mb-4">
              <Bell className="w-8 h-8 text-yellow-500 group-hover:rotate-12 transition-transform duration-300" />
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-yellow-500 text-black text-xs font-bold rounded animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount} NEW
                </span>
              )}
            </div>
            <h3 className="font-orbitron font-bold text-lg text-white mb-1 group-hover:text-yellow-400 transition-colors">SIGNALS</h3>
            <p className="text-xs text-gray-400 font-mono">{t('profile.notifications.desc')}</p>
          </CyberCard>

          {/* Module 2: My Posts */}
          <CyberCard className="p-6 cursor-pointer group hover:bg-white/5 border-neon-purple/20 hover:border-neon-purple/60" onClick={() => navigate('/my-posts')} variant="outline">
            <Grid className="w-8 h-8 text-neon-purple mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-orbitron font-bold text-lg text-white mb-1 group-hover:text-neon-purple transition-colors">MEMORY BANK</h3>
            <p className="text-xs text-gray-400 font-mono">{t('profile.my_posts.desc')}</p>
          </CyberCard>

          {/* Module 3: Activity */}
          <CyberCard className="p-6 cursor-pointer group hover:bg-white/5 border-cyber-cyan/20 hover:border-cyber-cyan/60" onClick={() => navigate('/activity')} variant="outline">
            <Activity className="w-8 h-8 text-cyber-cyan mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-orbitron font-bold text-lg text-white mb-1 group-hover:text-cyber-cyan transition-colors">LOGS</h3>
            <p className="text-xs text-gray-400 font-mono">{t('profile.activity.desc')}</p>
          </CyberCard>

          {/* Module 4: Settings */}
          <CyberCard className="p-6 cursor-pointer group hover:bg-white/5 border-pink-500/20 hover:border-pink-500/60" onClick={() => navigate('/settings')} variant="outline">
            <Settings className="w-8 h-8 text-pink-500 mb-4 group-hover:rotate-90 transition-transform duration-500" />
            <h3 className="font-orbitron font-bold text-lg text-white mb-1 group-hover:text-pink-500 transition-colors">CONFIG</h3>
            <p className="text-xs text-gray-400 font-mono">{t('profile.settings.desc')}</p>
          </CyberCard>
        </div>
      </div>

      {/* 编辑资料模态框 */}
      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={user || null}
      />
    </>
  );
};

export default Profile;
