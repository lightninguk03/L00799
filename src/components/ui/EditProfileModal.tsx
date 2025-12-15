import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Camera, User, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api';
import type { UserResponse } from '../../api';
import NeonButton from './NeonButton';
import { getAvatarUrl } from '../../lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [username, setUsername] = useState(user?.username || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // 更新用户名
  const updateUsernameMutation = useMutation({
    mutationFn: async (newUsername: string) => {
      const res = await api.put('/auth/me', { username: newUsername });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('用户名更新成功', {
        style: {
          background: '#0a0a14',
          color: '#00ffff',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        },
      });
    },
    onError: () => {
      toast.error('用户名更新失败', {
        style: {
          background: '#0a0a14',
          color: '#ff6b6b',
          border: '1px solid rgba(255, 107, 107, 0.3)',
        },
      });
    },
  });

  // 上传头像
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);  // 后端期望字段名为 'file'
      const res = await api.post('/auth/me/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('头像更新成功', {
        style: {
          background: '#0a0a14',
          color: '#00ffff',
          border: '1px solid rgba(0, 255, 255, 0.3)',
        },
      });
      setAvatarFile(null);
      setAvatarPreview(null);
    },
    onError: () => {
      toast.error('头像上传失败', {
        style: {
          background: '#0a0a14',
          color: '#ff6b6b',
          border: '1px solid rgba(255, 107, 107, 0.3)',
        },
      });
    },
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        toast.error('请选择图片文件', {
          style: {
            background: '#0a0a14',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 107, 107, 0.3)',
          },
        });
        return;
      }
      // 验证文件大小 (最大 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过 5MB', {
          style: {
            background: '#0a0a14',
            color: '#ff6b6b',
            border: '1px solid rgba(255, 107, 107, 0.3)',
          },
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 更新用户名
    if (username && username !== user?.username) {
      await updateUsernameMutation.mutateAsync(username);
    }
    
    // 上传头像
    if (avatarFile) {
      await uploadAvatarMutation.mutateAsync(avatarFile);
    }
    
    onClose();
  };

  const isLoading = updateUsernameMutation.isPending || uploadAvatarMutation.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", bounce: 0.3 }}
            className="fixed inset-0 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-md bg-[#0a0a14]/95 backdrop-blur-xl border border-neon-purple/50 rounded-2xl shadow-[0_0_50px_rgba(138,43,226,0.2)] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-white/10 bg-gradient-to-r from-neon-purple/20 to-transparent flex items-center justify-between">
                <h2 className="text-xl font-orbitron font-bold text-white">编辑资料</h2>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-r from-neon-purple to-cyber-cyan">
                      <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Preview" className="w-full h-full object-cover" />
                        ) : user?.avatar ? (
                          <img 
                            src={getAvatarUrl(user.avatar) || ''} 
                            alt={user.username} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <User className="w-12 h-12 text-gray-400" />
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-cyber-cyan text-black flex items-center justify-center hover:bg-cyber-cyan/80 transition-colors"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <p className="text-gray-500 text-xs mt-2">点击相机图标更换头像</p>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-mono text-cyber-cyan mb-2">
                    用户名
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="输入新用户名"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyber-cyan focus:ring-1 focus:ring-cyber-cyan/50 transition-all placeholder-gray-500 font-mono"
                    maxLength={20}
                  />
                  <p className="text-gray-500 text-xs mt-1">最多 20 个字符</p>
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-mono text-gray-400 mb-2">
                    邮箱 (不可修改)
                  </label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-gray-500 font-mono cursor-not-allowed"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 border border-white/20 rounded-xl text-gray-400 hover:text-white hover:border-white/40 transition-all font-mono"
                  >
                    取消
                  </button>
                  <NeonButton
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        保存中...
                      </span>
                    ) : (
                      '保存修改'
                    )}
                  </NeonButton>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EditProfileModal;
