import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api';
import { X, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CreatePostModal = ({ isOpen, onClose, onSuccess }: CreatePostModalProps) => {
    const queryClient = useQueryClient();
    const [content, setContent] = useState('');
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const dropRef = useRef<HTMLDivElement>(null);

    // 重置表单状态（仅在成功发布后调用）
    const resetForm = () => {
        setContent('');
        setSelectedImages([]);
        setPreviewUrls([]);
    };

    // 关闭模态框（成功时重置，失败时保留）
    const handleClose = (shouldReset: boolean = false) => {
        if (shouldReset) {
            resetForm();
        }
        onClose();
    };

    const createPostMutation = useMutation({
        mutationFn: async () => {
            const formData = new FormData();
            formData.append('content', content);
            selectedImages.forEach(img => formData.append('files', img));
            await api.post('/posts/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            // 显示成功提示（世界观术语）
            toast.success('记忆碎片已上传', {
                style: {
                    background: 'rgba(10, 10, 20, 0.95)',
                    color: '#00ffff',
                    border: '1px solid rgba(0, 255, 255, 0.3)',
                },
                iconTheme: {
                    primary: '#00ffff',
                    secondary: '#0a0a14',
                },
            });
            handleClose(true); // 成功时重置表单
            onSuccess?.();
        },
        onError: () => {
            // 显示错误提示（世界观术语），保留用户输入
            toast.error('神经链路中断，请重试', {
                style: {
                    background: 'rgba(10, 10, 20, 0.95)',
                    color: '#ff4444',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                },
                iconTheme: {
                    primary: '#ff4444',
                    secondary: '#0a0a14',
                },
            });
            // 不关闭模态框，不清空用户输入
        }
    });

    const handleImageSelect = (files: FileList | null) => {
        if (!files) return;
        const fileArray = Array.from(files);
        setSelectedImages(prev => [...prev, ...fileArray]);
        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => setPreviewUrls(prev => [...prev, reader.result as string]);
            reader.readAsDataURL(file);
        });
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleImageSelect(e.dataTransfer.files);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => handleClose(false)}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    />

                    {/* Modal Container - New Transmission Protocol Style with 3D Perspective */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0, rotateX: 15, y: 50 }}
                        animate={{ scale: 1, opacity: 1, rotateX: 0, y: 0 }}
                        exit={{ scale: 0.8, opacity: 0, rotateX: -15, y: 50 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        style={{ perspective: "1000px", transformStyle: "preserve-3d" }}
                        className="relative w-full max-w-3xl bg-[#0a0a12]/95 border border-cyber-cyan/30 rounded-lg overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.15)]"
                    >
                        {/* Decorative Top Corners */}
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-cyan z-10" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-cyan z-10" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-cyan z-10" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-cyan z-10" />

                        {/* Title Bar - Purple Bar Accent */}
                        <div className="flex items-center justify-between p-6 border-b border-white/5 relative bg-gradient-to-r from-neon-purple/20 to-transparent">
                            <div className="flex items-center space-x-4">
                                <div className="w-1 h-8 bg-neon-purple shadow-[0_0_10px_#8a2be2]" />
                                <div>
                                    <h2 className="text-xl font-orbitron font-bold text-white tracking-widest uppercase">
                                        新情报传输
                                    </h2>
                                    <span className="text-[10px] text-cyber-cyan font-mono tracking-[0.2em] block">
                                        NEW TRANSMISSION PROTOCOL
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => handleClose(false)}
                                className="text-gray-400 hover:text-white transition-colors hover:rotate-90 duration-300"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 relative">
                            {/* Subtle background noise/texture could go here via CSS classes */}

                            <div className="space-y-6 relative z-10">
                                {/* Text Input */}
                                <div className="space-y-2">
                                    <label className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                                        Subject / Content
                                    </label>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="输入情报内容 / Protocol Message..."
                                        className="w-full h-32 bg-black/50 border border-white/10 rounded-none p-4 text-white placeholder-gray-600 focus:outline-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/50 transition-all font-sans resize-none"
                                    />
                                </div>

                                {/* Drag & Drop Zone */}
                                <div
                                    ref={dropRef}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                    className={cn(
                                        "relative border-2 border-dashed rounded-lg p-8 transition-all duration-300 flex flex-col items-center justify-center text-center cursor-pointer group bg-black/30",
                                        isDragging
                                            ? "border-cyber-cyan bg-cyber-cyan/10 scale-[1.02]"
                                            : "border-white/10 hover:border-white/30"
                                    )}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => handleImageSelect(e.target.files)}
                                    />
                                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:bg-cyber-cyan/20 transition-colors">
                                        <Upload className={cn("w-8 h-8 text-gray-400 group-hover:text-cyber-cyan transition-colors", isDragging && "animate-bounce")} />
                                    </div>
                                    <p className="text-sm text-gray-300 font-orbitron mb-1">
                                        拖拽文件到这里 / DRAG FILES HERE
                                    </p>
                                    <p className="text-xs text-gray-500 font-mono">
                                        Supported Formats: JPG, PNG, WEBP
                                    </p>
                                </div>

                                {/* Preview Grid */}
                                {previewUrls.length > 0 && (
                                    <div className="grid grid-cols-4 gap-4 mt-4">
                                        {previewUrls.map((url, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={url} alt="" className="w-full h-full object-cover border border-white/20" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        onClick={() => removeImage(i)}
                                                        className="text-red-500 hover:text-white"
                                                    >
                                                        <X className="w-6 h-6" />
                                                    </button>
                                                </div>
                                                <div className="absolute top-0 left-0 bg-cyber-cyan text-black text-[10px] font-bold px-1 font-mono">
                                                    IMG_{i + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer / Action Bar */}
                        <div className="p-6 border-t border-white/5 bg-black/40 flex justify-end items-center space-x-4">
                            <span className="text-xs text-gray-600 font-mono mr-auto">
                                SYSTEM_STATUS: {createPostMutation.isPending ? 'UPLOADING...' : 'READY'}
                            </span>

                            <button
                                onClick={() => handleClose(false)}
                                className="px-6 py-3 text-sm font-orbitron text-gray-400 hover:text-white transition-colors uppercase tracking-wider"
                            >
                                Cancel / 取消
                            </button>

                            <button
                                onClick={() => createPostMutation.mutate()}
                                disabled={!content.trim() || createPostMutation.isPending}
                                className="relative group overflow-hidden px-8 py-3 bg-gradient-to-r from-neon-purple to-cyber-cyan text-white font-bold font-orbitron tracking-widest uppercase skew-x-[-10deg] hover:shadow-[0_0_20px_rgba(0,255,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="block skew-x-[10deg]">
                                    {createPostMutation.isPending ? 'TRANSMITTING...' : 'TRANSMIT DATA / 发布情报'}
                                </span>
                                <div className="absolute top-0 left-0 w-full h-full bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CreatePostModal;
