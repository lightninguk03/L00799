/**
 * LETAVERSE 站点配置上下文
 * 提供全局站点配置访问
 */

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { type SiteConfig, defaultSiteConfig } from '../config/site.config';
import api from '../api';

interface SiteConfigContextType {
  config: SiteConfig;
  isLoading: boolean;
  error: string | null;
  updateConfig: (newConfig: Partial<SiteConfig>) => void;
  refreshConfig: () => Promise<void>;
}

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

interface SiteConfigProviderProps {
  children: ReactNode;
  initialConfig?: Partial<SiteConfig>;
}

export const SiteConfigProvider: React.FC<SiteConfigProviderProps> = ({
  children,
  initialConfig,
}) => {
  const [config, setConfig] = useState<SiteConfig>({
    ...defaultSiteConfig,
    ...initialConfig,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error] = useState<string | null>(null);

  // 从 API 加载站点配置
  const loadConfig = async () => {
    try {
      const response = await api.get('/system/config');
      if (response.data) {
        // 映射后端配置到前端配置格式
        const b = response.data;
        // 调试日志 - 查看后端返回的 AI 配置
        console.log('Backend config loaded:', b);
        console.log('AI config:', b.ai);
        console.log('AI name_cn:', b.ai?.name_cn);
        setConfig(prev => ({
          ...prev,
          // 品牌信息
          siteName: b.site_name || prev.siteName,
          siteNameCn: b.site_name_cn || prev.siteNameCn,
          communityName: b.community_name || prev.communityName,
          communityNameCn: b.community_name_cn || prev.communityNameCn,
          slogan: b.slogan || prev.slogan,
          sloganCn: b.slogan_cn || prev.sloganCn,
          
          // 视觉资源
          logo: b.logo || prev.logo,
          favicon: b.favicon || prev.favicon,
          backgroundImage: b.background || prev.backgroundImage,
          heroBackground: b.hero_background || prev.heroBackground,
          kanbanGirl: b.ai_kanban || prev.kanbanGirl,
          defaultAvatar: b.default_avatar || prev.defaultAvatar,
          
          // AI 助手配置 - 优先使用后端 ai 对象中的值
          ai: b.ai || prev.ai,
          aiName: b.ai?.name ?? prev.aiName,
          aiNameCn: b.ai?.name_cn ?? prev.aiNameCn,
          aiTitle: b.ai?.title ?? prev.aiTitle,
          aiTitleCn: b.ai?.title_cn ?? prev.aiTitleCn,
          aiGreeting: b.ai?.greeting ?? prev.aiGreeting,
          aiGreetingCn: b.ai?.greeting_cn ?? prev.aiGreetingCn,
          
          // 首页内容
          intro: b.intro || prev.intro,
          worldBackground: b.world_background || prev.worldBackground,
          
          // 社交链接
          socialLinks: b.social_links || prev.socialLinks,
          
          // 功能开关
          features: b.features || prev.features,
          
          // 存储后端原始配置供其他组件使用
          _backendConfig: b,
        }));
      }
    } catch {
      // API 加载失败时使用默认配置，不显示错误
      console.log('Using default site config');
    } finally {
      setIsLoading(false);
    }
  };

  // 手动刷新配置
  const refreshConfig = async () => {
    await loadConfig();
  };

  // 初始加载
  useEffect(() => {
    loadConfig();
  }, []);

  // 定期刷新配置 (每5分钟)
  useEffect(() => {
    const interval = setInterval(() => {
      loadConfig();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // 页面可见性变化时刷新配置
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadConfig();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 更新配置
  const updateConfig = (newConfig: Partial<SiteConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...newConfig,
    }));
  };

  return (
    <SiteConfigContext.Provider value={{ config, isLoading, error, updateConfig, refreshConfig }}>
      {children}
    </SiteConfigContext.Provider>
  );
};

// 自定义 Hook 用于访问站点配置
export const useSiteConfig = (): SiteConfigContextType => {
  const context = useContext(SiteConfigContext);
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  return context;
};

// 获取当前语言的文本
export const useLocalizedText = () => {
  const { config } = useSiteConfig();
  
  return (enText: string, zhText: string, currentLang: string): string => {
    // 检查是否在装饰性文字例外列表中
    if (config.decorativeTextKeepEnglish.includes(enText)) {
      return enText;
    }
    return currentLang.startsWith('zh') ? zhText : enText;
  };
};

export default SiteConfigContext;
