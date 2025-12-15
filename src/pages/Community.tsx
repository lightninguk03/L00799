import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Search, Users, Send } from 'lucide-react';

import api from '../api';
import type { PostResponse, PaginatedResponse, UserResponse } from '../api';
import PostCard from '../components/ui/PostCard';
import CreatePostModal from '../components/ui/CreatePostModal';
import CyberCard from '../components/ui/CyberCard';
import MasonryGrid from '../components/ui/MasonryGrid';
import { cn } from '../lib/utils';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

const Community = () => {
  const { t } = useTranslation();
  const { requireAuth } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState<'posts' | 'users'>('posts');
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isPostHovered, setIsPostHovered] = useState(false);



  // 发帖需要登录
  const handleCreatePost = () => {
    if (requireAuth(undefined, '请先登录后再发帖')) {
      setIsPostModalOpen(true);
    }
  };

  // 获取帖子列表
  const { data: paginatedData, isLoading } = useQuery<PaginatedResponse<PostResponse>>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/posts/');
      return res.data;
    },
    enabled: !isSearching,
  });

  // 搜索帖子 - 使用 /search/posts?q=xxx 端点
  const { data: searchPostsData, isLoading: isSearchingPosts } = useQuery<PaginatedResponse<PostResponse>>({
    queryKey: ['search-posts', searchQuery],
    queryFn: async () => {
      const res = await api.get(`/search/posts?q=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    enabled: isSearching && searchTab === 'posts' && searchQuery.length > 0,
  });

  // 搜索用户 - 使用 /search/users?q=xxx 端点
  const { data: searchUsersData, isLoading: isSearchingUsers } = useQuery<PaginatedResponse<UserResponse>>({
    queryKey: ['search-users', searchQuery],
    queryFn: async () => {
      const res = await api.get(`/search/users?q=${encodeURIComponent(searchQuery)}`);
      return res.data;
    },
    enabled: isSearching && searchTab === 'users' && searchQuery.length > 0,
  });

  const posts = isSearching ? (searchPostsData?.items || []) : (paginatedData?.items || []);
  const users = searchUsersData?.items || [];


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(false);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto pb-24">
        {/* 页面标题 & 装饰 - 赛博朋克风格状态栏 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="text-cyber-cyan/70 font-mono text-xs tracking-widest flex items-center gap-2 px-3 py-1.5 border border-cyber-cyan/30 rounded bg-cyber-cyan/5 border-glow">
            <span className="w-2 h-2 bg-cyber-cyan rounded-full animate-ping" />
            <span className="rgb-split-hover">SYSTEM: L-CONVERTER ONLINE</span>
          </div>
          <div className="text-neon-purple/50 font-orbitron text-xs tracking-wider neon-flicker">
            V2.0.45 BETA
          </div>
        </div>

        {/* 终端风格搜索栏 - 增强动态效果 */}
        <form onSubmit={handleSearch} className="mb-8 group">
          <div className="relative light-trace">
            <div className="absolute inset-0 bg-cyber-cyan/20 blur-xl opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
            <div className="relative z-10 bg-black/80 backdrop-blur-md border border-cyber-cyan/30 rounded-lg p-1 flex items-center shadow-[0_0_15px_rgba(0,243,255,0.1)] group-hover:border-cyber-cyan/60 group-hover:shadow-[0_0_30px_rgba(0,243,255,0.3)] transition-all data-flow">
              <div className="px-4 py-3 text-cyber-cyan font-mono border-r border-cyber-cyan/20 mr-2 flex items-center gap-2">
                <span className="animate-pulse text-lg">_&gt;</span>
                <span className="hidden md:inline neon-flicker">SEARCH_QUERY:</span>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('community.search_placeholder')}
                className="flex-1 bg-transparent border-none text-white placeholder-gray-600 focus:ring-0 font-mono text-lg"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-cyber-cyan/10 hover:bg-cyber-cyan/20 text-cyber-cyan rounded transition-colors mr-1"
              >
                <Search className="w-5 h-5" />
              </button>
              {isSearching && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-16 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {t('common.cancel')}
                </button>
              )}
            </div>
            {/* 底部扫描线 - 渐变动画 */}
            <div className="absolute bottom-0 left-0 h-[2px] w-full opacity-50 group-hover:opacity-100 transition-opacity gradient-border" />
          </div>
        </form>

        {/* 全息风格标签页 */}
        {isSearching && (
          <div className="flex space-x-6 mb-8 border-b border-white/10 pb-1">
            <button
              onClick={() => setSearchTab('posts')}
              className={cn(
                "px-2 py-2 font-orbitron text-sm transition-all relative group",
                searchTab === 'posts'
                  ? "text-neon-purple"
                  : "text-gray-500 hover:text-white"
              )}
            >
              {t('search.posts')}
              <span className={cn(
                "absolute bottom-[-5px] left-0 w-full h-[2px] bg-neon-purple shadow-[0_0_10px_#8A2BE2] transition-transform duration-300",
                searchTab === 'posts' ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
              )} />
            </button>
            <button
              onClick={() => setSearchTab('users')}
              className={cn(
                "px-2 py-2 font-orbitron text-sm transition-all relative group",
                searchTab === 'users'
                  ? "text-cyber-cyan"
                  : "text-gray-500 hover:text-white"
              )}
            >
              {t('search.users')}
              <span className={cn(
                "absolute bottom-[-5px] left-0 w-full h-[2px] bg-cyber-cyan shadow-[0_0_10px_#00F3FF] transition-transform duration-300",
                searchTab === 'users' ? "scale-x-100" : "scale-x-0 group-hover:scale-x-50"
              )} />
            </button>
          </div>
        )}


        {/* 内容区域 */}
        {(isLoading || isSearchingPosts || isSearchingUsers) ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-6">
            {/* 赛博朋克风格加载动画 */}
            <div className="relative">
              <div className="w-20 h-20 border-4 border-neon-purple/30 rounded-full" />
              <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-neon-purple border-r-cyber-cyan rounded-full animate-spin" />
              <div className="absolute inset-2 w-16 h-16 border-2 border-transparent border-b-cyber-cyan rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-3 h-3 bg-cyber-cyan rounded-full animate-ping" />
              </div>
            </div>
            <div className="text-neon-purple font-mono neon-flicker text-sm tracking-widest">LOADING DATA STREAM...</div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-cyber-cyan rounded-full cute-bounce" style={{ animationDelay: '0s' }} />
              <div className="w-2 h-2 bg-neon-purple rounded-full cute-bounce" style={{ animationDelay: '0.1s' }} />
              <div className="w-2 h-2 bg-cyber-cyan rounded-full cute-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          </div>
        ) : isSearching && searchTab === 'users' ? (
          // 用户搜索结果
          <div className="space-y-4">
            {users.length > 0 ? (
              users.map((user) => (
                <CyberCard key={user.id} className="p-4 bg-glass-black/40 border-neon-purple/20 hover:border-neon-purple/50">
                  <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-neon-purple to-transparent">
                      <div className="w-full h-full rounded-full bg-black overflow-hidden relative group cursor-pointer">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.username} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-900">
                            <Users className="w-6 h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-white font-orbitron text-lg tracking-wide">{user.username}</h3>
                      <p className="text-cyber-cyan/60 text-xs font-mono">ID: {user.email}</p>
                    </div>
                  </div>
                </CyberCard>
              ))
            ) : (
              <div className="text-center text-gray-500 py-12 font-mono border border-dashed border-gray-800 rounded-lg">
                NO_SIGNALS_FOUND
              </div>
            )}
          </div>
        ) : (
          // 帖子列表 - 瀑布流布局
          posts.length > 0 ? (
            <MasonryGrid gap={24}>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-visible"
                >
                  <PostCard post={post} />
                </motion.div>
              ))}
            </MasonryGrid>
          ) : (
            <div className="text-center py-20">
              <div className="inline-block p-6 rounded-full bg-white/5 mb-4">
                <div className="text-4xl">📡</div>
              </div>
              <p className="text-gray-400 font-orbitron tracking-widest text-sm">
                {isSearching ? 'NO DATA FOUND IN SECTOR' : 'VOID DETECTED - INITIALIZE FIRST POST'}
              </p>
            </div>
          )
        )}
      </div>

      {/* 右下角发帖按钮 - 能量核心风格 */}
      {!isPostModalOpen && (
      <div className="fixed right-4 md:right-8 bottom-28 md:bottom-24 z-[99999]">
        <div className="relative group">
          {/* 能量场波纹 - 最外层 */}
          <div className="absolute inset-[-20px] rounded-full border border-neon-purple/20 energy-field-ripple pointer-events-none" />
          <div className="absolute inset-[-20px] rounded-full border border-cyber-cyan/20 energy-field-ripple pointer-events-none" style={{ animationDelay: '1s' }} />
          
          {/* 外层旋转能量环 */}
          <div className="absolute inset-[-12px] rounded-full energy-ring-outer pointer-events-none">
            <div className="w-full h-full rounded-full border-2 border-transparent" style={{ 
              borderTopColor: 'rgba(138, 43, 226, 0.8)',
              borderRightColor: 'rgba(0, 243, 255, 0.4)',
              borderBottomColor: 'rgba(255, 0, 255, 0.6)',
              borderLeftColor: 'rgba(0, 243, 255, 0.2)'
            }} />
          </div>
          
          {/* 内层反向旋转能量环 */}
          <div className="absolute inset-[-6px] rounded-full energy-ring-inner pointer-events-none">
            <div className="w-full h-full rounded-full border border-transparent" style={{ 
              borderTopColor: 'rgba(0, 243, 255, 0.6)',
              borderBottomColor: 'rgba(138, 43, 226, 0.6)'
            }} />
          </div>
          
          <motion.button
            onClick={handleCreatePost}
            onMouseEnter={() => setIsPostHovered(true)}
            onMouseLeave={() => setIsPostHovered(false)}
            className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-neon-purple via-cyber-cyan/80 to-pink-500 backdrop-blur-xl energy-core-btn flex items-center justify-center overflow-hidden"
            whileHover={{ scale: 1.15, y: -5 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            {/* 内部渐变背景 */}
            <div className="absolute inset-[3px] rounded-full bg-gradient-to-br from-[#1a0a2e] via-[#0d1a2d] to-[#1a0a2e]" />
            
            {/* 核心发光层 */}
            <div className="absolute inset-[6px] rounded-full bg-gradient-to-br from-neon-purple/40 via-cyber-cyan/30 to-pink-500/40 energy-core-glow" />
            
            {/* 中心高亮 */}
            <div className="absolute inset-[12px] rounded-full bg-gradient-radial from-white/30 via-cyber-cyan/20 to-transparent" />
            
            {/* 图标 - 发射信号箭头 */}
            <div className="relative z-10 flex items-center justify-center">
              <Send className="w-7 h-7 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)] group-hover:scale-110 transition-transform" style={{ transform: 'rotate(-45deg)' }} />
            </div>
            
            {/* 内部扫描线 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-transparent via-white/5 to-transparent animate-[cardScan_2s_linear_infinite] pointer-events-none" />
          </motion.button>
          
          {/* 发帖提示语 - 左侧显示 */}
          <AnimatePresence>
            {isPostHovered && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-black/95 text-white border border-neon-purple/50 px-4 py-2 rounded-lg text-sm font-mono whitespace-nowrap backdrop-blur-sm shadow-[0_0_20px_rgba(138,43,226,0.3)]"
              >
                <span className="text-neon-purple font-bold">{t('community.create_post')}</span>
                <span className="text-cyber-cyan/70 text-xs ml-2">TRANSMIT</span>
                {/* 右侧箭头 */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-black/95 border-r border-t border-neon-purple/50 rotate-45" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      )}

      {/* 发帖模态框 */}
      <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />
    </>
  );
};

export default Community;
