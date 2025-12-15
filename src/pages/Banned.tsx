import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldX, Calendar, AlertTriangle } from 'lucide-react';
import NeonButton from '../components/ui/NeonButton';

const Banned = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  let banInfo = { reason: '违反社区规定', until: '' };
  try {
    const infoParam = searchParams.get('info');
    if (infoParam) {
      banInfo = JSON.parse(decodeURIComponent(infoParam));
    }
  } catch {
    // 使用默认值
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '永久';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center p-4">
      {/* 背景效果 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-md w-full">
        {/* 主卡片 */}
        <div className="bg-[#0a0a14]/90 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center">
          {/* 图标 */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 border border-red-500/50 flex items-center justify-center">
            <ShieldX className="w-10 h-10 text-red-500" />
          </div>

          {/* 标题 */}
          <h1 className="text-2xl font-orbitron font-bold text-red-400 mb-2">
            账号已被封禁
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            您的账号因违反社区规定已被暂停使用
          </p>

          {/* 封禁信息 */}
          <div className="space-y-4 mb-8">
            <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-mono">封禁原因</span>
              </div>
              <p className="text-white text-sm">{banInfo.reason}</p>
            </div>

            <div className="bg-black/40 border border-white/10 rounded-lg p-4 text-left">
              <div className="flex items-center gap-2 text-orange-400 text-sm mb-2">
                <Calendar className="w-4 h-4" />
                <span className="font-mono">解封时间</span>
              </div>
              <p className="text-white text-sm">{formatDate(banInfo.until)}</p>
            </div>
          </div>

          {/* 提示 */}
          <p className="text-gray-500 text-xs mb-6">
            如有疑问，请联系管理员申诉
          </p>

          {/* 按钮 */}
          <NeonButton onClick={() => navigate('/')} variant="outline" className="w-full">
            返回首页
          </NeonButton>
        </div>
      </div>
    </div>
  );
};

export default Banned;
