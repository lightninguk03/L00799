// import React from 'react'; 
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import api from '../api';
import { getApiErrorMessage } from '../lib/utils';

const Register = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError("Passcodes do not match");
            return;
        }

        setLoading(true);

        try {
            await api.post('/auth/register', {
                email: formData.email,
                username: formData.username,
                password: formData.password
            });

            // Auto login or redirect to login
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            setError(getApiErrorMessage(err, t));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 backdrop-blur-xl border-neon-purple/30 shadow-[0_0_50px_rgba(138,43,226,0.15)]">


                <div className="text-center mb-8">
                    <h1 className="text-3xl font-orbitron font-bold text-white mb-2">{t('auth.register_title')}</h1>
                    <p className="text-gray-400 text-xs">{t('auth.register_subtitle')}</p>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                    <div>
                        <label className="block text-xs font-orbitron text-gray-500 mb-1 uppercase">{t('auth.username')}</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-3 text-white focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="Callsign..."
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-orbitron text-gray-500 mb-1 uppercase">{t('auth.email')}</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-3 text-white focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="name@net.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-orbitron text-gray-500 mb-1 uppercase">{t('auth.password')}</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-3 text-white focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="******"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-orbitron text-gray-500 mb-1 uppercase">{t('auth.confirm_password')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-3 text-white focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan outline-none transition-all placeholder-gray-700 text-sm"
                            placeholder="******"
                            required
                        />
                    </div>

                    {error && (
                        <div className="p-2 bg-red-900/40 border border-red-500/50 rounded text-red-200 text-xs text-center font-mono">
                            [ERROR]: {error}
                        </div>
                    )}

                    <NeonButton type="submit" variant="secondary" className="w-full mt-4 py-3" disabled={loading}>
                        {loading ? t('auth.registering') : t('auth.submit_register')}
                    </NeonButton>

                    <div className="text-center mt-6">
                        <Link to="/login" className="text-xs text-gray-500 hover:text-white transition-colors">
                            {t('auth.has_account')} <span className="text-neon-purple">{t('auth.login')}</span>
                        </Link>
                    </div>
                </form>
            </CyberCard>
        </div>
    );
};

export default Register;
