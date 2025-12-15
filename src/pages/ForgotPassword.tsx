import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import api from '../api';
import { KeyRound, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const navigate = useNavigate();
  useTranslation();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('重置邮件已发送，请查收', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
      });
      setStep('reset');
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      if (errorCode === 'user_not_found') {
        toast.error('该邮箱未注册', {
          style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
        });
      } else {
        toast.error('发送失败，请稍后重试', {
          style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('两次输入的密码不一致', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }

    if (newPassword.length < 8) {
      toast.error('密码长度至少8个字符', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        code: code.trim(),
        new_password: newPassword
      });
      toast.success('密码重置成功！', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
      });
      navigate('/login');
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      const messages: Record<string, string> = {
        verification_code_expired: '重置码已过期，请重新发送',
        verification_code_used: '重置码已使用',
        invalid_verification_code: '无效的重置码',
        password_too_short: '密码长度至少8个字符',
        password_needs_letter: '密码必须包含字母',
        password_needs_number: '密码必须包含数字',
      };
      toast.error(messages[errorCode] || '重置失败，请重试', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 relative">
      {/* 背景效果 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 circuit-bg opacity-10" />
      </div>
      
      <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 backdrop-blur-xl border-neon-purple/30 card-scan relative">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-neon-purple/10 mb-4 heartbeat">
            <KeyRound className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-white mb-2 rgb-split-hover">
            {step === 'email' ? '忘记密码' : '重置密码'}
          </h1>
          <p className="text-gray-400 text-sm neon-flicker">
            {step === 'email'
              ? '输入您的邮箱，我们将发送重置链接'
              : '输入重置码和新密码'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase">
                邮箱地址
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>

            <NeonButton type="submit" className="w-full py-4 glitch-hover" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.2s' }} />
                </span>
              ) : '发送重置邮件'}
            </NeonButton>

            <div className="text-center">
              <a
                href="/login"
                className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                返回登录
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase">
                重置码
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all text-center tracking-widest font-mono"
                placeholder="输入重置码"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase">
                新密码
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                placeholder="至少8位，包含字母和数字"
                required
                minLength={8}
              />
            </div>

            <div>
              <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase">
                确认密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all"
                placeholder="再次输入新密码"
                required
              />
            </div>

            <NeonButton type="submit" className="w-full py-4 glitch-hover" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-2 h-2 bg-white rounded-full cute-bounce" style={{ animationDelay: '0.2s' }} />
                </span>
              ) : '重置密码'}
            </NeonButton>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep('email')}
                className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-2 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                重新发送
              </button>
            </div>
          </form>
        )}
      </CyberCard>
    </div>
  );
};

export default ForgotPassword;
