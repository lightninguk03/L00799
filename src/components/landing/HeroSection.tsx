
import { motion, AnimatePresence } from 'framer-motion';
import GlitchText from '../ui/GlitchText';
import NeonButton from '../ui/NeonButton';
import { ArrowRight, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { getFullUrl, getMediaUrl } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import { useState, useEffect, useCallback } from 'react';
import muAiKanbanDefault from '../../assets/mu_ai_kanban.png';

const HeroSection = () => {
    const navigate = useNavigate();
    const { config } = useSiteConfig();
    const { isAuthenticated } = useAuth();
    
    // AI 看板娘图片
    const muAiImage = getMediaUrl(config.kanbanGirl) || muAiKanbanDefault;
    
    // 从后端配置获取 banner 图片数组
    const rawBanners = config._backendConfig?.hero_banners;
    const heroBanners: string[] = Array.isArray(rawBanners) 
        ? rawBanners.map((url: string) => getFullUrl(url)).filter((url): url is string => url !== null)
        : [];
    
    // 如果没有轮播图，检查是否有单张 hero_background
    const heroBackground = getMediaUrl(config.heroBackground);
    const hasBanners = heroBanners.length > 0 || !!heroBackground;
    
    // 合并：如果有 hero_banners 用轮播，否则用 hero_background 作为单张
    const finalBanners = heroBanners.length > 0 ? heroBanners : (heroBackground ? [heroBackground] : []);
    const isCarousel = finalBanners.length > 1;
    
    // 轮播状态
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);
    
    // 自动轮播
    useEffect(() => {
        if (!isCarousel || !isAutoPlaying) return;
        const timer = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % finalBanners.length);
        }, 5000); // 5秒切换
        return () => clearInterval(timer);
    }, [isCarousel, isAutoPlaying, finalBanners.length]);
    
    const goToSlide = useCallback((index: number) => {
        setCurrentIndex(index);
        setIsAutoPlaying(false);
        // 10秒后恢复自动播放
        setTimeout(() => setIsAutoPlaying(true), 10000);
    }, []);
    
    const prevSlide = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 + finalBanners.length) % finalBanners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    }, [finalBanners.length]);
    
    const nextSlide = useCallback(() => {
        setCurrentIndex(prev => (prev + 1) % finalBanners.length);
        setIsAutoPlaying(false);
        setTimeout(() => setIsAutoPlaying(true), 10000);
    }, [finalBanners.length]);

    // 如果有 banner 图片，显示全屏 banner 模式
    if (hasBanners) {
        return (
            <section className="relative w-full h-[90vh] overflow-hidden">
                {/* Banner 图片容器 */}
                <div className="absolute inset-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.8 }}
                            className="absolute inset-0"
                        >
                            <img
                                src={finalBanners[currentIndex]}
                                alt={`Banner ${currentIndex + 1}`}
                                className="w-full h-full object-cover"
                            />
                            {/* 底部渐变遮罩 */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                        </motion.div>
                    </AnimatePresence>
                </div>
                
                {/* 轮播控制 - 仅多图时显示 */}
                {isCarousel && (
                    <>
                        {/* 左右箭头 */}
                        <button
                            onClick={prevSlide}
                            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-cyber-cyan/50 transition-all"
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <button
                            onClick={nextSlide}
                            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-sm border border-white/20 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-black/60 hover:border-cyber-cyan/50 transition-all"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                        
                        {/* 指示器 */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                            {finalBanners.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => goToSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${
                                        index === currentIndex
                                            ? 'w-8 bg-cyber-cyan shadow-[0_0_10px_#00f3ff]'
                                            : 'bg-white/40 hover:bg-white/60'
                                    }`}
                                />
                            ))}
                        </div>
                    </>
                )}
                
                {/* Scroll Indicator */}
                <motion.div
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2 z-10"
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to Connect</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-lightning-cyan/50 to-transparent" />
                </motion.div>
            </section>
        );
    }

    // 默认模式 - 无 banner 时显示原有的 Hero 内容
    return (
        <section className="relative w-full h-[90vh] flex flex-col md:flex-row items-center justify-center overflow-hidden perspective-1000 px-4">

            {/* Background Core Effect - 增强动态效果 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[-1]">
                <div className="w-[500px] h-[500px] rounded-full bg-lightning-cyan/5 blur-[100px] animate-pulse-fast" />
                <div className="absolute w-[80%] h-[80%] border border-lightning-cyan/10 rounded-full animate-slow-spin opacity-30" />
                {/* 额外的动态光环 */}
                <div className="absolute w-[60%] h-[60%] border border-neon-purple/10 rounded-full animate-[spin_25s_linear_infinite_reverse] opacity-20" />
                <div className="absolute w-[40%] h-[40%] border border-cyber-cyan/15 rounded-full animate-[spin_15s_linear_infinite] opacity-25" />
            </div>
            
            {/* 背景粒子 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="particle" style={{ left: '20%', top: '30%', animationDelay: '0s' }} />
                <div className="particle" style={{ left: '70%', top: '20%', animationDelay: '2s' }} />
                <div className="particle" style={{ left: '40%', top: '60%', animationDelay: '4s' }} />
                <div className="particle" style={{ left: '80%', top: '70%', animationDelay: '1s' }} />
            </div>

            {/* Left/Center: Product Concept & Text */}
            <div className="relative z-10 text-center md:text-left md:w-1/2 space-y-4 md:space-y-8 p-4">
                {/* Badge/Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mx-auto md:mx-0 w-12 h-12 md:w-16 md:h-16 mb-4 md:mb-6 relative group neon-pulse"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-lightning-cyan to-soul-purple opacity-20 blur-xl" />
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] heartbeat">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
                    </svg>
                </motion.div>

                {/* Title & Concept */}
                <div className="space-y-4 md:space-y-6">
                    {/* 移动端使用较小的标题尺寸 */}
                    <div className="block md:hidden">
                        <GlitchText text="LETAVERSE" size="lg" className="tracking-tighter block" />
                    </div>
                    <div className="hidden md:block">
                        <GlitchText text="LETAVERSE" size="2xl" className="tracking-tighter block" />
                    </div>

                    <div className="space-y-2">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-xl md:text-3xl font-bold leading-tight font-noto"
                        >
                            {config.sloganCn?.split('，')[0] || '灵魂无限'}，<br className="md:hidden" />
                            <span className="text-soul-purple text-glow">{config.sloganCn?.split('，')[1] || '却受制于肉体的局限。'}</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-white/60 text-sm md:text-base max-w-lg mx-auto md:mx-0 leading-relaxed font-noto"
                        >
                            "现实与幻象的边界是否真的存在？<br />当意识在失落中漂流，虚拟世界将成为新的家园。"
                            <br />
                            <span className="text-xs italic opacity-50 font-rajdhani mt-2 block hidden md:block">
                                "{config.slogan || 'The soul is infinite, yet bound by flesh. Is there truly a boundary between reality and illusion?'}"
                            </span>
                        </motion.p>
                    </div>
                </div>

                {/* Action - 根据登录状态显示不同内容 */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="pt-4 md:pt-8 flex flex-col gap-4 items-center md:items-start"
                >
                    {isAuthenticated ? (
                        // 已登录用户 - 显示欢迎状态
                        <>
                            <div className="flex items-center gap-3 px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg border-glow">
                                <Sparkles className="w-5 h-5 text-cyber-cyan heartbeat" />
                                <span className="text-cyber-cyan font-noto neon-flicker">已连接 <span className="text-sm font-rajdhani opacity-80 pl-1">CONNECTED</span></span>
                            </div>
                            <div className="text-xs text-white/30 font-mono text-center md:text-left space-y-1 pt-2">
                                <p>SYSTEM: <span className="text-green-400 neon-flicker">ONLINE</span></p>
                                <p>SYNC RATE: <span className="text-lightning-cyan">100%</span></p>
                            </div>
                        </>
                    ) : (
                        // 未登录用户 - 显示进入按钮
                        <>
                            <NeonButton
                                size="lg"
                                onClick={() => navigate('/community')}
                                className="group flex items-center gap-3 px-8 md:px-10 py-3 md:py-4 text-base md:text-lg glitch-hover"
                            >
                                <span className="relative z-10 font-noto">启动连接 <span className="text-sm font-rajdhani opacity-80 pl-1">LINK START</span></span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </NeonButton>

                            <div className="text-xs text-white/30 font-mono text-center md:text-left space-y-1 pt-2">
                                <p>SYSTEM: <span className="text-green-400 neon-flicker">ONLINE</span></p>
                                <p>SYNC RATE: <span className="text-lightning-cyan">98.4%</span></p>
                            </div>
                        </>
                    )}
                </motion.div>
            </div>

            {/* Right: AI Visual (Optional/Ambient) */}
            <div className="hidden md:block w-1/2 h-full relative pointer-events-none z-0">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, delay: 0.5 }}
                    className="absolute inset-0 flex items-center justify-center mask-image-gradient-b"
                >
                    {/* AI Image Placeholder / Character - 全息效果 */}
                    {/* Use a mix-blend-mode to make it look holographic */}
                    <div className="relative hologram">
                        <img
                            src={muAiImage}
                            alt="Mu AI"
                            className="h-[80%] object-contain drop-shadow-[0_0_50px_rgba(188,19,254,0.3)] opacity-80 mix-blend-lighten grayscale-[30%] hover:grayscale-0 transition-all duration-1000"
                        />
                        {/* 全息扫描线 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-cyan/5 to-transparent animate-[cardScan_3s_linear_infinite] pointer-events-none" />
                    </div>
                </motion.div>
            </div>

            {/* Scroll Indicator */}
            <motion.div
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30 flex flex-col items-center gap-2"
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <span className="text-[10px] uppercase tracking-[0.2em]">Scroll to Connect</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-lightning-cyan/50 to-transparent" />
            </motion.div>
        </section>
    );
};

export default HeroSection;
