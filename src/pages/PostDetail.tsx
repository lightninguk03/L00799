import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { PostResponse, CommentResponse } from '../api';
import { ArrowLeft, Send, Heart, Share2, MoreHorizontal, User, Bookmark } from 'lucide-react';
import { cn, getMediaUrl, getAvatarUrl } from '../lib/utils';
import NeonButton from '../components/ui/NeonButton';
import { motion } from 'framer-motion';

const PostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState('');

    const { data: post, isLoading: postLoading } = useQuery<PostResponse>({
        queryKey: ['post', id],
        queryFn: async () => (await api.get(`/posts/${id}`)).data,
        enabled: !!id
    });

    const { data: comments, isLoading: commentsLoading } = useQuery<CommentResponse[]>({
        queryKey: ['comments', id],
        queryFn: async () => (await api.get(`/posts/${id}/comments`)).data,
        enabled: !!id
    });

    const commentMutation = useMutation({
        mutationFn: (content: string) => api.post(`/posts/${id}/comments`, { content }),
        onMutate: async (content: string) => {
            // 取消正在进行的评论查询
            await queryClient.cancelQueries({ queryKey: ['comments', id] });
            
            // 获取当前评论列表快照
            const previousComments = queryClient.getQueryData<CommentResponse[]>(['comments', id]);
            
            // 乐观更新：立即添加新评论到列表
            const optimisticComment: CommentResponse = {
                id: Date.now(), // 临时ID
                post_id: Number(id),
                user_id: 0, // 当前用户ID，后端会返回真实值
                content: content,
                created_at: new Date().toISOString(),
            };
            
            queryClient.setQueryData<CommentResponse[]>(['comments', id], (old) => 
                old ? [...old, optimisticComment] : [optimisticComment]
            );
            
            return { previousComments };
        },
        onError: (_err, _content, context) => {
            // 出错时回滚到之前的状态
            if (context?.previousComments) {
                queryClient.setQueryData(['comments', id], context.previousComments);
            }
        },
        onSettled: () => {
            // 无论成功失败，都重新获取最新数据以确保同步
            queryClient.invalidateQueries({ queryKey: ['comments', id] });
        },
        onSuccess: () => {
            setCommentText('');
        }
    });

    const [isLiked, setIsLiked] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);

    // Sync state when data loads
    React.useEffect(() => {
        if (post) {
            setIsLiked(post.is_liked || false);
            setIsBookmarked(post.is_collected || false);
        }
    }, [post]);

    const interactMutation = useMutation({
        mutationFn: async (type: 'like' | 'bookmark') => {
            if (!id) return;
            await api.post(`/posts/${id}/interact`, { interaction_type: type });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['post', id] });
        }
    });

    const handleLike = () => {
        setIsLiked(!isLiked);
        interactMutation.mutate('like');
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        interactMutation.mutate('bookmark');
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        commentMutation.mutate(commentText);
    };

    if (postLoading) return (
        <div className="flex items-center justify-center h-[70vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-neon-purple"></div>
        </div>
    );

    if (!post) {
        return <div className="pt-20 text-center">Post not found</div>;
    }

    // Media parsing - 使用工具函数兼容数组和字符串格式
    let imageUrl = getMediaUrl(post.media_urls);
    if (!imageUrl && post.media_type === 'image') {
        imageUrl = 'https://placehold.co/800x600/050510/8a2be2?text=No+Image';
    }

    // --- Layout ---
    return (
        <div className="flex flex-col lg:flex-row lg:h-[80vh] bg-glass-black/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">

            {/* --- Left Column: Media (Desktop) / Top (Mobile) --- */}
            <div className="w-full lg:w-2/3 bg-black flex items-center justify-center relative group overflow-hidden">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-neon-purple/60 text-white hover:bg-neon-purple hover:border-neon-purple transition-all backdrop-blur-md shadow-[0_0_15px_rgba(138,43,226,0.3)] hover:shadow-[0_0_20px_rgba(138,43,226,0.6)]"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-orbitron">返回</span>
                </button>

                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt="Post Content"
                        className="max-h-[60vh] lg:max-h-full w-auto object-contain transition-transform duration-700 hover:scale-105"
                    />
                ) : (
                    <div className="p-10 text-center text-gray-500 font-orbitron">TEXT ONLY MODE</div>
                )}

                {/* Immersive Overlay Gradient */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none lg:hidden" />
            </div>

            {/* --- Right Column: Interaction --- */}
            <div className="w-full lg:w-1/3 flex flex-col bg-[#0a0a0f] border-l border-white/5">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-purple to-cyber-cyan p-[1px]">
                            <div className="w-full h-full rounded-full bg-[#050510] flex items-center justify-center overflow-hidden">
                                {post.user?.avatar ? (
                                    <img src={getAvatarUrl(post.user.avatar) || ''} alt={post.user.username} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-5 h-5 text-gray-400" />
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white font-orbitron">{post.user?.username || `User ${post.user_id}`}</h3>
                            <p className="text-xs text-cyber-cyan">@{post.user?.username || post.user_id} • Agent</p>
                        </div>
                    </div>
                    <button className="text-gray-400 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <p className="text-gray-300 text-sm leading-relaxed mb-6 font-sans">
                        {post.content}
                        <div className="text-[10px] text-gray-600 mt-2 font-mono uppercase">{new Date(post.created_at).toLocaleString()}</div>
                    </p>

                    <div className="border-t border-white/5 pt-4">
                        <h4 className="text-xs font-bold text-gray-400 font-orbitron mb-4">COMMENTS PROTOCOL</h4>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {commentsLoading && <div className="text-center text-xs text-gray-600 animate-pulse">Scanning...</div>}
                            {comments?.map(comment => (
                                <motion.div 
                                    key={comment.id} 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="flex space-x-3 group"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-800 flex-shrink-0 flex items-center justify-center text-[10px] text-white font-orbitron">
                                        {comment.user_id}
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white/5 p-3 rounded-lg rounded-tl-none hover:bg-white/10 transition-colors">
                                            <span className="text-xs text-cyber-cyan block mb-1 font-bold">User {comment.user_id}</span>
                                            <p className="text-xs text-gray-300">{comment.content}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                            {comments?.length === 0 && (
                                <div className="text-center py-6 text-gray-600 text-xs">NO DATA FOUND INITIALIZE FIRST</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Actions Bar */}
                <div className="p-3 border-t border-white/5 flex items-center justify-between text-gray-400">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={handleLike}
                            className={cn(
                                "flex items-center space-x-1 transition-colors",
                                isLiked ? "text-neon-purple" : "hover:text-neon-purple"
                            )}
                        >
                            <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                            <span className="text-xs">{post.like_count || 0}</span>
                        </button>

                        <button
                            onClick={handleBookmark}
                            className={cn(
                                "flex items-center space-x-1 transition-colors",
                                isBookmarked ? "text-cyber-cyan" : "hover:text-cyber-cyan"
                            )}
                        >
                            <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                        </button>

                        <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="flex items-center space-x-1 hover:text-white transition-colors">
                            <Share2 className="w-5 h-5" />
                            <span className="text-xs">Share</span>
                        </button>
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <form onSubmit={handleSend} className="flex items-center space-x-2">
                        <input
                            type="text"
                            value={commentText}
                            onChange={e => setCommentText(e.target.value)}
                            placeholder="Transmit message..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-purple focus:ring-1 focus:ring-neon-purple transition-all placeholder-gray-600"
                        />
                        <NeonButton
                            type="submit"
                            className="!rounded-full !px-3 !py-2 !bg-neon-purple/20 hover:!bg-neon-purple border !border-neon-purple text-neon-purple hover:text-white"
                            disabled={commentMutation.isPending}
                        >
                            <Send className="w-4 h-4" />
                        </NeonButton>
                    </form>
                </div>

            </div>
        </div>
    );
};

export default PostDetail;
