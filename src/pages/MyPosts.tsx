import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../api';
import type { PostResponse, PaginatedResponse } from '../api';

import CyberCard from '../components/ui/CyberCard';
import { Heart, MessageSquare } from 'lucide-react';

const MyPosts = () => {
    const { t } = useTranslation();

    const { data: paginatedData, isLoading } = useQuery<PaginatedResponse<PostResponse>>({
        queryKey: ['myPosts'],
        queryFn: async () => {
            // Backend V2.0 added dedicated /posts/me endpoint
            const res = await api.get('/posts/me');
            return res.data;
        }
    });

    const posts = paginatedData?.items || [];

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-orbitron font-bold text-white mb-6">{t('profile.my_posts.title')}</h1>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-neon-purple rounded-full animate-spin border-t-transparent"></div>
                </div>
            ) : posts && posts.length > 0 ? (
                <div className="space-y-4">
                    {posts.map(post => (
                        <Link key={post.id} to={`/post/${post.id}`}>
                            <CyberCard className="p-6 hover:bg-white/5 transition-colors">
                                <p className="text-white mb-4">{post.content}</p>
                                <div className="flex items-center space-x-6 text-sm text-gray-400">
                                    <span className="flex items-center space-x-1">
                                        <Heart className="w-4 h-4" />
                                        <span>{post.like_count || 0}</span>
                                    </span>
                                    <span className="flex items-center space-x-1">
                                        <MessageSquare className="w-4 h-4" />
                                        <span>0</span>
                                    </span>
                                    <span className="text-xs">{new Date(post.created_at).toLocaleDateString()}</span>
                                </div>
                            </CyberCard>
                        </Link>
                    ))}
                </div>
            ) : (
                <CyberCard className="p-8 text-center">
                    <p className="text-gray-400">暂无发布内容</p>
                </CyberCard>
            )}
        </div>
    );
};

export default MyPosts;
