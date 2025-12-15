import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import CyberCard from '../components/ui/CyberCard';

import NeonButton from '../components/ui/NeonButton';
import api from '../api';
import { Mail, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';

const VerifyEmail = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const emailFromParams = searchParams.get('email') || '';
  const codeFromParams = searchParams.get('code') || '';

  const [code, setCode] = useState(codeFromParams);
  const [email, setEmail] = useState(emailFromParams);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);

  // 如果 URL 中有 code 参数，自动验证
  useEffect(() => {
    if (codeFromParams) {
      setAutoVerifying(true);
      api.post('/auth/verify-email', { code: codeFromParams.trim() })
        .then(() => {
          setVerified(true);
          toast.success('邮箱验证成功！', {
            style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
          });
          setTimeout(() => navigate('/login'), 2000);
        })
        .catch((err: any) => {
          setAutoVerifying(false);
          const errorCode = err.response?.data?.error_code;
          const messages: Record<string, string> = {
            verification_code_expired: '验证码已过期，请重新发送',
            verification_code_used: '验证码已使用',
            invalid_verification_code: '无效的验证码',
            email_already_verified: '邮箱已验证，可以直接登录',
          };
          if (errorCode === 'email_already_verified') {
            toast.success(messages[errorCode], {
              style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
            });
            setTimeout(() => navigate('/login'), 2000);
          } else {
            toast.error(messages[errorCode] || '验证失败，请手动输入验证码', {
              style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
            });
          }
        });
    }
  }, [codeFromParams, navigate]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    try {
      await api.post('/auth/verify-email', { code: code.trim() });
      setVerified(true);
      toast.success('邮箱验证成功！', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
      });
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      const messages: Record<string, string> = {
        verification_code_expired: '验证码已过期，请重新发送',
        verification_code_used: '验证码已使用',
        invalid_verification_code: '无效的验证码',
      };
      toast.error(messages[errorCode] || '验证失败，请重试', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email.trim()) {
      toast.error('请输入邮箱地址', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }

    setResending(true);
    try {
      await api.post('/auth/resend-verify', { email: email.trim() });
      toast.success('验证邮件已发送，请查收', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
      });
    } catch (err: any) {
      const errorCode = err.response?.data?.error_code;
      if (errorCode === 'email_already_verified') {
        toast.success('邮箱已验证，可以直接登录', {
          style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
        });
        navigate('/login');
      } else {
        toast.error('发送失败，请稍后重试', {
          style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
        });
      }
    } finally {
      setResending(false);
    }
  };

  // 自动验证中的加载状态
  if (autoVerifying) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 text-center">
          <Loader2 className="w-16 h-16 text-neon-purple mx-auto mb-4 animate-spin" />
          <h1 className="text-2xl font-orbitron font-bold text-white mb-2">正在验证</h1>
          <p className="text-gray-400">请稍候...</p>
        </CyberCard>
      </div>
    );
  }

  if (verified) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 text-center">
          <CheckCircle className="w-16 h-16 text-cyber-cyan mx-auto mb-4" />
          <h1 className="text-2xl font-orbitron font-bold text-white mb-2">验证成功</h1>
          <p className="text-gray-400">正在跳转到登录页...</p>
        </CyberCard>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <CyberCard className="w-full max-w-md p-8 bg-glass-black/90 backdrop-blur-xl border-neon-purple/30">
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full bg-neon-purple/10 mb-4">
            <Mail className="w-8 h-8 text-neon-purple" />
          </div>
          <h1 className="text-3xl font-orbitron font-bold text-white mb-2">
            {t('auth.verify_email') || '验证邮箱'}
          </h1>
          <p className="text-gray-400 text-sm">
            请输入发送到您邮箱的验证码
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
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
            />
          </div>

          <div>
            <label className="block text-xs font-orbitron text-gray-400 mb-2 uppercase">
              验证码
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-[#0a0a12]/80 border border-white/10 rounded p-4 text-white focus:border-neon-purple focus:ring-1 focus:ring-neon-purple outline-none transition-all text-center text-2xl tracking-widest font-mono"
              placeholder="输入验证码"
              maxLength={10}
            />
          </div>

          <NeonButton type="submit" className="w-full py-4" disabled={loading || !code.trim()}>
            {loading ? '验证中...' : '验证邮箱'}
          </NeonButton>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-cyber-cyan hover:text-white transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? '发送中...' : '重新发送验证邮件'}
            </button>
          </div>

          <div className="text-center pt-4 border-t border-white/10">
            <a href="/login" className="text-gray-400 hover:text-white text-sm">
              返回登录
            </a>
          </div>
        </form>
      </CyberCard>
    </div>
  );
};

export default VerifyEmail;
