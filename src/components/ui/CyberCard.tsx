import React, { useState } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface CyberCardProps extends Omit<HTMLMotionProps<"div">, 'children'> {
    children?: React.ReactNode;
    hoverEffect?: boolean;
    chamfered?: boolean;       // 是否使用切角 (默认 true)
    glass?: boolean;           // 是否启用强玻璃拟态
    variant?: 'default' | 'outline' | 'ghost';
}

// 切角 clip-path 样式
const CHAMFER_CLIP_PATH = 'polygon(0 10px, 10px 0, calc(100% - 10px) 0, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0 calc(100% - 10px))';

const CyberCard = React.forwardRef<HTMLDivElement, CyberCardProps>(
    ({ className, children, hoverEffect = true, chamfered = true, glass = true, variant = 'default', ...props }, ref) => {
        const [isHovered, setIsHovered] = useState(false);

        return (
            <motion.div
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-300",
                    // Base Structure
                    chamfered ? "clip-path-chamfer" : "rounded-xl",
                    glass && "backdrop-blur-xl bg-glass-black/80",

                    // Variants
                    variant === 'default' && "border border-white/5 shadow-lg",
                    variant === 'outline' && "border border-lightning-cyan/30 bg-transparent",

                    // Hover State
                    hoverEffect && "hover:border-lightning-cyan/50 hover:shadow-[0_0_30px_rgba(0,243,255,0.2)]",

                    className
                )}
                style={chamfered ? { clipPath: CHAMFER_CLIP_PATH } : undefined}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                {...props}
            >
                {/* 动态背景流光 */}
                <div className="absolute inset-0 -z-10 bg-gradient-to-br from-soul-purple/5 via-transparent to-lightning-cyan/5 opacity-50" />

                {/* 装饰性角标 (HUD Corner Markers) */}
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-lightning-cyan/50 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-lightning-cyan/50 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-lightning-cyan/50 opacity-50 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-lightning-cyan/50 opacity-50 group-hover:opacity-100 transition-opacity" />

                {/* Glitch Overlay Effect on Hover */}
                {hoverEffect && isHovered && (
                    <div className="absolute inset-0 pointer-events-none z-0 mix-blend-overlay opacity-20 animate-pulse">
                        <div className="w-full h-full bg-repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 2px,
                            #00F3FF 3px
                        )" />
                    </div>
                )}

                <div className="relative z-10">
                    {children}
                </div>
            </motion.div>
        );
    }
);

CyberCard.displayName = "CyberCard";

export default CyberCard;
