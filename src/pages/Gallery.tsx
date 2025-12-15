import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';

import CyberCard from '../components/ui/CyberCard';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn } from 'lucide-react';

// Mock types since API definition was empty in OAS
interface Category {
    id: number;
    name: string;
    slug: string;
}

interface GalleryImage {
    id: number;
    url: string;
    title?: string;
}

// 图片预览模态框组件
const ImagePreviewModal = ({
    images,
    currentIndex,
    onClose,
    onPrev,
    onNext
}: {
    images: GalleryImage[];
    currentIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}) => {
    const currentImage = images[currentIndex];

    // 键盘导航
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, onPrev, onNext]);

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = currentImage.url;
        link.download = currentImage.title || `image-${currentImage.id}`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center"
            onClick={onClose}
        >
            {/* 关闭按钮 */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
            >
                <X className="w-6 h-6" />
            </button>

            {/* 下载按钮 */}
            <button
                onClick={(e) => { e.stopPropagation(); handleDownload(); }}
                className="absolute top-4 right-16 p-2 text-white/70 hover:text-cyber-cyan bg-white/10 rounded-full transition-colors z-10"
            >
                <Download className="w-6 h-6" />
            </button>

            {/* 图片计数 */}
            <div className="absolute top-4 left-4 text-white/70 font-mono text-sm z-10">
                {currentIndex + 1} / {images.length}
            </div>

            {/* 上一张 */}
            {currentIndex > 0 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onPrev(); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                >
                    <ChevronLeft className="w-8 h-8" />
                </button>
            )}

            {/* 下一张 */}
            {currentIndex < images.length - 1 && (
                <button
                    onClick={(e) => { e.stopPropagation(); onNext(); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white bg-white/10 rounded-full transition-colors z-10"
                >
                    <ChevronRight className="w-8 h-8" />
                </button>
            )}

            {/* 图片 */}
            <motion.img
                key={currentImage.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                src={currentImage.url}
                alt={currentImage.title || 'Gallery Image'}
                className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />

            {/* 图片标题 */}
            {currentImage.title && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 font-orbitron text-sm bg-black/50 px-4 py-2 rounded-full">
                    {currentImage.title}
                </div>
            )}
        </motion.div>
    );
};

const Gallery = () => {
    const { t } = useTranslation();
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [previewIndex, setPreviewIndex] = useState<number | null>(null);

    const handleOpenPreview = useCallback((index: number) => {
        setPreviewIndex(index);
    }, []);

    const handleClosePreview = useCallback(() => {
        setPreviewIndex(null);
    }, []);

    const handlePrevImage = useCallback(() => {
        setPreviewIndex(prev => prev !== null && prev > 0 ? prev - 1 : prev);
    }, []);

    const handleNextImage = useCallback(() => {
        setPreviewIndex(prev => prev !== null ? prev + 1 : prev);
    }, []);

    // Fetch Categories
    const { data: categories } = useQuery<Category[]>({
        queryKey: ['gallery-categories'],
        queryFn: async () => {
            const res = await api.get('/gallery/categories');
            // If API returns dict or something else, handle it. Assuming list for now.
            // If empty (mocking for dev if server empty)
            if (!res.data || (Array.isArray(res.data) && res.data.length === 0)) {
                return [
                    { id: 1, name: t('gallery.categories.edgerunners'), slug: 'edgerunners' },
                    { id: 2, name: t('gallery.categories.gits'), slug: 'gits' },
                    { id: 3, name: t('gallery.categories.akira'), slug: 'akira' },
                    { id: 4, name: t('gallery.categories.blade_runner'), slug: 'blade-runner' },
                    { id: 5, name: t('gallery.categories.eva'), slug: 'eva' },
                ];
            }
            return res.data;
        }
    });

    // Default to first category if available and none selected
    useEffect(() => {
        if (categories && categories.length > 0 && selectedCategory === null) {
            setSelectedCategory(categories[0].id);
        }
    }, [categories]);

    // Fetch Images
    const { data: images, isLoading } = useQuery<GalleryImage[]>({
        queryKey: ['gallery', selectedCategory],
        queryFn: async () => {
            if (selectedCategory === null) return [];
            try {
                const res = await api.get(`/gallery/${selectedCategory}`);
                const data = res.data;
                if (Array.isArray(data)) return data;
                if (data && Array.isArray(data.images)) return data.images;
                if (data && Array.isArray(data.data)) return data.data; // Common pagination wrapper
                return []; // Fallback to empty array if format is unrecognized
            } catch (e) {
                console.error("Failed to fetch gallery images", e);
                // Fallback mock if API fails/not ready
                return Array.from({ length: 12 }).map((_, i) => ({
                    id: i,
                    url: `https://placehold.co/600x${400 + (i % 3) * 100}/050510/8a2be2?text=img-${selectedCategory}-${i}`
                }));
            }
        },
        enabled: selectedCategory !== null
    });

    return (
        <>
        <div className="mb-8 text-center md:text-left">
            <h1 className="text-4xl font-orbitron font-black text-white mb-2 tracking-widest uppercase">
                {t('gallery.title')}
            </h1>
            <p className="text-cyber-cyan text-xs font-mono">{t('gallery.subtitle')}</p>
        </div>

        {/* Category Filter */}
        <div className="mb-8 overflow-x-auto pb-4 hide-scrollbar">
        <div className="flex space-x-4 min-w-max px-2">
            {categories?.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={cn(
                        "px-6 py-2 rounded-full border text-sm font-orbitron tracking-wider transition-all duration-300",
                        "bg-transparent border-white/20 text-gray-400 hover:border-cyber-cyan hover:text-cyber-cyan",
                        selectedCategory === cat.id && "bg-neon-purple border-neon-purple text-white shadow-[0_0_15px_rgba(138,43,226,0.5)]"
                    )}
                >
                    {cat.name}
                </button>
            ))}
        </div>
        </div>

        {/* Gallery Grid */}
        {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl"></div>
                ))}
            </div>
        ) : (
            <motion.div
                layout
                className="columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4"
            >
                <AnimatePresence>
                    {images?.map((img, index) => (
                        <motion.div
                            key={img.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            transition={{ duration: 0.3 }}
                            className="break-inside-avoid cursor-pointer"
                            onClick={() => handleOpenPreview(index)}
                        >
                            <CyberCard className="p-0 overflow-hidden group border-0 bg-transparent" hoverEffect={false}>
                                <div className="relative overflow-hidden rounded-xl">
                                    <img
                                        src={img.url}
                                        alt={img.title || 'Gallery Image'}
                                        className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                        <ZoomIn className="w-8 h-8 text-cyber-cyan" />
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <p className="text-cyber-cyan text-xs font-mono truncate">{img.title || `IMG_${img.id}.webp`}</p>
                                    </div>
                                </div>
                            </CyberCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>
        )}

        {!isLoading && images?.length === 0 && (
            <div className="text-center py-20 text-gray-500 font-orbitron">
                {t('gallery.empty')}
            </div>
        )}

        {/* 图片预览模态框 */}
        <AnimatePresence>
            {previewIndex !== null && images && images.length > 0 && (
                <ImagePreviewModal
                    images={images}
                    currentIndex={previewIndex}
                    onClose={handleClosePreview}
                    onPrev={handlePrevImage}
                    onNext={handleNextImage}
                />
            )}
        </AnimatePresence>
        </>
    );
};

export default Gallery;
