import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Send, Lock } from 'lucide-react';
import api from '../../api';
import type { ChatResponse } from '../../api';
import { cn, getApiErrorMessage, getMediaUrl } from '../../lib/utils';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import { useScrollPosition } from '../../hooks/useScrollPosition';
import { useAuth } from '../../hooks/useAuth';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import muAiKanbanDefault from '../../assets/mu_ai_kanban.png';

interface Message {
    id: number;
    role: 'user' | 'assistant';
    content: string;
}

interface ChatWidgetProps {
    forceOpen?: boolean;
    embedded?: boolean;
}

const ChatWidget = ({ forceOpen = false, embedded = false }: ChatWidgetProps) => {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();
    const { isScrolled } = useScrollPosition(100);
    const { isAuthenticated, requireAuth } = useAuth();
    const { config } = useSiteConfig();
    // 如果 forceOpen 为 true，则初始状态为 true
    const [isOpen, setIsOpen] = useState(forceOpen);
    const [isHovered, setIsHovered] = useState(false);

    // 从配置获取 AI 信息 - 优先使用后端配置的 ai 对象
    const isZh = i18n.language.startsWith('zh');
    const aiName = isZh
        ? (config.ai?.name_cn || config.aiNameCn || 'Mu AI')
        : (config.ai?.name || config.aiName || 'Mu AI');
    const aiTitle = isZh
        ? (config.ai?.title_cn || config.aiTitleCn || '中枢脑')
        : (config.ai?.title || config.aiTitle || 'Central Brain');
    const aiGreeting = isZh
        ? (config.ai?.greeting_cn || config.aiGreetingCn || '欢迎来到闪电社区，我是穆爱，你的虚拟向导。')
        : (config.ai?.greeting || config.aiGreeting || 'Welcome to Lightning Community. I am Mu AI, your virtual guide.');
    const aiKanban = getMediaUrl(config.kanbanGirl) || muAiKanbanDefault;

    const [messages, setMessages] = useState<Message[]>([
        { id: 0, role: 'assistant', content: aiGreeting }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 页面判断
    const isHomePage = location.pathname === '/';
    const isCommunityPage = location.pathname === '/community';
    const isMuAIPage = location.pathname === '/mu-ai';

    // 在 Mu AI 页面完全隐藏 ChatWidget (除非是 embedded 模式)
    if (isMuAIPage && !embedded) return null;

    // 如果未登录，完全隐藏 ChatWidget (不显示按钮)
    if (!isAuthenticated && !embedded) return null;

    // 智能避让逻辑：
    // - 社区页强制最小化（避免遮挡发帖按钮）
    // - 滚动超过 100px 时最小化
    // - 首页且未滚动时显示完整立绘
    const shouldMinimize = isCommunityPage || isScrolled || isOpen;

    // Update greeting when language changes or config changes
    useEffect(() => {
        setMessages(prev => {
            if (prev.length > 0 && prev[0].id === 0) {
                if (prev[0].content !== aiGreeting) {
                    return [{ ...prev[0], content: aiGreeting }, ...prev.slice(1)];
                }
            }
            return prev;
        });
    }, [i18n.language, aiGreeting]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    // 如果是 forceOpen 模式，确保它是打开的
    useEffect(() => {
        if (forceOpen) setIsOpen(true);
    }, [forceOpen]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        // 检查登录状态
        if (!requireAuth(undefined, '请先登录后再与 Mu AI 对话')) {
            return;
        }

        const userMsg: Message = { id: Date.now(), role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await api.post<ChatResponse>('/ai/chat', { message: userMsg.content });
            const aiMsg: Message = {
                id: Date.now() + 1,
                role: 'assistant',
                content: res.data.assistant_message?.content || "Data corrupted."
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (err: unknown) {
            const errMsg = getApiErrorMessage(err, t);
            setMessages(prev => [...prev, { id: Date.now() + 1, role: 'assistant', content: errMsg }]);
        } finally {
            setLoading(false);
        }
    };

    // 决定显示模式：完整立绘 vs 小图标
    const showFullTachie = isHomePage && !shouldMinimize && !embedded;

    // 点击 AI 图标时的处理
    const handleOpenChat = () => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        setIsOpen(true);
    };

    // 如果是嵌入模式，直接渲染对话框内容
    if (embedded) {
        return (
            <div className="w-full h-full max-w-4xl mx-auto flex flex-col bg-[#0a0a14]/80 backdrop-blur-md border border-neon-purple/30 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(138,43,226,0.1)]">
                {/* Header */}
                <div className="p-4 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-transparent flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-black border border-cyber-cyan flex items-center justify-center overflow-hidden">
                            <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                        </div>
                        <div className="text-left">
                            <h3 className="font-orbitron font-bold text-white text-lg tracking-wide">{aiName}</h3>
                            <span className="text-xs text-cyber-cyan font-mono flex items-center uppercase tracking-wider">
                                {aiTitle} · {t('mu_ai.status')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-neon-purple/30 scrollbar-track-transparent min-h-[400px]" ref={scrollRef}>
                    {messages.map((msg) => (
                        <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-black border border-cyber-cyan mr-3 flex-shrink-0 overflow-hidden mt-1">
                                    <img src={aiKanban} alt="AI" className="w-full h-full object-cover object-top" />
                                </div>
                            )}
                            <div className={cn(
                                "max-w-[80%] rounded-2xl p-4 text-base font-sans leading-relaxed shadow-lg",
                                msg.role === 'user'
                                    ? "bg-gradient-to-r from-neon-purple to-purple-600 text-white rounded-tr-sm"
                                    : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="w-8 h-8 rounded-full bg-black border border-cyber-cyan mr-3 flex-shrink-0 overflow-hidden mt-1">
                                <img src={aiKanban} alt="AI" className="w-full h-full object-cover object-top" />
                            </div>
                            <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm">
                                <div className="flex space-x-1.5">
                                    <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
                    {isAuthenticated ? (
                        <form onSubmit={handleSend} className="flex items-center space-x-4 max-w-3xl mx-auto w-full">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder={t('ai_chat.placeholder')}
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan/50 transition-all placeholder-gray-500 font-mono text-base"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="p-4 rounded-xl bg-gradient-to-r from-neon-purple to-cyber-cyan text-white hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-neon-purple/20 to-cyber-cyan/20 border border-cyber-cyan/30 rounded-xl text-cyber-cyan hover:border-cyber-cyan/60 transition-all max-w-xl mx-auto"
                        >
                            <Lock className="w-5 h-5" />
                            <span className="font-mono">{isZh ? `登录后与 ${aiName} 对话` : `Login to chat with ${aiName}`}</span>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {/* 桌面端：完整立绘或最小化图标 */}
            <AnimatePresence mode="wait">
                {showFullTachie ? (
                    // 完整立绘模式 - 调整位置避免遮挡下方内容
                    <motion.div
                        key="full-tachie"
                        className="fixed bottom-[15vh] right-4 md:right-10 z-40 cursor-pointer hidden md:block group"
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 50, opacity: 0, scale: 0.5 }}
                        whileHover={{ scale: 1.02 }}
                        onClick={handleOpenChat}
                    >
                        {/* 对话气泡提示 */}
                        <div className="absolute -top-12 -left-20 bg-black/90 text-cyber-cyan border border-cyber-cyan/50 p-3 rounded-xl rounded-br-none text-xs font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap backdrop-blur-sm">
                            {t('ai_chat.greeting_short') || "需要协助吗？中枢脑在线"}
                        </div>
                        <img
                            src={aiKanban}
                            alt={aiName}
                            className="h-[220px] w-auto object-contain drop-shadow-[0_0_20px_rgba(0,255,255,0.3)] filter brightness-110"
                        />
                    </motion.div>
                ) : (
                    // 最小化图标模式（社区页、滚动后、或对话框打开时）
                    <motion.button
                        key="mini-icon"
                        className="fixed bottom-6 right-4 md:right-8 w-14 h-14 hidden md:flex rounded-full bg-black/80 backdrop-blur-sm border-2 border-cyber-cyan/70 p-0 overflow-hidden z-40 items-center justify-center group"
                        style={{
                            boxShadow: isHovered
                                ? '0 0 30px rgba(0,255,255,0.6), 0 0 60px rgba(0,255,255,0.3)'
                                : '0 0 20px rgba(0,255,255,0.4)'
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        onClick={handleOpenChat}
                    >
                        <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                        {/* 光环效果 */}
                        <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan/50 animate-pulse" />
                        {/* 在线状态指示器 */}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyber-cyan rounded-full border-2 border-black animate-pulse" />

                        {/* 悬停提示气泡 */}
                        <AnimatePresence>
                            {isHovered && (
                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    className="absolute right-full mr-3 bg-black/95 text-cyber-cyan border border-cyber-cyan/50 px-3 py-2 rounded-lg text-xs font-mono whitespace-nowrap backdrop-blur-sm"
                                >
                                    需要协助吗？中枢脑在线
                                    <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-2 h-2 bg-black/95 border-r border-t border-cyber-cyan/50 rotate-45" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 移动端：始终显示小图标 */}
            <motion.button
                className="fixed bottom-32 right-4 w-14 h-14 md:hidden rounded-full bg-black/80 backdrop-blur-sm border-2 border-cyber-cyan/70 p-0 overflow-hidden shadow-[0_0_20px_rgba(0,255,255,0.4)] z-40"
                whileTap={{ scale: 0.9 }}
                onClick={handleOpenChat}
            >
                <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                <div className="absolute inset-0 rounded-full border-2 border-cyber-cyan/50 animate-pulse" />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-cyber-cyan rounded-full border-2 border-black animate-pulse" />
            </motion.button>

            {/* 对话模态框 (Only if not embedded) */}
            <AnimatePresence>
                {isOpen && !embedded && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        transition={{ type: "spring", bounce: 0.3 }}
                        className="fixed bottom-4 md:bottom-8 right-4 md:right-8 w-[90vw] md:w-[380px] h-[500px] bg-[#0a0a14]/95 backdrop-blur-2xl border border-neon-purple/50 rounded-2xl shadow-[0_0_50px_rgba(138,43,226,0.2)] z-50 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-transparent flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-black border border-cyber-cyan flex items-center justify-center overflow-hidden">
                                    <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                                </div>
                                <div>
                                    <h3 className="font-orbitron font-bold text-white text-sm tracking-wide">{aiName}</h3>
                                    <span className="text-[9px] text-cyber-cyan font-mono flex items-center uppercase tracking-wider">
                                        {aiTitle} · {t('mu_ai.status')}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-neon-purple/30 scrollbar-track-transparent" ref={scrollRef}>
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[85%] rounded-2xl p-3 text-sm font-sans leading-relaxed",
                                        msg.role === 'user'
                                            ? "bg-gradient-to-r from-neon-purple to-purple-600 text-white rounded-tr-sm"
                                            : "bg-white/5 border border-white/10 text-gray-200 rounded-tl-sm"
                                    )}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl rounded-tl-sm">
                                        <div className="flex space-x-1.5">
                                            <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                            <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                            <div className="w-2 h-2 bg-cyber-cyan rounded-full animate-bounce"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input - 深色风格 */}
                        {isAuthenticated ? (
                            <form onSubmit={handleSend} className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm flex items-center space-x-2">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    placeholder={t('ai_chat.placeholder')}
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan/50 transition-all placeholder-gray-500 font-mono"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !input.trim()}
                                    className="p-3 rounded-xl bg-gradient-to-r from-neon-purple to-cyber-cyan text-white hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        ) : (
                            <div className="p-4 border-t border-white/10 bg-black/40 backdrop-blur-sm">
                                <button
                                    onClick={() => navigate('/login')}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-neon-purple/20 to-cyber-cyan/20 border border-cyber-cyan/30 rounded-xl text-cyber-cyan hover:border-cyber-cyan/60 transition-all"
                                >
                                    <Lock className="w-4 h-4" />
                                    <span className="font-mono text-sm">{isZh ? `登录后与 ${aiName} 对话` : `Login to chat with ${aiName}`}</span>
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
