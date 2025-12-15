import { useTranslation } from 'react-i18next';

import CyberCard from '../components/ui/CyberCard';
import { Heart, Bookmark, MessageSquare, TrendingUp } from 'lucide-react';

const Activity = () => {
    const { t } = useTranslation();

    return (
        <div className="max-w-4xl mx-auto p-6">
            <h1 className="text-3xl font-orbitron font-bold text-white mb-6">{t('profile.activity.title')}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <CyberCard className="p-6 text-center">
                    <Heart className="w-8 h-8 text-neon-purple mx-auto mb-2" />
                    <div className="text-2xl font-orbitron font-bold text-white">0</div>
                    <div className="text-sm text-gray-400">点赞</div>
                </CyberCard>

                <CyberCard className="p-6 text-center">
                    <Bookmark className="w-8 h-8 text-cyber-cyan mx-auto mb-2" />
                    <div className="text-2xl font-orbitron font-bold text-white">0</div>
                    <div className="text-sm text-gray-400">收藏</div>
                </CyberCard>

                <CyberCard className="p-6 text-center">
                    <MessageSquare className="w-8 h-8 text-pink-500 mx-auto mb-2" />
                    <div className="text-2xl font-orbitron font-bold text-white">0</div>
                    <div className="text-sm text-gray-400">评论</div>
                </CyberCard>
            </div>

            <CyberCard className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">暂无活动记录</p>
                <p className="text-gray-500 text-sm mt-2">开始互动以查看活动历史</p>
            </CyberCard>
        </div>
    );
};

export default Activity;
