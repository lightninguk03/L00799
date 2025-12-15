import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api';
import type { PaginatedResponse, Notification } from '../api';

import CyberCard from '../components/ui/CyberCard';
import { Bell, Heart, MessageSquare, Repeat, User, CheckCheck } from 'lucide-react';
import { cn, getAvatarUrl } from '../lib/utils';
import { motion } from 'framer-motion';

const Notifications = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [page] = useState(1);

    const { data: paginatedData, isLoading } = useQuery<PaginatedResponse<Notification>>({
        queryKey: ['notifications', page],
        queryFn: async () => {
            const res = await api.get('/notifications/', { params: { page, page_size: 20 } });
            return res.data;
        }
    });

    const notifications = paginatedData?.items || [];

    const readMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.post(`/notifications/${id}/read`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
        }
    });

    const readAllMutation = useMutation({
        mutationFn: async () => {
            const res = await api.post('/notifications/read-all');
            return res.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['notificationCount'] });
            toast.success(`已标记 ${data.count || '所有'} 条通知为已读`, {
                style: {
                    background: '#0a0a14',
                    color: '#00ffff',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                },
            });
        }
    });

    // 点击通知跳转到相关内容
    const handleNotificationClick = (notif: Notification) => {
        if (!notif.is_read) {
            readMutation.mutate(notif.id);
        }
        if (notif.post_id) {
            navigate(`/post/${notif.post_id}`);
        } else if (notif.type === 'follow') {
            navigate(`/user/${notif.actor_id}`);
        }
    };

    const handleRead = (id: number) => {
        readMutation.mutate(id);
    };

    const handleReadAll = () => {
        readAllMutation.mutate();
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'like': return <Heart className="w-5 h-5 text-neon-purple fill-current" />;
            case 'comment': return <MessageSquare className="w-5 h-5 text-cyber-cyan" />;
            case 'repost': return <Repeat className="w-5 h-5 text-green-400" />;
            case 'follow': return <User className="w-5 h-5 text-yellow-400" />;
            default: return <Bell className="w-5 h-5 text-gray-400" />;
        }
    };

    const getMessage = (notif: Notification) => {
        switch (notif.type) {
            case 'like': return t('notifications.liked_your_post') || 'liked your post';
            case 'comment': return t('notifications.commented_on_post') || 'commented on your post';
            case 'repost': return t('notifications.reposted_your_post') || 'reposted your post';
            case 'follow': return t('notifications.started_following') || 'started following you';
            default: return 'interacted with you';
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-3">
                    <Bell className="w-8 h-8 text-cyber-cyan" />
                    <h1 className="text-3xl font-orbitron font-bold text-white tracking-wide">
                        {t('notifications.title') || 'SYSTEM LOGS'}
                    </h1>
                </div>
                <button
                    onClick={handleReadAll}
                    disabled={readAllMutation.isPending || notifications.length === 0}
                    className="flex items-center space-x-2 px-4 py-2 border border-cyber-cyan/30 rounded hover:bg-cyber-cyan/10 transition-colors text-sm text-cyber-cyan disabled:opacity-50 font-orbitron"
                >
                    <CheckCheck className="w-4 h-4" />
                    <span>{t('notifications.mark_all_read') || 'MARK ALL READ'}</span>
                </button>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <div className="w-12 h-12 border-4 border-neon-purple rounded-full animate-spin border-t-transparent"></div>
                </div>
            ) : notifications.length > 0 ? (
                <div className="space-y-4">
                    {notifications.map((notif) => (
                        <motion.div
                            key={notif.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <CyberCard
                                className={cn(
                                    "p-4 flex items-start space-x-4 transition-all duration-300 cursor-pointer",
                                    !notif.is_read ? "bg-neon-purple/10 border-neon-purple/50 shadow-[0_0_10px_rgba(138,43,226,0.15)]" : "opacity-70 hover:opacity-100"
                                )}
                                hoverEffect={true}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                {/* Actor Avatar */}
                                <div className="flex-shrink-0 relative">
                                    <div className="w-12 h-12 rounded-full bg-black border border-white/20 overflow-hidden">
                                        {notif.actor_avatar ? (
                                            <img src={getAvatarUrl(notif.actor_avatar) || ''} alt={notif.actor_username} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-800 text-xs font-orbitron">
                                                {notif.actor_id}
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 bg-[#050510] rounded-full p-1 border border-white/10">
                                        {getIcon(notif.type)}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-grow pt-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="text-white text-sm">
                                                <span className="font-bold text-cyber-cyan font-orbitron mr-2">{notif.actor_username}</span>
                                                <span className="text-gray-300">{getMessage(notif)}</span>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 font-mono">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </div>
                                        </div>
                                        {!notif.is_read && (
                                            <button
                                                onClick={() => handleRead(notif.id)}
                                                className="w-2 h-2 rounded-full bg-neon-purple animate-pulse hover:scale-150 transition-transform"
                                                title="Mark as read"
                                            />
                                        )}
                                    </div>
                                </div>
                            </CyberCard>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <CyberCard className="p-12 text-center border-dashed border-gray-700">
                    <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
                    <p className="text-gray-500 font-orbitron tracking-wider">NO NEW SIGNALS</p>
                </CyberCard>
            )}
        </div>
    );
};

export default Notifications;
