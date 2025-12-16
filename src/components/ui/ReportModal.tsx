import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { X, AlertTriangle, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { reportApi, type ReportTargetType } from '../../api';
import NeonButton from './NeonButton';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: number;
}

const REPORT_REASONS = [
  { id: 'spam', label: '垃圾信息/广告' },
  { id: 'harassment', label: '骚扰/欺凌' },
  { id: 'hate', label: '仇恨言论' },
  { id: 'violence', label: '暴力/危险内容' },
  { id: 'nsfw', label: '不当内容 (NSFW)' },
  { id: 'copyright', label: '侵犯版权' },
  { id: 'impersonation', label: '冒充他人' },
  { id: 'other', label: '其他' },
];

const ReportModal = ({ isOpen, onClose, targetType, targetId }: ReportModalProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  // 模态框打开时禁止背景滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const reportMutation = useMutation({
    mutationFn: async () => {
      const reason = selectedReason === 'other' ? customReason : REPORT_REASONS.find(r => r.id === selectedReason)?.label || '';
      await reportApi.create({ target_type: targetType, target_id: targetId, reason });
    },
    onSuccess: () => {
      toast.success('举报已提交，我们会尽快处理', {
        style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
      });
      onClose();
      setSelectedReason('');
      setCustomReason('');
    },
    onError: () => {
      toast.error('举报提交失败，请稍后重试', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedReason) {
      toast.error('请选择举报原因', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }
    if (selectedReason === 'other' && !customReason.trim()) {
      toast.error('请填写具体原因', {
        style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
      });
      return;
    }
    reportMutation.mutate();
  };

  const targetLabel = targetType === 'post' ? '动态' : targetType === 'comment' ? '评论' : '用户';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0a14] border border-red-500/30 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-red-500/20 to-transparent flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-400" />
                <h3 className="font-orbitron font-bold text-white">举报{targetLabel}</h3>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-200">
                  请选择举报原因，我们会认真审核每一条举报。恶意举报可能导致账号受限。
                </p>
              </div>

              <div className="space-y-2">
                {REPORT_REASONS.map((reason) => (
                  <label
                    key={reason.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedReason === reason.id
                        ? 'border-red-500/50 bg-red-500/10'
                        : 'border-white/10 hover:border-white/20'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={reason.id}
                      checked={selectedReason === reason.id}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="w-4 h-4 accent-red-500"
                    />
                    <span className="text-sm text-gray-300">{reason.label}</span>
                  </label>
                ))}
              </div>

              {selectedReason === 'other' && (
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="请描述具体原因..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg p-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-red-500/50 resize-none"
                  rows={3}
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 py-2 border border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-all text-sm"
              >
                取消
              </button>
              <NeonButton
                onClick={handleSubmit}
                disabled={reportMutation.isPending}
                className="flex-1 !bg-red-500/20 !border-red-500/50 hover:!bg-red-500/30"
              >
                {reportMutation.isPending ? '提交中...' : '提交举报'}
              </NeonButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReportModal;
