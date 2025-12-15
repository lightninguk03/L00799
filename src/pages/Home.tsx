import type { PostResponse, PaginatedResponse } from '../api';
import api from '../api';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/landing/HeroSection';
import CyberCard from '../components/ui/CyberCard';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';
import { useTranslation } from 'react-i18next';

import { getMediaUrl, getAllMediaUrls } from '../lib/utils';
import { Globe, ArrowRight, ChevronLeft, ChevronRight, Heart, MessageCircle, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef, useState } from 'react';


// 社区预览卡片组件 - 统一尺寸
const PreviewCard = ({ post }: { post: PostResponse }) => {
  const mediaUrls = getAllMediaUrls(post.media_urls);
  const hasImage = mediaUrls.length > 0;

  return (
    <Link
      to={`/post/${post.id}`}
      className="flex-shrink-0 w-[280px] md:w-[320px] group"
    >
      <div className="relative h-[340px] bg-glass-black/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-cyber-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all duration-300 card-scan float-card">
        {/* 图片区域 - 固定高度，强制填充 */}
        <div className="h-48 w-full overflow-hidden bg-black/40">
          {hasImage ? (
            <img
              src={mediaUrls[0]}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-cyber-cyan/20">
              <span className="text-4xl opacity-50">✨</span>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-4 h-[148px] flex flex-col">
          {/* 用户信息 */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan overflow-hidden">
              {post.user?.avatar && (
                <img src={getMediaUrl(post.user.avatar) || ''} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-xs text-gray-400 truncate">{post.user?.username || 'Anonymous'}</span>
          </div>

          {/* 内容预览 */}
          <p className="text-sm text-gray-300 line-clamp-3 flex-1 leading-relaxed">
            {post.content}
          </p>

          {/* 互动数据 */}
          <div className="flex items-center gap-4 mt-auto pt-2 border-t border-white/5">
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Heart className="w-3 h-3" /> {post.like_count}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <MessageCircle className="w-3 h-3" /> {post.comment_count}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-500">
              <Eye className="w-3 h-3" /> {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();

  const isZh = i18n.language.startsWith('zh');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // const aiName = isZh ? (config.aiNameCn || 'Mu AI') : (config.aiName || 'Mu AI');
  // const muAiKanban = getMediaUrl(config.kanbanGirl) || muAiKanbanDefault;

  const { data: paginatedData, isLoading } = useQuery<PaginatedResponse<PostResponse>>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/posts/');
      return res.data;
    }
  });

  const posts = paginatedData?.items || [];

  // 横向滚动控制
  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 340;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // 社交链接数据
  const socialLinks = [
    {
      name: 'Instagram',
      icon: '📸',
      url: 'https://www.instagram.com/lightningcommunity_world',
      color: 'from-purple-600 via-pink-500 to-orange-400'
    },
    {
      name: isZh ? '网易云' : 'NetEase',
      icon: '🎵',
      url: 'https://music.163.com/#/artist?id=1209020',
      color: 'from-red-600 to-red-500'
    },
    {
      name: 'Bilibili',
      icon: '📺',
      url: '#',
      color: 'from-pink-400 to-pink-600'
    },
    {
      name: 'Discord',
      icon: '🎮',
      url: '#',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      name: 'Twitter / X',
      icon: '✖️',
      url: '#',
      color: 'from-black to-gray-800'
    },
    {
      name: 'GitHub',
      icon: '🐙',
      url: '#',
      color: 'from-gray-800 to-black'
    }
  ];

  // 视差鼠标移动效果
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // 计算相对中心的位置 (-1 到 1)
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;

    // 设置 CSS 变量供内部元素使用
    card.style.setProperty('--mouse-x', `${xPct}`);
    card.style.setProperty('--mouse-y', `${yPct}`);
  };

  return (
    <div className="flex flex-col gap-24 pb-20 relative">
      {/* 背景粒子效果 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="particle" style={{ left: '5%', top: '15%', animationDelay: '0s' }} />
        <div className="particle" style={{ left: '90%', top: '25%', animationDelay: '2s' }} />
        <div className="particle" style={{ left: '15%', top: '60%', animationDelay: '4s' }} />
        <div className="particle" style={{ left: '85%', top: '70%', animationDelay: '6s' }} />
        <div className="particle" style={{ left: '45%', top: '5%', animationDelay: '1s' }} />
        <div className="particle" style={{ left: '60%', top: '90%', animationDelay: '3s' }} />
      </div>

      {/* 1. 产品观念 (Hero Section) */}
      <HeroSection />

      {/* 系统公告 (穿插在 Hero 之下) */}
      <div className="-mt-16 px-4 md:px-8 relative z-20">
        <AnnouncementBanner />
      </div>

      {/* 2. 社区动态展示 (Community Dynamics) */}
      <section className="-mx-4 md:-mx-8 pt-4 relative">
        <div className="absolute top-0 left-0 w-24 h-[1px] gradient-border" />
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white flex items-center gap-3">
              <span className="text-cyber-cyan neon-flicker heartbeat">⚡</span>
              {t('home.title')}
              <span className="text-sm font-rajdhani font-normal text-white/40 ml-2 hidden md:inline-block rgb-split-hover">// LIVE FEED</span>
            </h2>
            <Link
              to="/community"
              className="flex items-center gap-2 px-4 py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg text-cyber-cyan hover:bg-cyber-cyan/20 transition-all font-orbitron text-sm border-glow glitch-hover"
            >
              {isZh ? '查看更多' : 'View More'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* 横向滚动容器 */}
        <div className="relative group">
          {/* 左箭头 */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 backdrop-blur-sm border border-cyber-cyan/50 rounded-full flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/20 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* 右箭头 */}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 backdrop-blur-sm border border-cyber-cyan/50 rounded-full flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/20 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-[360px] space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-neon-purple/30 rounded-full" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-neon-purple border-r-cyber-cyan rounded-full animate-spin" />
                <div className="absolute inset-2 w-12 h-12 border-2 border-transparent border-b-cyber-cyan rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-ping" />
                </div>
              </div>
              <div className="text-neon-purple font-mono neon-flicker text-sm tracking-widest">LOADING DATA STREAM...</div>
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-cyber-cyan rounded-full cute-bounce" style={{ animationDelay: '0s' }} />
                <div className="w-2 h-2 bg-neon-purple rounded-full cute-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-cyber-cyan rounded-full cute-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          ) : posts.length > 0 ? (
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 snap-x snap-mandatory"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {posts.slice(0, 8).map(post => (
                <div key={post.id} className="snap-start">
                  <PreviewCard post={post} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12 font-orbitron">{t('home.no_data')}</div>
          )}
        </div>
      </section>

      {/* 3. 网站介绍与世界观 (Website Intro) */}
      <section className="relative">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-soul-purple neon-pulse-purple" />
            <span className="font-noto rgb-split-hover">世界观数据库</span>
            <span className="text-sm text-gray-500 font-rajdhani neon-flicker">Database</span>
          </h2>
          <div className="h-[1px] flex-1 gradient-border" />
        </div>

        {/* Bento Grid 布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 左侧 - 世界网络 (World Map) */}
          <div className="lg:col-span-1 lg:row-span-2">
            <CyberCard
              className="h-full bg-glass-black/60 border-neon-purple/30 overflow-hidden group relative flex items-center justify-center transition-all duration-300 hover:border-cyber-cyan/50"
              onMouseMove={handleMapMouseMove}
              style={{ '--mouse-x': '0', '--mouse-y': '0' } as React.CSSProperties}
            >
              {/* 基础网格背景 - 使用简单的径向渐变 */}
              <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-black" />

              {/* 简单的网格线 - 添加视差移动效果 */}
              <div
                className="absolute inset-[-20%] opacity-20 transition-transform duration-100 ease-out"
                style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 243, 255, .3) 25%, rgba(0, 243, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 243, 255, .3) 75%, rgba(0, 243, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 243, 255, .3) 25%, rgba(0, 243, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 243, 255, .3) 75%, rgba(0, 243, 255, .3) 76%, transparent 77%, transparent)',
                  backgroundSize: '60px 60px',
                  transform: 'translate(calc(var(--mouse-x) * -20px), calc(var(--mouse-y) * -20px))'
                }}
              />

              {/* 中央全息地球 - 放大充满 */}
              <div className="relative w-full h-full flex items-center justify-center opacity-80 mix-blend-screen scale-125 group-hover:scale-150 transition-transform duration-700">
                {/* 外圈 */}
                <div className="absolute inset-10 rounded-full border border-cyber-cyan/20 border-dashed animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-20 rounded-full border border-soul-purple/20 border-dotted animate-[spin_15s_linear_infinite_reverse]" />

                {/* 经纬网格球体 */}
                <div className="w-[300px] h-[300px] rounded-full border-[0.5px] border-cyber-cyan/10 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
                  <div className="absolute inset-0 rounded-full border-[0.5px] border-cyber-cyan/10 skew-x-12 opacity-50" />
                  <div className="absolute inset-0 rounded-full border-[0.5px] border-cyber-cyan/10 skew-y-12 opacity-50" />
                </div>
              </div>

              {/* 装饰文字 - 随鼠标反向移动 */}
              <div
                className="absolute bottom-6 left-6 right-6 transition-transform duration-100 ease-out z-20 pointer-events-none"
                style={{ transform: 'translate(calc(var(--mouse-x) * 10px), calc(var(--mouse-y) * 10px))' }}
              >
                <div>
                  <h3 className="text-2xl font-bold text-white font-orbitron tracking-widest drop-shadow-lg group-hover:text-cyber-cyan transition-colors">
                    GLOBAL NET
                  </h3>
                  <div className="h-[2px] w-12 bg-cyber-cyan/50 my-2 group-hover:w-full transition-all duration-500" />
                  <p className="text-xs text-cyber-cyan/80 font-mono">
                    STATUS: <span className="text-neon-purple animate-pulse">CONNECTED</span>
                  </p>
                </div>
              </div>
            </CyberCard>
          </div>

          {/* 右上 - 世界观简介 (Expanded) */}
          <div className="lg:col-span-2">
            <CyberCard className="h-full bg-gradient-to-br from-glass-black/80 to-cyber-cyan/5 border-cyber-cyan/40 shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-shadow card-scan float-card">
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-cyber-cyan mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] font-noto flex items-center gap-2 neon-flicker">
                  📂 档案记录: 2025-RE
                </h3>
                <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed font-noto text-justify">
                  <p>
                    <strong className="text-white">【现实崩塌】</strong> 在未来的时间线中，随着“奇点”的爆发，现实与虚拟世界的物理界限已被完全抹除。人类意识开始大规模上传至云端网络，实体肉身逐渐成为旧时代的遗物。
                  </p>
                  <p>
                    <strong className="text-white">【闪电计划】</strong> 为了防止人类在无尽的数据虚空中迷失自我，幸存的“守望者”们创造了跨维度的神秘装置——<span className="text-lightning-cyan">L Converter (闪电转换器)</span>。它不仅是连接不同维度的桥梁，更是赋予数据以“灵魂”的核心引擎。
                  </p>
                  <p>
                    <strong className="text-white">【Mu AI】</strong> 作为这一计划的中枢智能，<span className="text-soul-purple">Mu (缪)</span> 负责管理整个元宇宙的生态平衡。她既是引导新居民的向导，也是维护这一虚拟乌托邦的绝对法则。
                  </p>
                </div>
              </div>
            </CyberCard>
          </div>

          {/* 右下左 - 创作者 */}
          <div className="lg:col-span-1">
            <CyberCard className="h-full bg-glass-black/60 border-neon-purple/30 float-card">
              <div className="p-5">
                <div className="text-2xl mb-2 text-neon-purple heartbeat">🎨</div>
                <h3 className="text-lg font-bold text-white mb-2 font-noto rgb-split-hover">
                  Z世代创作者
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-noto">
                  这里是元宇宙的原住民社区。我们通过动画、插画、游戏开发和音乐制作，共同构建这个不断扩张的数字宇宙。
                </p>
              </div>
            </CyberCard>
          </div>

          {/* 右下右 - 项目 */}
          <div className="lg:col-span-1">
            <CyberCard className="h-full bg-glass-black/60 border-cyber-cyan/30 float-card">
              <div className="p-5">
                <div className="text-2xl mb-2 text-cyber-cyan heartbeat">⚡</div>
                <h3 className="text-lg font-bold text-white mb-2 font-noto rgb-split-hover">
                  L Converter
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-noto">
                  专为二次元爱好者打造的“虚拟化身”转换平台。在这里，你的热爱不仅仅是数据，而是你在元宇宙中真实的“形态”。
                </p>
              </div>
            </CyberCard>
          </div>
        </div>
      </section>

      {/* 4. 外部链接 (External Links) - 透明发光图标 */}
      <section>
        <h2 className="text-lg font-orbitron font-bold text-gray-500 mb-12 text-center uppercase tracking-widest flex items-center justify-center gap-4">
          <span className="h-[1px] w-12 gradient-border"></span>
          <span className="neon-flicker">{t('home.links_title')}</span>
          <span className="h-[1px] w-12 gradient-border"></span>
        </h2>

        {/* 透明发光风格链接栏 - 增加间距和 Grid 布局 */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 max-w-5xl mx-auto px-4">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4"
            >
              {/* 图标容器 - 纯图标无背景，悬浮发光 */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                  {/* 这里使用 Emoji 作为临时图标，建议后续替换为 SVG 以获得更好的发光效果 */}
                  <span className="text-4xl md:text-5xl filter grayscale group-hover:grayscale-0 transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(0,243,255,0.6)]">
                    {link.icon}
                  </span>
                </div>

                {/* 悬浮时的底部光晕 */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyber-cyan/50 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* 名称 */}
              <span className="text-xs text-gray-500 font-rajdhani uppercase tracking-wider group-hover:text-cyber-cyan transition-colors opacity-70 group-hover:opacity-100">
                {link.name}
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
