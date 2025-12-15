import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../api';
import type { PaginatedResponse, PostResponse, UserResponse } from '../api';

import PostCard from '../components/ui/PostCard';
import CyberCard from '../components/ui/CyberCard';
import { Search as SearchIcon, Users, FileText, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';

const Search = () => {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'posts' | 'users'>('posts');

    // Simple debounce logic
    useState(() => {
        const handler = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500);
        return () => clearTimeout(handler);
    });

    const { data: postsData, isLoading: postsLoading } = useQuery<PaginatedResponse<PostResponse>>({
        queryKey: ['search', 'posts', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery) return { total: 0, page: 1, page_size: 20, items: [] };
            const res = await api.get('/search/posts', { params: { q: debouncedQuery } });
            return res.data;
        },
        enabled: activeTab === 'posts' && !!debouncedQuery
    });

    const { data: usersData, isLoading: usersLoading } = useQuery<PaginatedResponse<UserResponse>>({
        queryKey: ['search', 'users', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery) return { total: 0, page: 1, page_size: 20, items: [] };
            const res = await api.get('/search/users', { params: { q: debouncedQuery } });
            return res.data;
        },
        enabled: activeTab === 'users' && !!debouncedQuery
    });

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 min-h-[80vh]">
            <h1 className="text-3xl font-orbitron font-bold text-white mb-8 flex items-center">
                <SearchIcon className="w-8 h-8 mr-3 text-neon-purple" />
                {t('search.title') || 'GLOBAL SEARCH'}
            </h1>

            {/* Search Input */}
            <div className="relative mb-8 group">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-cyber-cyan rounded-lg blur opacity-25 group-focus-within:opacity-75 transition-opacity duration-500"></div>
                <div className="relative bg-[#0a0a12] border border-white/10 rounded-lg flex items-center p-2">
                    <SearchIcon className="w-5 h-5 text-gray-400 ml-3 mr-3" />
                    <input
                        type="text"
                        className="bg-transparent border-none focus:ring-0 text-white w-full h-12 text-lg placeholder-gray-600 font-sans"
                        placeholder={t('search.placeholder') || "Search for signals or users..."}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-4 mb-8 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('posts')}
                    className={cn(
                        "pb-4 px-4 flex items-center space-x-2 font-orbitron tracking-wider transition-all relative",
                        activeTab === 'posts' ? "text-cyber-cyan" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <FileText className="w-4 h-4" />
                    <span>POSTS</span>
                    {activeTab === 'posts' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyber-cyan shadow-[0_0_10px_#00ffff]" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('users')}
                    className={cn(
                        "pb-4 px-4 flex items-center space-x-2 font-orbitron tracking-wider transition-all relative",
                        activeTab === 'users' ? "text-neon-purple" : "text-gray-500 hover:text-gray-300"
                    )}
                >
                    <Users className="w-4 h-4" />
                    <span>USERS</span>
                    {activeTab === 'users' && (
                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-neon-purple shadow-[0_0_10px_#8a2be2]" />
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {activeTab === 'posts' && (
                    <>
                        {postsLoading ? (
                            <div className="flex justify-center py-20">
                                <Loader2 className="w-10 h-10 text-cyber-cyan animate-spin" />
                            </div>
                        ) : postsData?.items && postsData.items.length > 0 ? (
                            <div className="columns-1 md:columns-2 gap-6 space-y-6">
                                {postsData.items.map(post => (
                                    <PostCard key={post.id} post={post} />
                                ))}
                            </div>
                        ) : debouncedQuery ? (
                            <div className="text-center text-gray-500 py-20 font-orbitron">NO SIGNALS FOUND</div>
                        ) : null}
                    </>
                )}

                {activeTab === 'users' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {usersLoading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <Loader2 className="w-10 h-10 text-neon-purple animate-spin" />
                            </div>
                        ) : usersData?.items && usersData.items.length > 0 ? (
                            usersData.items.map(user => (
                                <Link key={user.id} to={`/profile/${user.id}`}>
                                    <CyberCard className="p-4 flex items-center space-x-4 hover:border-neon-purple/50 transition-colors cursor-pointer">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-purple to-cyber-cyan p-[1px]">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-orbitron text-xs">
                                                    {user.id}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-bold font-orbitron">{user.username}</h3>
                                            <p className="text-xs text-gray-400">ID: {user.id}</p>
                                        </div>
                                    </CyberCard>
                                </Link>
                            ))
                        ) : debouncedQuery ? (
                            <div className="col-span-full text-center text-gray-500 py-20 font-orbitron">NO USERS FOUND</div>
                        ) : null}
                    </div>
                )}

                {!debouncedQuery && (
                    <div className="text-center text-gray-600 py-20">
                        <p className="font-orbitron text-sm tracking-widest opacity-50">Please enter keywords to search the database...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Search;
