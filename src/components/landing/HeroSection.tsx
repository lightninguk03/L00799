
import { motion } from 'framer-motion';
import GlitchText from '../ui/GlitchText';
import NeonButton from '../ui/NeonButton';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { getMediaUrl } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';
import muAiKanbanDefault from '../../assets/mu_ai_kanban.png';

const HeroSection = () => {
    const navigate = useNavigate();
    const { config } = useSiteConfig();
    const { isAuthenticated } = useAuth();
    const muAiImage = getMediaUrl(config.kanbanGirl) || muAiKanbanDefault;

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
            <div className="relative z-10 text-center md:text-left md:w-1/2 space-y-8 p-4">
                {/* Badge/Icon */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1 }}
                    className="mx-auto md:mx-0 w-16 h-16 mb-6 relative group neon-pulse"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-lightning-cyan to-soul-purple opacity-20 blur-xl" />
                    <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white drop-shadow-[0_0_15px_rgba(0,243,255,0.8)] heartbeat">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
                    </svg>
                </motion.div>

                {/* Title & Concept */}
                <div className="space-y-6">
                    <GlitchText text="LETAVERSE" size="2xl" className="tracking-tighter block" />

                    <div className="space-y-2">
                        <motion.h2
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-2xl md:text-3xl font-bold leading-tight font-noto"
                        >
                            灵魂无限，<br className="md:hidden" />
                            <span className="text-soul-purple text-glow">却受制于肉体的局限。</span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-white/60 font-sm max-w-lg mx-auto md:mx-0 leading-relaxed font-noto"
                        >
                            "现实与幻象的边界是否真的存在？<br />当意识在失落中漂流，虚拟世界将成为新的家园。"
                            <br />
                            <span className="text-xs italic opacity-50 font-rajdhani mt-2 block">
                                "The soul is infinite, yet bound by flesh. Is there truly a boundary between reality and illusion?"
                            </span>
                        </motion.p>
                    </div>
                </div>

                {/* Action - 根据登录状态显示不同内容 */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="pt-8 flex flex-col md:flex-row gap-4 items-center md:items-start"
                >
                    {isAuthenticated ? (
                        // 已登录用户 - 显示欢迎状态
                        <>
                            <div className="flex items-center gap-3 px-6 py-3 bg-cyber-cyan/10 border border-cyber-cyan/30 rounded-lg border-glow">
                                <Sparkles className="w-5 h-5 text-cyber-cyan heartbeat" />
                                <span className="text-cyber-cyan font-noto neon-flicker">已连接 <span className="text-sm font-rajdhani opacity-80 pl-1">CONNECTED</span></span>
                            </div>
                            <div className="text-xs text-white/30 font-mono text-left space-y-1 pt-2">
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
                                className="group flex items-center gap-3 px-10 py-4 text-lg glitch-hover"
                            >
                                <span className="relative z-10 font-noto">启动连接 <span className="text-sm font-rajdhani opacity-80 pl-1">LINK START</span></span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </NeonButton>

                            <div className="text-xs text-white/30 font-mono text-left space-y-1 pt-2">
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
