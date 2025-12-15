import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Edit3, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../api';
import type { PostResponse } from '../../api';
import NeonButton from './NeonButton';
import { getMediaUrl } from '../../lib/utils';

interface EditPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    post: PostResponse;
}

const EditPostModal = ({ isOpen, onClose, post }: EditPostModalProps) => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState(post.content || '');
    const maxLength = 500;

    useEffect(() => {
        setContent(post.content || '');
    }, [post]);

    const editMutation = useMutation({
        mutationFn: async (newContent: string) => {
            const res = await api.put(`/posts/${post.id}`, { content: newContent });
            return res.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', post.id] });
            toast.success('动态已更新', {
                style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
            });
            onClose();
        },
        onError: () => {
            toast.error('更新失败，请稍后重试', {
                style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
            });
        }
    });

    const handleSubmit = () => {
        if (!content.trim()) {
            toast.error('内容不能为空');
            return;
        }
        editMutation.mutate(content);
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
                                <Edit3 className="w-5 h-5 text-cyber-cyan" />
                                <h2 className="text-lg font-orbitron text-white">编辑动态</h2>
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
                            {/* 图片预览 (不可编辑) */}
                            {imageUrl && (
                                <div className="relative rounded-lg overflow-hidden bg-black/40">
                                    <img
                                        src={imageUrl}
                                        alt="Post media"
                                        className="w-full h-40 object-cover opacity-60"
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="flex items-center space-x-2 text-gray-400 text-sm">
                                            <Image className="w-4 h-4" />
                                            <span>图片不可修改</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 文本编辑 */}
                            <div className="relative">
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
                                    placeholder="编辑你的动态内容..."
                                    className="w-full h-32 p-3 bg-black/40 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-cyber-cyan/50 transition-colors"
                                />
                                <div className="absolute bottom-2 right-2 text-xs text-gray-500">
                                    {content.length}/{maxLength}
                                </div>
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
                                disabled={editMutation.isPending || !content.trim() || content === post.content}
                                className="px-4 py-2"
                            >
                                {editMutation.isPending ? (
                                    <span className="flex items-center space-x-2">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>保存中...</span>
                                    </span>
                                ) : '保存修改'}
                            </NeonButton>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default EditPostModal;
