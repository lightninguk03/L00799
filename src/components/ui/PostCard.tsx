import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Heart, Bookmark, MessageSquare, Trash2, MoreHorizontal, Edit3, Share2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api';
import type { PostResponse } from '../../api';
import CyberCard from './CyberCard';
import EditPostModal from './EditPostModal';
import ReportModal from './ReportModal';
import { cn, getAvatarUrl, getMediaUrl } from '../../lib/utils';
import { useAuth } from '../../hooks/useAuth';

interface PostCardProps {
    post: PostResponse;
    showActions?: boolean;
    currentUserId?: number;
}

const PostCard = ({ post, showActions = true, currentUserId }: PostCardProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { requireAuth, user } = useAuth();
    const [isLiked, setIsLiked] = useState(post.is_liked || false);
    const [isBookmarked, setIsBookmarked] = useState(post.is_collected || false);
    const [likeCount, setLikeCount] = useState(post.like_count || 0);
    const [showMenu, setShowMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    // const [showRepostModal, setShowRepostModal] = useState(false); // 暂时保留，未来可能启用
    const [showReportModal, setShowReportModal] = useState(false);

    // 判断是否是自己的帖子
    const isOwnPost = user?.id === post.user_id || currentUserId === post.user_id;

    // 使用工具函数处理媒体 URL
    let imageUrl = getMediaUrl(post.media_urls);

    // Placeholder image if no media, or specific logic
    if (!imageUrl && post.media_type === 'image') {
        imageUrl = 'https://placehold.co/600x400/050510/8a2be2?text=No+Image';
    }

    const interactMutation = useMutation({
        mutationFn: async (type: 'like' | 'bookmark') => {
            await api.post(`/posts/${post.id}/interact`, { interaction_type: type });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
        },
        onError: (_error: unknown, type: 'like' | 'bookmark') => {
            // 回滚 UI 状态
            if (type === 'like') {
                setIsLiked(prev => !prev);
                setLikeCount(prev => isLiked ? prev + 1 : prev - 1);
            } else {
                setIsBookmarked(prev => !prev);
            }
            toast.error('操作失败，请稍后重试', {
                style: {
                    background: '#0a0a14',
                    color: '#ff6b6b',
                    border: '1px solid rgba(255, 107, 107, 0.3)',
                },
            });
        }
    });

    const handleLike = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 检查登录状态
        if (!requireAuth(undefined, '请先登录后再点赞')) {
            return;
        }

        // Optimistic update
        const newIsLiked = !isLiked;
        setIsLiked(newIsLiked);
        setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);

        interactMutation.mutate('like');
    };

    const handleBookmark = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // 检查登录状态
        if (!requireAuth(undefined, '请先登录后再收藏')) {
            return;
        }

        setIsBookmarked(!isBookmarked);
        interactMutation.mutate('bookmark');
    };

    // 删除动态
    const deleteMutation = useMutation({
        mutationFn: async () => {
            await api.delete(`/posts/${post.id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            toast.success('动态已删除', {
                style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
            });
        },
        onError: () => {
            toast.error('删除失败，请稍后重试', {
                style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
            });
        }
    });

    const handleDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    const confirmDelete = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        deleteMutation.mutate();
        setShowDeleteConfirm(false);
    };

    return (
        <Link to={`/post/${post.id}`} className="block mb-6 break-inside-avoid overflow-visible">
            <CyberCard className="group cursor-pointer hover:z-10 bg-glass-black/80 overflow-visible card-scan float-card relative" hoverEffect={true} chamfered={false}>
                {/* Image with glass background for transparent images */}
                {imageUrl && (
                    <div className="relative w-full overflow-hidden rounded-lg mb-3 bg-glass-black/60 backdrop-blur-sm">
                        {/* 毛玻璃背景层 - 支持透明图片 */}
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 via-transparent to-cyber-cyan/10" />
                        <img
                            src={imageUrl}
                            alt="Post Cover"
                            className="relative object-contain w-full h-auto transition-transform duration-700 group-hover:scale-105"
                            loading="lazy"
                            style={{ maxHeight: '500px' }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent opacity-40 pointer-events-none" />
                    </div>
                )}

                {/* Content */}
                <div className={cn("px-3 pb-3", imageUrl ? "pt-4" : "pt-8")}>
                    <div className="flex items-center justify-between mb-3">
                        <div 
                            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = `/user/${post.user_id}`;
                            }}
                        >
                            {/* User Avatar */}
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan p-[1px] flex-shrink-0">
                                <div className="w-full h-full rounded-full bg-[#050510] overflow-hidden flex items-center justify-center">
                                    {post.user?.avatar ? (
                                        <img
                                            src={getAvatarUrl(post.user.avatar) || ''}
                                            alt={post.user.username}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[10px] text-white font-orbitron">{post.user_id}</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs text-cyber-cyan font-orbitron tracking-wide hover:text-white transition-colors">
                                    {post.user?.username || `USER-${post.user_id}`}
                                </span>
                                <span className="text-[10px] text-gray-500">{new Date(post.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* 更多操作菜单 */}
                        {showActions && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
                                    className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showMenu && (
                                    <div className="absolute right-0 top-6 bg-[#0a0a14] border border-white/10 rounded-lg shadow-lg z-20 min-w-[100px]">
                                        {isOwnPost ? (
                                            <>
                                                <button
                                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowEditModal(true); setShowMenu(false); }}
                                                    className="w-full px-3 py-2 text-left text-xs text-cyber-cyan hover:bg-cyber-cyan/10 flex items-center gap-2"
                                                >
                                                    <Edit3 className="w-3 h-3" />
                                                    编辑
                                                </button>
                                                <button
                                                    onClick={handleDelete}
                                                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                    删除
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    if (!requireAuth(undefined, '请先登录后再举报')) return;
                                                    setShowReportModal(true);
                                                    setShowMenu(false);
                                                }}
                                                className="w-full px-3 py-2 text-left text-xs text-orange-400 hover:bg-orange-500/10 flex items-center gap-2"
                                            >
                                                <Flag className="w-3 h-3" />
                                                举报
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* 删除确认对话框 */}
                    {showDeleteConfirm && (
                        <div
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 rounded-lg"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <div className="text-center p-4">
                                <p className="text-white text-sm mb-4">确定要删除这条动态吗？</p>
                                <div className="flex gap-2 justify-center">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowDeleteConfirm(false); }}
                                        className="px-4 py-2 text-xs border border-white/20 rounded text-gray-400 hover:text-white"
                                    >
                                        取消
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-xs bg-red-500/20 border border-red-500/50 rounded text-red-400 hover:bg-red-500/30"
                                    >
                                        {deleteMutation.isPending ? '删除中...' : '确认删除'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <p className="text-sm text-gray-300 line-clamp-3 mb-4 font-sans leading-relaxed">
                        {post.content || t('home.no_content')}
                    </p>

                    {/* Stats Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                        <div className="flex items-center space-x-4 text-xs font-orbitron text-gray-400">
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "flex items-center space-x-1.5 transition-colors z-10 p-1 rounded hover:bg-white/5",
                                    isLiked ? "text-neon-purple" : "hover:text-neon-purple"
                                )}
                            >
                                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-current")} />
                                <span>{likeCount}</span>
                            </button>
                            <button className="flex items-center space-x-1.5 hover:text-blue-400 transition-colors z-10 p-1 rounded hover:bg-white/5">
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>{post.comment_count || 0}</span>
                            </button>
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/post/${post.id}`;
                                    navigator.clipboard.writeText(url).then(() => {
                                        toast.success('链接已复制到剪贴板', {
                                            style: { background: '#0a0a14', color: '#00ffff', border: '1px solid rgba(0, 255, 255, 0.3)' },
                                        });
                                    }).catch(() => {
                                        toast.error('复制失败', {
                                            style: { background: '#0a0a14', color: '#ff6b6b', border: '1px solid rgba(255, 107, 107, 0.3)' },
                                        });
                                    });
                                }}
                                className="flex items-center space-x-1.5 hover:text-green-400 transition-colors z-10 p-1 rounded hover:bg-white/5"
                            >
                                <Share2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                        <button
                            onClick={handleBookmark}
                            className={cn(
                                "transition-colors z-10 p-1 rounded hover:bg-white/5",
                                isBookmarked ? "text-cyber-cyan" : "text-gray-400 hover:text-cyber-cyan"
                            )}
                        >
                            <Bookmark className={cn("w-3.5 h-3.5", isBookmarked && "fill-current")} />
                        </button>
                    </div>
                </div>

                {/* Modals */}
                <EditPostModal
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    post={post}
                />

                <ReportModal
                    isOpen={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    targetType="post"
                    targetId={post.id}
                />
            </CyberCard>
        </Link>
    );
};

export default PostCard;
