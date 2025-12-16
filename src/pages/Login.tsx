import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import api from '../api';
import { getApiErrorMessage } from '../lib/utils';

const Login = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    // Pre-fill for easier demo, can render empty state too
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const res = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const { access_token, refresh_token } = res.data;
            // 保存双 Token
            localStorage.setItem('access_token', access_token);
            localStorage.setItem('refresh_token', refresh_token);
            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError(getApiErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
            {/* 背景扫描线 */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute inset-0 circuit-bg opacity-10" />
            </div>
            
            <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 backdrop-blur-xl border-neon-purple/30 shadow-[0_0_50px_rgba(138,43,226,0.15)] relative card-scan">

                {/* Decorative Corner Elements - 动画增强 */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-neon-purple rounded-tl-lg neon-pulse-purple"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-neon-purple rounded-tr-lg neon-pulse-purple"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-neon-purple rounded-bl-lg neon-pulse-purple"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-neon-purple rounded-br-lg neon-pulse-purple"></div>


                <div className="text-center mb-10 relative">
                    <div className="inline-block p-4 rounded-full bg-neon-purple/10 mb-4 heartbeat">
                        <div className="w-4 h-4 bg-neon-purple rounded-full shadow-[0_0_15px_rgba(138,43,226,0.8)]"></div>
                    </div>
                    <h1 className="text-4xl font-orbitron font-bold text-white mb-2 tracking-wider drop-shadow-lg rgb-split-hover">{t('auth.login_title')}</h1>
                    <p className="text-cyber-cyan text-sm tracking-[0.2em] uppercase font-bold text-shadow-cyan neon-flicker">{t('auth.login_subtitle')}</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase tracking-wide">{t('auth.username')}</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all placeholder-gray-700"
                            placeholder="ENTER ID..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase tracking-wide">{t('auth.password')}</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all placeholder-gray-700"
                            placeholder="ACCESS CODE..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-xs text-center font-mono">
                            [ERROR]: {error}
                        </div>
                    )}

                    <NeonButton type="submit" className="w-full py-4 text-sm tracking-[0.1em] glitch-hover" disabled={loading}>
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0s' }} />
                                <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.1s' }} />
                                <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.2s' }} />
                            </span>
                        ) : t('auth.submit_login')}
                    </NeonButton>

                    <div className="flex justify-between items-center mt-6 text-xs relative z-10">
                        <Link to="/forgot-password" className="text-cyber-cyan hover:text-white transition-colors neon-flicker">
                            忘记密码?
                        </Link>
                        <div>
                            <span className="text-gray-500">{t('auth.no_account')} </span>
                            <Link to="/register" className="text-cyber-cyan hover:text-white transition-colors underline-offset-4 hover:underline ml-1">
                                {t('auth.create_account')}
                            </Link>
                        </div>
                    </div>
                </form>
            </CyberCard>
        </div>
    );
};

export default Login;
