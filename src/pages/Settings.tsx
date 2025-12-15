import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import { Globe, Bell, Shield, Key, Mail, LogOut, ChevronRight, Loader2 } from 'lucide-react';
import api from '../api';

const Settings = () => {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();

    // 通知设置状态
    const [notifyLikes, setNotifyLikes] = useState(true);
    const [notifyComments, setNotifyComments] = useState(true);
    const [notifyFollows, setNotifyFollows] = useState(true);
    const [notifySystem, setNotifySystem] = useState(true);

    const toggleLanguage = () => {
        const newLang = i18n.language === 'zh' ? 'en' : 'zh';
        i18n.changeLanguage(newLang);
        localStorage.setItem('language', newLang);
        toast.success(newLang === 'zh' ? '已切换到中文' : 'Switched to English', {
            style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
        });
    };

    // 登出
    const logoutMutation = useMutation({
        mutationFn: async () => {
            await api.post('/auth/logout');
        },
        onSuccess: () => {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            toast.success('已退出登录', {
                style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
            });
            navigate('/login');
        },
        onError: () => {
            // 即使 API 失败也清除本地 token
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login');
        }
    });

    const handleLogout = () => {
        logoutMutation.mutate();
    };

    // 通知开关组件
    const NotificationToggle = ({
        label,
        description,
        checked,
        onChange
    }: {
        label: string;
        description: string;
        checked: boolean;
        onChange: (v: boolean) => void;
    }) => (
        <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
                <p className="text-white text-sm">{label}</p>
                <p className="text-gray-500 text-xs">{description}</p>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={`w-12 h-6 rounded-full transition-colors relative ${checked ? 'bg-cyber-cyan' : 'bg-gray-700'
                    }`}
            >
                <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'
                        }`}
                />
            </button>
        </div>
    );

    return (
        <>
            <div className="max-w-4xl mx-auto p-6">
                <h1 className="text-3xl font-orbitron font-bold text-white mb-6">{t('profile.settings.title')}</h1>

                <div className="space-y-4">
                    {/* 语言设置 */}
                    <CyberCard className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Globe className="w-5 h-5 text-neon-purple" />
                                <div>
                                    <h3 className="font-orbitron font-bold text-white">语言 / Language</h3>
                                    <p className="text-sm text-gray-400">当前: {i18n.language === 'zh' ? '中文' : 'English'}</p>
                                </div>
                            </div>
                            <NeonButton onClick={toggleLanguage} variant="outline" className="text-xs">
                                切换 / Switch
                            </NeonButton>
                        </div>
                    </CyberCard>

                    {/* 通知设置 */}
                    <CyberCard className="p-6">
                        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
                            <Bell className="w-5 h-5 text-cyber-cyan" />
                            <div>
                                <h3 className="font-orbitron font-bold text-white">通知设置</h3>
                                <p className="text-sm text-gray-400">管理你的通知偏好</p>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <NotificationToggle
                                label="点赞通知"
                                description="当有人点赞你的动态时通知"
                                checked={notifyLikes}
                                onChange={setNotifyLikes}
                            />
                            <NotificationToggle
                                label="评论通知"
                                description="当有人评论你的动态时通知"
                                checked={notifyComments}
                                onChange={setNotifyComments}
                            />
                            <NotificationToggle
                                label="关注通知"
                                description="当有人关注你时通知"
                                checked={notifyFollows}
                                onChange={setNotifyFollows}
                            />
                            <NotificationToggle
                                label="系统通知"
                                description="接收系统公告和更新"
                                checked={notifySystem}
                                onChange={setNotifySystem}
                            />
                        </div>
                    </CyberCard>

                    {/* 隐私与安全 */}
                    <CyberCard className="p-6">
                        <div className="flex items-center space-x-3 mb-4 pb-4 border-b border-white/10">
                            <Shield className="w-5 h-5 text-pink-500" />
                            <div>
                                <h3 className="font-orbitron font-bold text-white">隐私与安全</h3>
                                <p className="text-sm text-gray-400">账号安全设置</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {/* 修改密码 */}
                            <button
                                onClick={() => navigate('/forgot-password')}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center space-x-3">
                                    <Key className="w-4 h-4 text-gray-400 group-hover:text-cyber-cyan" />
                                    <div className="text-left">
                                        <p className="text-white text-sm">修改密码</p>
                                        <p className="text-gray-500 text-xs">更新你的登录密码</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyber-cyan" />
                            </button>

                            {/* 邮箱验证 */}
                            <button
                                onClick={() => navigate('/verify-email')}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center space-x-3">
                                    <Mail className="w-4 h-4 text-gray-400 group-hover:text-cyber-cyan" />
                                    <div className="text-left">
                                        <p className="text-white text-sm">邮箱验证</p>
                                        <p className="text-gray-500 text-xs">验证你的邮箱地址</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-cyber-cyan" />
                            </button>
                        </div>
                    </CyberCard>

                    {/* 退出登录 */}
                    <CyberCard className="p-6 border-red-500/20 hover:border-red-500/50 transition-colors">
                        <button
                            onClick={handleLogout}
                            disabled={logoutMutation.isPending}
                            className="w-full flex items-center justify-between"
                        >
                            <div className="flex items-center space-x-3">
                                <LogOut className="w-5 h-5 text-red-400" />
                                <div className="text-left">
                                    <h3 className="font-orbitron font-bold text-red-400">退出登录</h3>
                                    <p className="text-sm text-gray-500">退出当前账号</p>
                                </div>
                            </div>
                            {logoutMutation.isPending ? (
                                <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-red-400" />
                            )}
                        </button>
                    </CyberCard>
                </div>
            </div>
        </>
    );
};

export default Settings;
