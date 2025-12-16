import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Sparkles, Languages, LogIn, LogOut, Bot } from 'lucide-react';
import { cn, getMediaUrl } from '../../lib/utils';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { authApi } from '../../api';
import logoImgDefault from '../../assets/logo.jpg';

const NavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { config } = useSiteConfig();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 从配置获取 Logo
  const logoImg = getMediaUrl(config.logo) || logoImgDefault;

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsLoggedIn(!!token);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('zh') ? 'en' : 'zh';
    i18n.changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await authApi.logout();
    setIsLoggedIn(false);
    navigate('/login');
  };

  // 新导航项：首页、闪电社区、Mu AI、我的
  const navItems = [
    { name: t('nav.home'), path: '/', icon: Home },
    { name: t('nav.community'), path: '/community', icon: Sparkles },
    { name: t('nav.agent'), path: '/mu-ai', icon: Bot },
    { name: t('nav.profile'), path: '/profile', icon: User },
  ];

  const isAuthPage = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email'].includes(location.pathname);
  if (isAuthPage) return null;

  return (
    <>
      {/* Desktop Header */}
      <header className="fixed top-0 left-0 right-0 z-50 hidden md:block pointer-events-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pointer-events-auto">
          <div className="relative flex h-16 items-center justify-between bg-glass-black/90 backdrop-blur-xl rounded-b-2xl border-b border-white/10 px-8 mt-0 shadow-lg border-x border-white/5 overflow-hidden">
            {/* 底部能量流动光带 */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] gradient-border">
              <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-cyber-cyan to-neon-purple animate-pulse opacity-60" />
            </div>

            {/* Logo - 只显示图片，不显示文字 */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <img src={logoImg} alt={config.siteName} className="h-12 w-auto max-w-[280px] rounded-lg object-contain" />
              </Link>
            </div>

            {/* Desktop Nav Links */}
            <nav className="flex space-x-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group flex items-center space-x-2 text-sm font-medium transition-all duration-300 relative py-2",
                    isActive(item.path) ? "text-cyber-cyan" : "text-gray-400 hover:text-white"
                  )}
                >
                  <item.icon className={cn("h-4 w-4 transition-transform group-hover:scale-110", isActive(item.path) && "text-cyber-cyan")} />
                  <span className="font-orbitron tracking-wide">{item.name}</span>
                  {isActive(item.path) && (
                    <motion.div
                      layoutId="desktop-nav-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyber-cyan shadow-[0_0_15px_#00ffff,0_0_30px_#00ffff]"
                    />
                  )}
                  {/* 选中时文字光晕效果 */}
                  {isActive(item.path) && (
                    <div className="absolute inset-0 bg-cyber-cyan/5 rounded-lg blur-sm -z-10" />
                  )}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              {/* Auth Button */}
              {isLoggedIn ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 text-gray-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-white/5"
                  title={t('auth.logout')}
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-orbitron text-xs font-bold hidden xl:block">
                    {t('auth.logout')}
                  </span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center space-x-2 text-gray-400 hover:text-cyber-cyan transition-colors p-2 rounded-lg hover:bg-white/5"
                  title={t('auth.login')}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="font-orbitron text-xs font-bold hidden xl:block">
                    {t('auth.login')}
                  </span>
                </Link>
              )}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
                title="Switch Language"
              >
                <Languages className="w-5 h-5" />
                <span className="font-orbitron text-xs font-bold w-6">
                  {i18n.language.startsWith('zh') ? 'CN' : 'EN'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>


      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 block md:hidden bg-[#0a0a12]/90 backdrop-blur-xl border-t border-white/10 pb-safe pt-2" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
        <div className="flex justify-around items-center h-14 relative">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full space-y-1 active:scale-95 transition-transform",
                isActive(item.path) ? "text-cyber-cyan" : "text-gray-500 hover:text-gray-300"
              )}
            >
              <div className="relative p-1">
                <item.icon className={cn("h-6 w-6", isActive(item.path) && "filter drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]")} />
                {isActive(item.path) && (
                  <motion.div
                    layoutId="mobile-nav-indicator"
                    className="absolute -top-1 left-1/2 w-1 h-1 bg-cyber-cyan rounded-full transform -translate-x-1/2 shadow-cyan-glow"
                  />
                )}
              </div>
              <span className="text-[10px] font-orbitron tracking-wider">{item.name}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default NavBar;
