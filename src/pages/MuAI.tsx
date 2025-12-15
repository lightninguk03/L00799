/**
 * Mu AI 独立页面
 * 全息玻璃终端风格对话界面
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Loader2, Bot, User, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { useSiteConfig } from '../contexts/SiteConfigContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const MuAI = () => {
  const { i18n } = useTranslation();
  const { config } = useSiteConfig();
  const isZh = i18n.language.startsWith('zh');

  // 从配置获取 AI 信息
  const aiName = isZh
    ? (config.ai?.name_cn || config.aiNameCn || 'Mu AI')
    : (config.ai?.name || config.aiName || 'Mu AI');
  const aiNameCn = config.ai?.name_cn || config.aiNameCn || '穆爱';
  const aiTitle = isZh
    ? (config.ai?.title_cn || config.aiTitleCn || '中枢脑')
    : (config.ai?.title || config.aiTitle || 'Central Brain');
  const siteName = isZh ? (config.siteNameCn || 'LETAVERSE') : (config.siteName || 'LETAVERSE');
  const aiGreeting = isZh
    ? (config.ai?.greeting_cn || config.aiGreetingCn || `你好，我是 ${aiName} ${aiNameCn}，${siteName} 的${aiTitle}。有什么我可以帮助你的吗？`)
    : (config.ai?.greeting || config.aiGreeting || `Hello, I am ${aiName}, the ${aiTitle} of ${siteName}. How can I assist you today?`);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendHovered, setIsSendHovered] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 初始欢迎消息
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

  // 自动滚动到底部
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
      const response = await api.post('/ai/chat', {
        message: userMessage.content,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response || response.data.message || response.data.assistant_message?.content || (isZh ? '抱歉，我暂时无法回应。' : 'Sorry, I cannot respond at the moment.'),
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: isZh
          ? '连接出现问题，请稍后再试。'
          : 'Connection issue, please try again later.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
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

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-10rem)] max-w-4xl mx-auto relative">
      {/* 背景粒子效果 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 12}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      {/* 全息玻璃终端容器 */}
      <div className="flex-1 flex flex-col relative">
        {/* 外部辉光层 */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyber-cyan/20 via-transparent to-neon-purple/20 blur-xl opacity-60" />
        
        {/* 主容器 - 毛玻璃效果 */}
        <div 
          className="flex-1 flex flex-col relative rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.05) 0%, rgba(10, 10, 20, 0.8) 50%, rgba(138, 43, 226, 0.05) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 0 40px rgba(0, 243, 255, 0.15), 0 0 80px rgba(138, 43, 226, 0.1), inset 0 1px 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* 霓虹渐变边框 */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{
            background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.6), rgba(138, 43, 226, 0.6), rgba(255, 0, 255, 0.4), rgba(0, 243, 255, 0.6))',
            backgroundSize: '300% 300%',
            animation: 'gradientBorder 4s ease infinite',
            padding: '2px',
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            maskComposite: 'exclude',
          }} />

          {/* 电路板纹理叠加层 */}
          <div className="absolute inset-0 circuit-bg opacity-5 pointer-events-none" />

          {/* 四角科技装饰 */}
          <div className="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 border-cyber-cyan/60 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 border-cyber-cyan/60 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 border-neon-purple/60 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 border-neon-purple/60 rounded-br-lg" />
          
          {/* 角落光标装饰 */}
          <div className="absolute top-4 left-4 text-cyber-cyan/40 text-[10px] font-mono">[</div>
          <div className="absolute top-4 right-4 text-cyber-cyan/40 text-[10px] font-mono">]</div>
          <div className="absolute bottom-4 left-4 text-neon-purple/40 text-[10px] font-mono">[</div>
          <div className="absolute bottom-4 right-4 text-neon-purple/40 text-[10px] font-mono">]</div>

          {/* 头部区域 */}
          <div className="relative p-4 overflow-hidden">
            {/* 背景数据流 */}
            <div className="absolute inset-0 data-flow opacity-20" />
            
            <div className="flex items-center gap-4 relative z-10">
              {/* AI 头像 - 全息效果 */}
              <div className="relative">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-cyan via-neon-purple to-pink-500 p-[2px]">
                  <div className="w-full h-full rounded-full bg-black/80 flex items-center justify-center">
                    <Bot className="w-6 h-6 text-cyber-cyan" />
                  </div>
                </div>
                {/* 呼吸灯状态点 */}
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-black flex items-center justify-center">
                  <div 
                    className="w-2.5 h-2.5 rounded-full bg-cyber-cyan"
                    style={{
                      animation: 'breathingLight 2s ease-in-out infinite',
                      boxShadow: '0 0 10px rgba(0, 243, 255, 0.8), 0 0 20px rgba(0, 243, 255, 0.4)'
                    }}
                  />
                </div>
              </div>

              <div className="flex-1">
                <h1 className="text-xl font-orbitron font-bold text-white flex items-center gap-2">
                  <span className="rgb-split-hover">{aiName}</span>
                  <Zap className="w-4 h-4 text-cyber-cyan animate-pulse" />
                </h1>
                <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
                  <span>{isZh ? `${aiNameCn} · ${aiTitle}` : aiTitle}</span>
                  <span className="text-cyber-cyan">|</span>
                  <span className="text-cyber-cyan neon-flicker">{isZh ? '神经链接已建立' : 'NEURAL_LINK_ACTIVE'}</span>
                </p>
              </div>

              {/* 右侧状态面板 */}
              <div className="hidden md:flex flex-col items-end gap-1 text-[10px] font-mono">
                <div className="text-cyber-cyan/60">SYNC: <span className="text-cyber-cyan">100%</span></div>
                <div className="text-neon-purple/60">LATENCY: <span className="text-neon-purple">12ms</span></div>
              </div>
            </div>

            {/* 流动数据光带分割线 */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden">
              <div 
                className="h-full w-[200%]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(0, 243, 255, 0.8), rgba(138, 43, 226, 0.8), rgba(255, 0, 255, 0.6), transparent)',
                  animation: 'dataStreamFlow 3s linear infinite',
                }}
              />
            </div>
          </div>

          {/* 消息列表区域 */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-cyber-cyan/20 scrollbar-track-transparent">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  {/* 头像 */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                    message.role === 'assistant'
                      ? 'bg-gradient-to-br from-cyber-cyan/30 to-cyber-cyan/10 border border-cyber-cyan/40'
                      : 'bg-gradient-to-br from-neon-purple/30 to-pink-500/10 border border-neon-purple/40'
                  }`} style={{ clipPath: 'polygon(0 15%, 15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}>
                    {message.role === 'assistant' ? (
                      <Bot className="w-4 h-4 text-cyber-cyan" />
                    ) : (
                      <User className="w-4 h-4 text-neon-purple" />
                    )}
                  </div>

                  {/* 消息气泡 - 切角玻璃风格 */}
                  <div className={`max-w-[75%] ${message.role === 'user' ? 'text-right' : ''}`}>
                    <div 
                      className={`inline-block px-4 py-3 relative ${
                        message.role === 'assistant' ? 'text-left' : 'text-left'
                      }`}
                      style={{
                        background: message.role === 'assistant'
                          ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(0, 243, 255, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(138, 43, 226, 0.2) 0%, rgba(255, 0, 255, 0.1) 100%)',
                        backdropFilter: 'blur(10px)',
                        clipPath: message.role === 'assistant'
                          ? 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                          : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                        boxShadow: message.role === 'assistant'
                          ? 'inset 2px 0 10px rgba(0, 243, 255, 0.2), 0 0 20px rgba(0, 243, 255, 0.1)'
                          : 'inset -2px 0 10px rgba(138, 43, 226, 0.2), 0 0 20px rgba(138, 43, 226, 0.1)',
                      }}
                    >
                      {/* 边框光效 */}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          clipPath: message.role === 'assistant'
                            ? 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)'
                            : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))',
                          background: message.role === 'assistant'
                            ? 'linear-gradient(135deg, rgba(0, 243, 255, 0.4), transparent, rgba(0, 243, 255, 0.2))'
                            : 'linear-gradient(135deg, rgba(138, 43, 226, 0.4), transparent, rgba(255, 0, 255, 0.3))',
                          padding: '1px',
                          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                          WebkitMaskComposite: 'xor',
                          maskComposite: 'exclude',
                        }}
                      />
                      <p className="text-sm whitespace-pre-wrap text-gray-100 relative z-10">{message.content}</p>
                    </div>
                    <p className={`text-[10px] text-gray-500 mt-1 px-2 font-mono ${message.role === 'user' ? 'text-right' : ''}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* 加载指示器 */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <div 
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyber-cyan/30 to-cyber-cyan/10 border border-cyber-cyan/40 flex items-center justify-center"
                  style={{ clipPath: 'polygon(0 15%, 15% 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
                >
                  <Bot className="w-4 h-4 text-cyber-cyan animate-pulse" />
                </div>
                <div 
                  className="px-4 py-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.15) 0%, rgba(0, 243, 255, 0.05) 100%)',
                    backdropFilter: 'blur(10px)',
                    clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full"
                          style={{
                            background: i % 2 === 0 ? '#00F3FF' : '#8A2BE2',
                            animation: `bounce 0.6s ease-in-out ${i * 0.1}s infinite`,
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-cyber-cyan/80 font-mono">
                      {isZh ? '神经处理中...' : 'PROCESSING...'}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 底部输入区域 - 凹陷玻璃风格 */}
          <div className="relative p-4">
            {/* 顶部流动光带 */}
            <div className="absolute top-0 left-0 right-0 h-[1px] overflow-hidden">
              <div 
                className="h-full w-[200%]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(138, 43, 226, 0.6), rgba(0, 243, 255, 0.6), transparent)',
                  animation: 'dataStreamFlow 4s linear infinite reverse',
                }}
              />
            </div>

            <div 
              className="flex gap-3 items-end p-3 rounded-xl relative"
              style={{
                background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%)',
                boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 243, 255, 0.05)',
              }}
            >
              {/* 输入框边框发光 */}
              <div 
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.3), rgba(138, 43, 226, 0.3))',
                  padding: '1px',
                  WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                  WebkitMaskComposite: 'xor',
                  maskComposite: 'exclude',
                }}
              />

              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isZh ? '输入指令...' : 'Enter command...'}
                  rows={1}
                  className="w-full bg-transparent border-none text-white placeholder-gray-500 resize-none focus:outline-none font-mono text-sm"
                  style={{ minHeight: '24px', maxHeight: '100px' }}
                />
              </div>

              {/* 发送按钮 - 能量发射风格 */}
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                onMouseEnter={() => setIsSendHovered(true)}
                onMouseLeave={() => setIsSendHovered(false)}
                className="flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center text-white disabled:opacity-30 disabled:cursor-not-allowed relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.3) 0%, rgba(138, 43, 226, 0.3) 100%)',
                  boxShadow: isSendHovered && input.trim() 
                    ? '0 0 30px rgba(0, 243, 255, 0.6), 0 0 60px rgba(138, 43, 226, 0.4)' 
                    : '0 0 15px rgba(0, 243, 255, 0.2)',
                  clipPath: 'polygon(0 20%, 20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%)',
                }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 发光边框 */}
                <div 
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    clipPath: 'polygon(0 20%, 20% 0, 100% 0, 100% 80%, 80% 100%, 0 100%)',
                    background: 'linear-gradient(135deg, rgba(0, 243, 255, 0.8), rgba(138, 43, 226, 0.8))',
                    padding: '1px',
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                  }}
                />
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-cyber-cyan" />
                ) : (
                  <Send 
                    className="w-5 h-5 relative z-10 transition-all duration-300" 
                    style={{ 
                      transform: 'rotate(-45deg)',
                      filter: isSendHovered && input.trim() ? 'drop-shadow(0 0 10px rgba(255,255,255,0.8))' : 'none',
                      color: isSendHovered && input.trim() ? '#fff' : '#00F3FF'
                    }} 
                  />
                )}
                {/* 尾焰效果 */}
                {isSendHovered && input.trim() && (
                  <div 
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle at 30% 70%, rgba(0, 243, 255, 0.4), transparent 60%)',
                      animation: 'pulse 0.5s ease-in-out infinite',
                    }}
                  />
                )}
              </motion.button>
            </div>

            {/* 底部状态栏 */}
            <div className="flex justify-between items-center mt-2 px-2 text-[10px] font-mono text-gray-500">
              <span>{isZh ? `${aiName} · ${siteName}` : `${aiName} · ${siteName}`}</span>
              <span className="text-cyber-cyan/50">SECURE_CHANNEL_ACTIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* 添加自定义动画样式 */}
      <style>{`
        @keyframes breathingLight {
          0%, 100% {
            opacity: 0.6;
            transform: scale(0.9);
            box-shadow: 0 0 5px rgba(0, 243, 255, 0.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
            box-shadow: 0 0 15px rgba(0, 243, 255, 0.9), 0 0 30px rgba(0, 243, 255, 0.5);
          }
        }
        
        @keyframes dataStreamFlow {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
        
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
      `}</style>
    </div>
  );
};

export default MuAI;
