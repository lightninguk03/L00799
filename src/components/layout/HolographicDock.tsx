import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Sparkles, LogIn, LogOut, Bot } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { authApi } from '../../api';

// Dock Item Component with Magnification Logic
interface DockItemProps {
    mouseX: ReturnType<typeof useMotionValue<number>>;
    item: { name: string; path: string; icon: React.ComponentType<{ className?: string }> };
    isActive: boolean;
    onClick?: () => void;
}

const DockItem = ({ mouseX, item, isActive, onClick }: DockItemProps) => {
    const ref = React.useRef<HTMLDivElement>(null);

    const distance = useTransform(mouseX, (val: number) => {
        const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
        return val - bounds.x - bounds.width / 2;
    });

    const widthSync = useTransform(distance, [-150, 0, 150], [40, 80, 40]);
    const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

    return (
        <motion.div
            ref={ref}
            style={{ width }}
            className="aspect-square flex items-center justify-center relative group"
        >
            <Link
                to={item.path}
                className="w-full h-full flex items-center justify-center"
                onClick={onClick}
            >
                <div
                    className={cn(
                        "w-full h-full rounded-2xl flex items-center justify-center transition-all bg-glass-black/50 border border-white/10 backdrop-blur-md relative overflow-hidden",
                        isActive ? "border-lightning-cyan shadow-[0_0_15px_rgba(0,243,255,0.3)]" : "hover:border-white/30"
                    )}
                >
                    <item.icon className={cn(
                        "w-5 h-5 transition-colors",
                        isActive ? "text-lightning-cyan" : "text-white/70 group-hover:text-white"
                    )} />

                    {/* Active Indicator Dot */}
                    {isActive && (
                        <div className="absolute -bottom-1 w-1 h-1 bg-lightning-cyan rounded-full shadow-cyan-glow" />
                    )}
                </div>
            </Link>

            {/* Tooltip */}
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/80 border border-white/10 rounded text-xs text-lightning-cyan opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-rajdhani">
                {item.name}
            </div>
        </motion.div>
    );
};

const HolographicDock = () => {
    const mouseX = useMotionValue(Infinity);
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        setIsLoggedIn(!!token);
    }, [location.pathname]);

    const handleLogout = async () => {
        await authApi.logout();
        setIsLoggedIn(false);
        navigate('/login');
    };

    const navItems = [
        { name: t('nav.home'), path: '/', icon: Home },
        { name: t('nav.community'), path: '/community', icon: Sparkles },
        { name: t('nav.agent'), path: '/mu-ai', icon: Bot },
        { name: t('nav.profile'), path: '/profile', icon: User },
    ];

    return (
        <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none">
            {/* Dock Container */}
            <motion.div
                onMouseMove={(e) => mouseX.set(e.pageX)}
                onMouseLeave={() => mouseX.set(Infinity)}
                className="pointer-events-auto h-16 mx-auto px-4 pb-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 shadow-2xl flex items-end gap-4 relative"
            >
                {/* Background Glow */}
                <div className="absolute inset-0 -z-10 rounded-2xl bg-gradient-to-t from-soul-purple/20 to-transparent opacity-50" />

                {/* Main Nav Items */}
                {navItems.map((item, i) => (
                    <DockItem
                        key={i}
                        mouseX={mouseX}
                        item={item}
                        isActive={location.pathname === item.path}
                    />
                ))}

                {/* Divider */}
                <div className="w-[1px] h-8 bg-white/10 mx-1 mb-3" />

                {/* System Actions */}
                <div className="flex gap-2 mb-2 items-center">
                    {isLoggedIn ? (
                        <button
                            onClick={handleLogout}
                            className="w-10 h-10 rounded-xl bg-glass-black/50 border border-white/10 flex items-center justify-center hover:bg-red-500/20 hover:border-red-500/50 transition-colors group relative"
                            title={t('auth.logout')}
                        >
                            <LogOut className="w-4 h-4 text-white/70 group-hover:text-red-400" />
                        </button>
                    ) : (
                        <Link
                            to="/login"
                            className="w-10 h-10 rounded-xl bg-glass-black/50 border border-white/10 flex items-center justify-center hover:bg-lightning-cyan/20 hover:border-lightning-cyan/50 transition-colors group relative"
                            title={t('auth.login')}
                        >
                            <LogIn className="w-4 h-4 text-white/70 group-hover:text-lightning-cyan" />
                        </Link>
                    )}
                </div>

            </motion.div>
        </div>
    );
};

export default HolographicDock;
