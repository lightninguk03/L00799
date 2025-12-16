import type { PostResponse, PaginatedResponse } from '../api';
import api from '../api';
import { useQuery } from '@tanstack/react-query';
import HeroSection from '../components/landing/HeroSection';
import CyberCard from '../components/ui/CyberCard';
import AnnouncementBanner from '../components/ui/AnnouncementBanner';
import { useTranslation } from 'react-i18next';
import { useSiteConfig } from '../contexts/SiteConfigContext';

import { getMediaUrl, getAllMediaUrls, getFullUrl } from '../lib/utils';
import { Globe, ArrowRight, ChevronLeft, ChevronRight, Heart, MessageCircle, Eye, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';


// 帖子预览卡片组件 - 统一尺寸
const PreviewCard = ({ post }: { post: PostResponse }) => {
  const mediaUrls = getAllMediaUrls(post.media_urls);
  const hasMedia = mediaUrls.length > 0;
  const isVideo = post.media_type === 'video';

  return (
    <Link
      to={`/post/${post.id}`}
      className="flex-shrink-0 w-[140px] sm:w-[180px] md:w-[280px] lg:w-[320px] group"
    >
      <div className="relative bg-glass-black/60 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-cyber-cyan/50 hover:shadow-[0_0_20px_rgba(0,255,255,0.2)] transition-all duration-300 card-scan float-card">
        {/* 媒体区域 - 固定高度 */}
        <div className="h-24 sm:h-32 md:h-48 w-full overflow-hidden bg-black/40 relative">
          {hasMedia ? (
            isVideo ? (
              <>
                {/* 优先使用 thumbnail 封面图，否则显示视频 */}
                {post.thumbnail ? (
                  <img
                    src={getMediaUrl(post.thumbnail) || ''}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <video
                    src={mediaUrls[0]}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    muted
                    playsInline
                    preload="metadata"
                    poster={`${mediaUrls[0]}#t=0.1`}
                  />
                )}
                {/* 视频遮罩和播放按钮 */}
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-black/70 flex items-center justify-center border-2 border-neon-purple/70 shadow-[0_0_20px_rgba(138,43,226,0.5)]">
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-neon-purple fill-current ml-0.5" />
                  </div>
                </div>
                {/* 视频标签 */}
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 bg-neon-purple/80 text-white text-[8px] sm:text-[10px] font-bold rounded">
                  VIDEO
                </div>
              </>
            ) : (
              <img
                src={mediaUrls[0]}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                style={{ objectFit: 'cover' }}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-purple/20 to-cyber-cyan/20">
              <span className="text-4xl opacity-50">?</span>
            </div>
          )}
        </div>

        {/* 内容区域 */}
        <div className="p-2 sm:p-3 md:p-4">
          {/* 用户信息 */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <div className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan overflow-hidden flex-shrink-0">
              {post.user?.avatar && (
                <img src={getMediaUrl(post.user.avatar) || ''} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[80px] sm:max-w-[120px]">{post.user?.username || 'Anonymous'}</span>
          </div>

          {/* 内容预览 */}
          <p className="text-[11px] sm:text-xs md:text-sm text-gray-300 line-clamp-2 leading-relaxed mb-2">
            {post.content}
          </p>

          {/* 互动数据 */}
          <div className="flex items-center gap-2 sm:gap-3 pt-1.5 border-t border-white/5">
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-xs text-gray-500">
              <Heart className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {post.like_count}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-xs text-gray-500">
              <MessageCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {post.comment_count}
            </span>
            <span className="flex items-center gap-0.5 text-[9px] sm:text-[10px] md:text-xs text-gray-500">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> {post.view_count}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

// ��������ݿ�ý��������� - ֧��ͼƬ/��Ƶ/�ֲ�
interface WorldDatabaseMediaProps {
  config: ReturnType<typeof useSiteConfig>['config'];
  onMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void;
}

const WorldDatabaseMedia = ({ config, onMouseMove }: WorldDatabaseMediaProps) => {
  // �Ӻ�����û�ȡý������
  const rawMedia = config._backendConfig?.world_database_media;
  const mediaUrls: string[] = Array.isArray(rawMedia)
    ? rawMedia.map((url: string) => getFullUrl(url)).filter((url): url is string => url !== null)
    : [];
  
  const hasMedia = mediaUrls.length > 0;
  const isCarousel = mediaUrls.length > 1;
  
  // �ж��Ƿ�Ϊ��Ƶ
  const isVideo = (url: string) => {
    const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
    return videoExtensions.some(ext => url.toLowerCase().includes(ext));
  };
  
  const firstMediaIsVideo = hasMedia && isVideo(mediaUrls[0]);
  
  // �ֲ�״̬
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  
  // �Զ��ֲ�
  useEffect(() => {
    if (!isCarousel || !isAutoPlaying) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isCarousel, isAutoPlaying, mediaUrls.length]);
  
  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);
  
  const prevSlide = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + mediaUrls.length) % mediaUrls.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [mediaUrls.length]);
  
  const nextSlide = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % mediaUrls.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, [mediaUrls.length]);

  // ��ý������ʱ��ʾý��
  if (hasMedia) {
    return (
      <div className="lg:col-span-1 lg:row-span-2">
        <CyberCard
          className="h-full bg-glass-black/60 border-neon-purple/30 overflow-hidden group relative transition-all duration-300 hover:border-cyber-cyan/50"
        >
          {/* ������Ƶ */}
          {firstMediaIsVideo && !isCarousel && (
            <>
              <video
                src={mediaUrls[0]}
                controls
                loop
                playsInline
                preload="metadata"
                poster={`${mediaUrls[0]}#t=0.1`}
                className="absolute inset-0 w-full h-full object-cover"
              />
              {/* ��Ƶ��ǩ */}
              <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-neon-purple/80 text-white text-xs font-bold rounded">
                VIDEO
              </div>
            </>
          )}
          
          {/* ����ͼƬ */}
          {!firstMediaIsVideo && !isCarousel && (
            <img
              src={mediaUrls[0]}
              alt="World Database"
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
          )}
          
          {/* ��ͼ/��Ƶ�ֲ� */}
          {isCarousel && (
            <>
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0"
                >
                  {isVideo(mediaUrls[currentIndex]) ? (
                    <>
                      <video
                        src={mediaUrls[currentIndex]}
                        controls
                        loop
                        playsInline
                        preload="metadata"
                        poster={`${mediaUrls[currentIndex]}#t=0.1`}
                        className="w-full h-full object-cover"
                      />
                      {/* ��Ƶ��ǩ */}
                      <div className="absolute top-3 left-3 z-10 px-2 py-1 bg-neon-purple/80 text-white text-xs font-bold rounded">
                        VIDEO
                      </div>
                    </>
                  ) : (
                    <img
                      src={mediaUrls[currentIndex]}
                      alt={`Slide ${currentIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* �ֲ����� */}
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-cyber-cyan/50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-black/50 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/70 hover:border-cyber-cyan/50 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              
              {/* ָʾ�� */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                {mediaUrls.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      index === currentIndex
                        ? 'w-4 bg-cyber-cyan shadow-[0_0_8px_#00f3ff]'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
          
          {/* ���ֲ� */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
          
          {/* ������˱߿�װ�� */}
          <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-cyber-cyan/40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-cyber-cyan/40 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l-2 border-b-2 border-neon-purple/40 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r-2 border-b-2 border-neon-purple/40 pointer-events-none" />
          
          {/* ɨ����Ч�� */}
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.02)_50%)] bg-[length:100%_4px] pointer-events-none" />
        </CyberCard>
      </div>
    );
  }

  // Ĭ����ʾ GLOBAL NET ����
  return (
    <div className="lg:col-span-1 lg:row-span-2">
      <CyberCard
        className="h-full bg-glass-black/60 border-neon-purple/30 overflow-hidden group relative flex items-center justify-center transition-all duration-300 hover:border-cyber-cyan/50"
        onMouseMove={onMouseMove}
        style={{ '--mouse-x': '0', '--mouse-y': '0' } as React.CSSProperties}
      >
        {/* �������񱳾� */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-900 to-black" />

        {/* ������ - �Ӳ�Ч�� */}
        <div
          className="absolute inset-[-20%] opacity-20 transition-transform duration-100 ease-out"
          style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0, 243, 255, .3) 25%, rgba(0, 243, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 243, 255, .3) 75%, rgba(0, 243, 255, .3) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 243, 255, .3) 25%, rgba(0, 243, 255, .3) 26%, transparent 27%, transparent 74%, rgba(0, 243, 255, .3) 75%, rgba(0, 243, 255, .3) 76%, transparent 77%, transparent)',
            backgroundSize: '60px 60px',
            transform: 'translate(calc(var(--mouse-x) * -20px), calc(var(--mouse-y) * -20px))'
          }}
        />

        {/* ����ȫϢ���� */}
        <div className="relative w-full h-full flex items-center justify-center opacity-80 mix-blend-screen scale-125 group-hover:scale-150 transition-transform duration-700">
          <div className="absolute inset-10 rounded-full border border-cyber-cyan/20 border-dashed animate-[spin_20s_linear_infinite]" />
          <div className="absolute inset-20 rounded-full border border-soul-purple/20 border-dotted animate-[spin_15s_linear_infinite_reverse]" />
          <div className="w-[300px] h-[300px] rounded-full border-[0.5px] border-cyber-cyan/10 flex items-center justify-center relative animate-[spin_60s_linear_infinite]">
            <div className="absolute inset-0 rounded-full border-[0.5px] border-cyber-cyan/10 skew-x-12 opacity-50" />
            <div className="absolute inset-0 rounded-full border-[0.5px] border-cyber-cyan/10 skew-y-12 opacity-50" />
          </div>
        </div>

        {/* װ������ */}
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
  );
};

const Home = () => {
  const { t, i18n } = useTranslation();
  const { config } = useSiteConfig();

  const isZh = i18n.language.startsWith('zh');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // ��������ݿ�����
  const worldDb = config.worldDatabase;

  const { data: paginatedData, isLoading } = useQuery<PaginatedResponse<PostResponse>>({
    queryKey: ['posts'],
    queryFn: async () => {
      const res = await api.get('/posts/');
      return res.data;
    }
  });

  const posts = paginatedData?.items || [];

  // �����������
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

  // 社交链接默认值 - 优先使用后台配置
  const defaultSocialLinks = [
    { name: 'Instagram', icon: '📷', url: 'https://www.instagram.com/lightningcommunity_world' },
    { name: isZh ? '网易云音乐' : 'NetEase', icon: '🎵', url: 'https://music.163.com/#/artist?id=1209020' },
    { name: 'Bilibili', icon: '📺', url: '#' },
    { name: 'Discord', icon: '💬', url: '#' },
    { name: 'Twitter / X', icon: '🐦', url: '#' },
    { name: 'GitHub', icon: '💻', url: '#' }
  ];
  
  // ʹ�ú�̨���õ��罻���ӣ����û����ʹ��Ĭ��ֵ
  const socialLinks = config.socialLinks && config.socialLinks.length > 0 
    ? config.socialLinks 
    : defaultSocialLinks;

  // �Ӳ�����ƶ�Ч��
  const handleMapMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // ����������ĵ�λ�� (-1 �� 1)
    const xPct = (x / rect.width - 0.5) * 2;
    const yPct = (y / rect.height - 0.5) * 2;

    // ���� CSS �������ڲ�Ԫ��ʹ��
    card.style.setProperty('--mouse-x', `${xPct}`);
    card.style.setProperty('--mouse-y', `${yPct}`);
  };

  return (
    <div className="flex flex-col gap-24 pb-20 relative">
      {/* ��������Ч�� */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="particle" style={{ left: '5%', top: '15%', animationDelay: '0s' }} />
        <div className="particle" style={{ left: '90%', top: '25%', animationDelay: '2s' }} />
        <div className="particle" style={{ left: '15%', top: '60%', animationDelay: '4s' }} />
        <div className="particle" style={{ left: '85%', top: '70%', animationDelay: '6s' }} />
        <div className="particle" style={{ left: '45%', top: '5%', animationDelay: '1s' }} />
        <div className="particle" style={{ left: '60%', top: '90%', animationDelay: '3s' }} />
      </div>

      {/* 1. ��Ʒ���� (Hero Section) */}
      <HeroSection />

      {/* ϵͳ���� (������ Hero ֮��) */}
      <div className="-mt-16 px-4 md:px-8 relative z-20">
        <AnnouncementBanner />
      </div>

      {/* 2. ������̬չʾ (Community Dynamics) */}
      <section className="-mx-4 md:-mx-8 pt-4 relative">
        <div className="absolute top-0 left-0 w-24 h-[1px] gradient-border" />
        <div className="px-4 md:px-8">
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-orbitron font-bold text-white flex items-center gap-2 sm:gap-3">
              <span className="text-cyber-cyan neon-flicker heartbeat">⚡</span>
              {t('home.title')}
              <span className="text-xs sm:text-sm font-rajdhani font-normal text-white/40 ml-1 sm:ml-2 hidden md:inline-block rgb-split-hover">// LIVE FEED</span>
            </h2>
            <Link
              to="/community"
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg text-cyber-cyan hover:bg-cyber-cyan/20 transition-all font-orbitron text-xs sm:text-sm border-glow glitch-hover"
            >
              <span className="hidden sm:inline">{isZh ? '查看更多' : 'View More'}</span>
              <span className="sm:hidden">{isZh ? '更多' : 'More'}</span>
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        </div>

        {/* ����������� */}
        <div className="relative group">
          {/* ���ͷ */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/80 backdrop-blur-sm border border-cyber-cyan/50 rounded-full flex items-center justify-center text-cyber-cyan hover:bg-cyber-cyan/20 transition-all opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {/* �Ҽ�ͷ */}
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
              className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-4 md:px-8 pb-4 snap-x snap-mandatory"
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

      {/* 3. ��վ����������� (Website Intro) */}
      <section className="relative">
        <div className="flex items-center gap-4 mb-8">
          <h2 className="text-2xl md:text-3xl font-orbitron font-bold text-white flex items-center gap-3">
            <Globe className="w-8 h-8 text-soul-purple neon-pulse-purple" />
            <span className="font-noto rgb-split-hover">{isZh ? worldDb?.titleCn : worldDb?.title || '��������ݿ�'}</span>
            <span className="text-sm text-gray-500 font-rajdhani neon-flicker">{isZh ? worldDb?.subtitleCn : worldDb?.subtitle || 'Database'}</span>
          </h2>
          <div className="h-[1px] flex-1 gradient-border" />
        </div>

        {/* Bento Grid ���� */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* ��� - �������� (World Map) / ������ý������ */}
          <WorldDatabaseMedia 
            config={config} 
            onMouseMove={handleMapMouseMove} 
          />

          {/* ���� - ����ۼ�� (Expanded) */}
          <div className="lg:col-span-2">
            <CyberCard className="h-full bg-gradient-to-br from-glass-black/80 to-cyber-cyan/5 border-cyber-cyan/40 shadow-[0_0_20px_rgba(0,255,255,0.1)] hover:shadow-[0_0_30px_rgba(0,255,255,0.2)] transition-shadow card-scan float-card">
              <div className="p-6 md:p-8">
                <h3 className="text-xl font-bold text-cyber-cyan mb-4 drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] font-noto flex items-center gap-2 neon-flicker">
                  {isZh ? worldDb?.archiveTitleCn : worldDb?.archiveTitle || '📂 档案记录: 2025-RE'}
                </h3>
                <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed font-noto text-justify">
                  <p>
                    <strong className="text-white">【{isZh ? worldDb?.paragraphs?.[0]?.titleCn : worldDb?.paragraphs?.[0]?.title || '现实崩塌'}】</strong> {isZh ? worldDb?.paragraphs?.[0]?.contentCn : worldDb?.paragraphs?.[0]?.content || '在未来的时间线中...'}
                  </p>
                  <p>
                    <strong className="text-white">【{isZh ? worldDb?.paragraphs?.[1]?.titleCn : worldDb?.paragraphs?.[1]?.title || '闪电计划'}】</strong> {isZh ? worldDb?.paragraphs?.[1]?.contentCn : worldDb?.paragraphs?.[1]?.content || '为了防止人类在无尽的数据虚空中迷失自我...'}
                  </p>
                  <p>
                    <strong className="text-white">【{isZh ? worldDb?.paragraphs?.[2]?.titleCn : worldDb?.paragraphs?.[2]?.title || 'Mu AI'}】</strong> {isZh ? worldDb?.paragraphs?.[2]?.contentCn : worldDb?.paragraphs?.[2]?.content || '作为这一计划的中枢智能...'}
                  </p>
                </div>
              </div>
            </CyberCard>
          </div>

          {/* 右下左 - 创作者 */}
          <div className="lg:col-span-1">
            <CyberCard className="h-full bg-glass-black/60 border-neon-purple/30 float-card">
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 font-noto rgb-split-hover">
                  {isZh ? worldDb?.cards?.[0]?.titleCn : worldDb?.cards?.[0]?.title || 'Z世代创作者'}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-noto">
                  {isZh ? worldDb?.cards?.[0]?.descriptionCn : worldDb?.cards?.[0]?.description || '这里是元宇宙的原住民社区。'}
                </p>
              </div>
            </CyberCard>
          </div>

          {/* 右下右 - 项目 */}
          <div className="lg:col-span-1">
            <CyberCard className="h-full bg-glass-black/60 border-cyber-cyan/30 float-card">
              <div className="p-5">
                <h3 className="text-lg font-bold text-white mb-2 font-noto rgb-split-hover">
                  {isZh ? worldDb?.cards?.[1]?.titleCn : worldDb?.cards?.[1]?.title || 'L Converter'}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed font-noto">
                  {isZh ? worldDb?.cards?.[1]?.descriptionCn : worldDb?.cards?.[1]?.description || '专为二次元爱好者打造的虚拟化身转换平台。'}
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

        {/* ͸�������������� - ���Ӽ��� Grid ���� */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-8 max-w-5xl mx-auto px-4">
          {socialLinks.map((link, index) => (
            <a
              key={index}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-4"
            >
              {/* ͼ������ - ��ͼ���ޱ������������� */}
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2">
                  {/* ����ʹ�� Emoji ��Ϊ��ʱͼ�꣬��������滻Ϊ SVG �Ի�ø��õķ���Ч�� */}
                  <span className="text-4xl md:text-5xl filter grayscale group-hover:grayscale-0 transition-all duration-300 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] group-hover:drop-shadow-[0_0_20px_rgba(0,243,255,0.6)]">
                    {link.icon}
                  </span>
                </div>

                {/* ����ʱ�ĵײ����� */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-cyber-cyan/50 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>

              {/* ���� */}
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
