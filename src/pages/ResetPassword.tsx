import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import CyberCard from '../components/ui/CyberCard';
import NeonButton from '../components/ui/NeonButton';
import api from '../api';
import { KeyRound, AlertCircle } from 'lucide-react';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const code = searchParams.get('code');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 检查是否有 code 参数
  useEffect(() => {
    if (!code) {
      setError('无效的重置链接，缺少重置码');
    }
  }, [code]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code) {
      toast.error('无效的重置链接', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }

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
      toast.success('密码重置成功！即将跳转到登录页面', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
        duration: 3000,
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      const messages: Record<string, string> = {
        verification_code_expired: '重置码已过期，请重新申请',
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
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 backdrop-blur-xl border-neon-purple/30">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-neon-purple/10 mb-4">
            <KeyRound className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-white mb-2">
            重置密码
          </h1>
          <p className="text-gray-400 text-sm">
            设置您的新密码
          </p>
        </div>

        {error ? (
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <NeonButton onClick={() => navigate('/forgot-password')} className="w-full py-4">
              重新申请重置
            </NeonButton>
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-6">
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

            <NeonButton type="submit" className="w-full py-4" disabled={loading}>
              {loading ? '重置中...' : '确认重置'}
            </NeonButton>

            <div className="text-center">
              <a
                href="/login"
                className="text-gray-400 hover:text-white text-sm"
              >
                返回登录
              </a>
            </div>
          </form>
        )}
      </CyberCard>
    </div>
  );
};

export default ResetPassword;
