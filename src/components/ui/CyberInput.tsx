/**
 * 赛博朋克风格输入框组件
 * 聚焦时霓虹边框 + 上浮效果
 */

import React from 'react';
import { cn } from '../../lib/utils';

interface CyberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const CyberInput = React.forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-orbitron text-gray-400 mb-2 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative group">
          {/* 霓虹光晕背景 */}
          <div className="absolute -inset-0.5 bg-gradient-to-r from-neon-purple to-cyber-cyan rounded-lg opacity-0 group-focus-within:opacity-50 blur transition-opacity duration-300" />
          
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-cyber-cyan transition-colors">
                {icon}
              </div>
            )}
            <input
              ref={ref}
              className={cn(
                "w-full bg-glass-black/60 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500",
                "focus:outline-none focus:border-cyber-cyan/50 focus:ring-1 focus:ring-cyber-cyan/30",
                "focus:-translate-y-0.5 transition-all duration-300",
                "hover:border-white/20",
                icon && "pl-10",
                error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/30",
                className
              )}
              {...props}
            />
          </div>
        </div>
        {error && (
          <p className="mt-1 text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

CyberInput.displayName = "CyberInput";

export default CyberInput;
