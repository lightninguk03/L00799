import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info, AlertTriangle, Megaphone, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { systemApi, type Announcement } from '../../api';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { useTranslation } from 'react-i18next';

const AnnouncementBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<number[]>([]);
  const [configDismissed, setConfigDismissed] = useState(false);
  const { config } = useSiteConfig();
  const { i18n } = useTranslation();
  const isZh = i18n.language.startsWith('zh');

  // 从 /system/announcements API 获取公告列表
  const { data: announcements = [] } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: async () => {
      try {
        const res = await systemApi.getAnnouncements();
        // 兼容多种返回格式
        const data = res.data as unknown;
        if (Array.isArray(data)) {
          return data as Announcement[];
        }
        // 如果是分页格式 { items: [...] }
        if (data && typeof data === 'object' && 'items' in data && Array.isArray((data as { items: unknown[] }).items)) {
          return (data as { items: Announcement[] }).items;
        }
        return [];
      } catch {
        // 接口不存在或出错时返回空数组
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5分钟缓存
    retry: false, // 不重试，避免接口不存在时反复请求
  });
  
  // 从 /system/config 获取的单个公告配置
  const configAnnouncement = config._backendConfig?.announcement as {
    enabled?: boolean;
    type?: 'info' | 'warning' | 'important';
    content?: string;
    content_cn?: string;
    link?: string;
  } | undefined;

  // 确保 announcements 是数组
  const safeAnnouncements = Array.isArray(announcements) ? announcements : [];

  // 过滤已关闭的公告
  const activeAnnouncements = safeAnnouncements.filter(
    (a) => a.is_active && !dismissed.includes(a.id)
  );
  
  // 检查是否有来自 config 的公告
  const hasConfigAnnouncement = configAnnouncement?.enabled && configAnnouncement?.content && !configDismissed;

  // 自动轮播
  useEffect(() => {
    if (activeAnnouncements.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeAnnouncements.length]);
  
  // 如果有 config 公告，优先显示
  if (hasConfigAnnouncement) {
    const content = isZh ? (configAnnouncement.content_cn || configAnnouncement.content) : configAnnouncement.content;
    const type = configAnnouncement.type || 'info';
    const link = configAnnouncement.link;
    
    const getTypeStyles = (t: string) => {
      switch (t) {
        case 'warning':
          return {
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/30',
            icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
            text: 'text-yellow-200',
          };
        case 'important':
          return {
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
            icon: <Megaphone className="w-4 h-4 text-red-400" />,
            text: 'text-red-200',
          };
        default:
          return {
            bg: 'bg-cyber-cyan/10',
            border: 'border-cyber-cyan/30',
            icon: <Info className="w-4 h-4 text-cyber-cyan" />,
            text: 'text-cyber-cyan',
          };
      }
    };
    
    const styles = getTypeStyles(type);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3 mb-4`}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">{styles.icon}</div>
          <div className="flex-1 min-w-0">
            {link ? (
              <Link to={link} className={`text-sm ${styles.text} hover:underline`}>
                {content}
              </Link>
            ) : (
              <p className={`text-sm ${styles.text}`}>{content}</p>
            )}
          </div>
          <button
            onClick={() => setConfigDismissed(true)}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    );
  }

  if (activeAnnouncements.length === 0) return null;

  const current = activeAnnouncements[currentIndex];
  if (!current) return null;

  const getTypeStyles = (type: Announcement['type']) => {
    switch (type) {
      case 'warning':
        return {
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/30',
          icon: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
          text: 'text-yellow-200',
        };
      case 'important':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          icon: <Megaphone className="w-4 h-4 text-red-400" />,
          text: 'text-red-200',
        };
      default:
        return {
          bg: 'bg-cyber-cyan/10',
          border: 'border-cyber-cyan/30',
          icon: <Info className="w-4 h-4 text-cyber-cyan" />,
          text: 'text-cyber-cyan',
        };
    }
  };

  const styles = getTypeStyles(current.type);

  const handleDismiss = () => {
    setDismissed((prev) => [...prev, current.id]);
    if (currentIndex >= activeAnnouncements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + activeAnnouncements.length) % activeAnnouncements.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeAnnouncements.length);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`${styles.bg} ${styles.border} border rounded-lg px-4 py-3 mb-4`}
      >
        <div className="flex items-center gap-3">
          {/* 图标 */}
          <div className="flex-shrink-0">{styles.icon}</div>

          {/* 内容 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-orbitron text-sm font-bold ${styles.text}`}>
                {current.title}
              </span>
              {activeAnnouncements.length > 1 && (
                <span className="text-xs text-gray-500">
                  ({currentIndex + 1}/{activeAnnouncements.length})
                </span>
              )}
            </div>
            <p className="text-sm text-gray-300 truncate">{current.content}</p>
          </div>

          {/* 导航按钮 */}
          {activeAnnouncements.length > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 关闭按钮 */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AnnouncementBanner;
