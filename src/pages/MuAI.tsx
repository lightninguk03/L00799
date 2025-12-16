/**
 * Mu AI 独立页面
 * 赛博朋克终端风格
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, User, Zap, Terminal, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api, { type ChatResponse } from '../api';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { useAuth } from '../hooks/useAuth';
import { cn, getMediaUrl } from '../lib/utils';
import muAiKanbanDefault from '../assets/mu_ai_kanban.png';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MuAI = () => {
  const { i18n } = useTranslation();
  const { config } = useSiteConfig();
  const { user } = useAuth();
  const isZh = i18n.language.startsWith('zh');
  
  // 用户头像
  const userAvatar = user?.avatar ? getMediaUrl(user.avatar) : null;

  const aiName = isZh
    ? (config.ai?.name_cn || config.aiNameCn || '穆爱')
    : (config.ai?.name || config.aiName || 'Mu AI');
  const aiTitle = isZh
    ? (config.ai?.title_cn || config.aiTitleCn || '中枢脑')
    : (config.ai?.title || config.aiTitle || 'Central Brain');
  const aiGreeting = isZh
    ? (config.ai?.greeting_cn || config.aiGreetingCn || `你好呀～我是${aiName}，闪电社区的${aiTitle}。有什么我可以帮你的吗？✨`)
    : (config.ai?.greeting || config.aiGreeting || `Hello~ I'm ${aiName}, the ${aiTitle}. How can I help you? ✨`);
  
  // 图片加载状态管理 - 优先使用本地默认图片，避免后端连接问题
  const [aiKanban, setAiKanban] = useState(muAiKanbanDefault);
  
  useEffect(() => {
    const backendKanban = getMediaUrl(config.kanbanGirl);
    if (backendKanban) {
      // 预加载后端图片，成功后才切换
      const img = new Image();
      img.onload = () => setAiKanban(backendKanban);
      img.onerror = () => setAiKanban(muAiKanbanDefault);
      img.src = backendKanban;
    }
  }, [config.kanbanGirl]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: aiGreeting,
        timestamp: new Date(),
      }]);
    }
  }, [aiGreeting, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await api.post<ChatResponse & { response?: string; message?: string }>('/ai/chat', { message: userMessage.content });
      // 兼容多种后端返回格式
      const aiContent = response.data.assistant_message?.content 
        || response.data.response 
        || response.data.message 
        || (isZh ? '神经链路中断...' : 'Neural link interrupted...');
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
      }]);
    } catch (error) {
      console.error('AI chat error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isZh ? '⚠️ 信号丢失，请重新建立连接...' : '⚠️ Signal lost, please reconnect...',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([{ id: 'welcome', role: 'assistant', content: aiGreeting, timestamp: new Date() }]);
  };

  const suggestions = isZh ? ['你是谁？', '这个社区是什么？', '有什么功能？'] : ['Who are you?', 'What is this?', 'Features?'];

  return (
    <div className="h-[calc(100vh-12rem)] max-w-5xl mx-auto flex gap-6 pt-4">
      {/* 左侧 AI 立绘 */}
      <div className="hidden lg:flex flex-col items-center w-72 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-cyber-cyan/10 via-transparent to-neon-purple/10 rounded-2xl" />
        <div className="relative flex-1 flex items-end justify-center pb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-t from-cyber-cyan/30 via-transparent to-transparent blur-2xl" />
            <img src={aiKanban} alt={aiName} className="relative h-[400px] object-contain drop-shadow-[0_0_30px_rgba(0,243,255,0.3)] opacity-90 hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div className="w-full p-4 bg-black/60 backdrop-blur-sm border border-cyber-cyan/30 rounded-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,243,255,0.03)_50%)] bg-[length:100%_4px] pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyber-cyan animate-pulse shadow-[0_0_10px_#00ffff]" />
              <span className="text-[10px] font-mono text-cyber-cyan">NEURAL_LINK_ACTIVE</span>
            </div>
            <h2 className="font-orbitron font-bold text-white text-xl mb-1">{aiName}</h2>
            <p className="text-xs text-gray-400 font-mono">{aiTitle} | v2.0.7</p>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-[10px] font-mono">
                <span className="text-gray-500">SYNC_RATE</span>
                <span className="text-cyber-cyan">99.9%</span>
              </div>
              <div className="h-1 bg-black/50 rounded-full overflow-hidden">
                <div className="h-full w-[99.9%] bg-gradient-to-r from-cyber-cyan to-neon-purple rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 聊天区域 */}
      <div className="flex-1 flex flex-col relative">
        <div className="flex-1 flex flex-col rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(180deg, rgba(0,10,20,0.95) 0%, rgba(5,5,16,0.98) 100%)', border: '1px solid rgba(0, 243, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 243, 255, 0.1), inset 0 0 60px rgba(0,0,0,0.5)' }}>
          <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-cyber-cyan/60" />
          <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-cyber-cyan/60" />
          <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-neon-purple/60" />
          <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-neon-purple/60" />

          {/* 头部 */}
          <div className="relative px-4 py-3 border-b border-white/10 bg-black/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden w-10 h-10 rounded-lg overflow-hidden border border-cyber-cyan/40 bg-black/50">
                  <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-cyber-cyan" />
                    <span className="font-orbitron font-bold text-white">{isZh ? `与 ${aiName} 对话` : `Chat with ${aiName}`}</span>
                    <Zap className="w-3 h-3 text-cyber-cyan animate-pulse" />
                  </div>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">SECURE_CHANNEL // {messages.length - 1} {isZh ? '条记录' : 'records'}</p>
                </div>
              </div>
              <button onClick={clearChat} className="p-2 text-gray-500 hover:text-cyber-cyan hover:bg-cyber-cyan/10 rounded-lg transition-all border border-transparent hover:border-cyber-cyan/30" title={isZh ? '重置对话' : 'Reset'}>
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
              <div className="h-full w-[200%]" style={{ background: 'linear-gradient(90deg, transparent, #00f3ff, #8a2be2, transparent)', animation: 'flowLight 3s linear infinite' }} />
            </div>
          </div>

          {/* 消息 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-cyan/20 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div key={message.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={cn("flex gap-3", message.role === 'user' ? 'flex-row-reverse' : '')}>
                  <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border", message.role === 'assistant' ? 'border-cyber-cyan/40 bg-black/50' : 'border-neon-purple/40 bg-neon-purple/10')}>
                    {message.role === 'assistant' ? (
                      <img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top" />
                    ) : userAvatar ? (
                      <img src={userAvatar} alt={user?.username || 'User'} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-neon-purple" /></div>
                    )}
                  </div>
                  <div className={cn("max-w-[75%]", message.role === 'user' ? 'text-right' : '')}>
                    <p className={cn("text-[10px] font-mono mb-1 px-1", message.role === 'assistant' ? 'text-cyber-cyan/60' : 'text-neon-purple/60')}>{message.role === 'assistant' ? aiName : (user?.username || (isZh ? '你' : 'You'))}</p>
                    <div className="inline-block px-4 py-3" style={{ background: message.role === 'assistant' ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(0, 243, 255, 0.02) 100%)' : 'linear-gradient(135deg, rgba(138, 43, 226, 0.15) 0%, rgba(138, 43, 226, 0.05) 100%)', border: message.role === 'assistant' ? '1px solid rgba(0, 243, 255, 0.25)' : '1px solid rgba(138, 43, 226, 0.3)', clipPath: message.role === 'assistant' ? 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' : 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))' }}>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap leading-relaxed">{message.content}</p>
                    </div>
                    <p className={cn("text-[10px] text-gray-600 mt-1 px-1 font-mono", message.role === 'user' ? 'text-right' : '')}>{message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyber-cyan/40 bg-black/50"><img src={aiKanban} alt={aiName} className="w-full h-full object-cover object-top animate-pulse" /></div>
                <div className="px-4 py-3" style={{ background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.1) 0%, rgba(0, 243, 255, 0.02) 100%)', border: '1px solid rgba(0, 243, 255, 0.25)', clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">{[0, 1, 2].map((i) => <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyber-cyan" style={{ animation: `blink 1s ease-in-out ${i * 0.2}s infinite` }} />)}</div>
                    <span className="text-xs text-cyber-cyan/70 font-mono">{isZh ? '处理中...' : 'Processing...'}</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 建议 */}
          {messages.length <= 1 && (
            <div className="px-4 pb-3 border-t border-white/5">
              <div className="flex flex-wrap gap-2 pt-3">
                {suggestions.map((s, i) => <button key={i} onClick={() => setInput(s)} className="px-3 py-1.5 text-xs font-mono bg-cyber-cyan/5 hover:bg-cyber-cyan/15 border border-cyber-cyan/20 hover:border-cyber-cyan/50 text-cyber-cyan/70 hover:text-cyber-cyan rounded transition-all">{s}</button>)}
              </div>
            </div>
          )}

          {/* 输入 */}
          <div className="p-4 border-t border-white/10 bg-black/30">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder={isZh ? '输入指令...' : 'Enter command...'} rows={1} className="w-full bg-black/50 border border-cyber-cyan/20 focus:border-cyber-cyan/50 rounded-lg px-4 py-3 text-white placeholder-gray-600 resize-none focus:outline-none focus:ring-1 focus:ring-cyber-cyan/30 transition-all text-sm font-mono" style={{ minHeight: '48px', maxHeight: '100px' }} />
                <div className="absolute right-3 bottom-3 text-[10px] text-gray-600 font-mono">Enter ↵</div>
              </div>
              <motion.button onClick={handleSend} disabled={!input.trim() || isLoading} className={cn("flex-shrink-0 w-12 h-12 flex items-center justify-center transition-all", input.trim() && !isLoading ? 'bg-cyber-cyan/20 border-cyber-cyan/50 text-cyber-cyan hover:bg-cyber-cyan/30 hover:shadow-[0_0_20px_rgba(0,243,255,0.3)]' : 'bg-white/5 border-white/10 text-gray-600')} style={{ border: '1px solid', clipPath: 'polygon(0 20%, 20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%)' }} whileHover={{ scale: input.trim() ? 1.05 : 1 }} whileTap={{ scale: input.trim() ? 0.95 : 1 }}>
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" style={{ transform: 'rotate(-45deg)' }} />}
              </motion.button>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes flowLight { 0% { transform: translateX(-50%); } 100% { transform: translateX(0%); } } @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }`}</style>
    </div>
  );
};

export default MuAI;
