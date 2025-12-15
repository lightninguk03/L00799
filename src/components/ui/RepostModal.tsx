import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Repeat, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api';
import type { PostResponse } from '../../api';
import NeonButton from './NeonButton';
import { getAvatarUrl, getMediaUrl } from '../../lib/utils';

interface RepostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostResponse;
}

const RepostModal = ({ isOpen, onClose, post }: RepostModalProps) => {
    const queryClient = useQueryClient();
    const [comment, setComment] = useState('');
    const maxLength = 200;

    const repostMutation = useMutation({
        mutationFn: async (repostComment: string) => {
            const res = await api.post(`/posts/${post.id}/repost`, { 
                comment: repostComment || undefined 
            });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('转发成功！', {
                style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
            });
            setComment('');
            onClose();
        },
        onError: () => {
            toast.error('转发失败，请稍后重试', {
                style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
            });
        }
    });

    const handleSubmit = () => {
        repostMutation.mutate(comment);
    };

    // 使用工具函数解析媒体 URL
    const imageUrl = getMediaUrl(post.media_urls);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-lg bg-[#0a0a14] border border-white/10 rounded-xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <div className="flex items-center space-x-2">
                                <Repeat className="w-5 h-5 text-green-400" />
                                <h2 className="text-lg font-orbitron text-white">转发动态</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* 添加转发评论 */}
                            <div className="relative">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value.slice(0, maxLength))}
                                    placeholder="添加你的评论（可选）..."
                                    className="w-full h-24 p-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-green-400/50 transition-colors"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                    {comment.length}/{maxLength}
                                </div>
                            </div>

                            {/* 原帖预览 */}
                            <div className="p-3 bg-black/30 border border-white/5 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan p-[1px]">
                                        {post.user?.avatar ? (
                                            <img src={getAvatarUrl(post.user.avatar) || ''} alt="" className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full rounded-full bg-[#050510] flex items-center justify-center">
                                                <span className="text-[8px] text-white">{post.user_id}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-cyber-cyan font-orbitron">
                                        {post.user?.username || `USER-${post.user_id}`}
                                    </span>
                                </div>
                                
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt="Original post"
                                        className="w-full h-24 object-cover rounded mb-2 opacity-80"
                                    />
                                )}
                                
                                <p className="text-xs text-gray-400 line-clamp-2">
                                    {post.content || '无文字内容'}
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end space-x-3 p-4 border-t border-white/10">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm text-gray-400 hover:text-white border border-white/20 rounded-lg hover:bg-white/5 transition-colors"
                            >
                                取消
                            </button>
                            <NeonButton
                                onClick={handleSubmit}
                                disabled={repostMutation.isPending}
                                className="px-4 py-2 !from-green-500 !to-emerald-400"
                            >
                                {repostMutation.isPending ? (
                                    <span className="flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>转发中...</span>
                                    </span>
                                ) : '转发'}
                            </NeonButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default RepostModal;
