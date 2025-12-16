import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../lib/utils';

interface NeonButtonProps extends HTMLMotionProps<"button"> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    glow?: boolean;
}

const NeonButton = React.forwardRef<HTMLButtonElement, NeonButtonProps>(
    ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {

        const sizes = {
            sm: "px-4 py-1 text-xs",
            md: "px-6 py-2 text-sm",
            lg: "px-8 py-3 text-base",
        };

        const variants = {
            primary: "bg-lightning-cyan text-black font-bold border border-transparent hover:bg-white hover:shadow-[0_0_20px_#00F3FF]",
            secondary: "bg-soul-purple text-white border border-transparent hover:bg-white hover:text-soul-purple hover:shadow-[0_0_20px_#BC13FE]",
            outline: "bg-transparent border border-lightning-cyan text-lightning-cyan hover:bg-lightning-cyan/10 hover:shadow-[0_0_15px_rgba(0,243,255,0.4)]",
            ghost: "bg-transparent border border-transparent text-white/70 hover:text-white hover:bg-white/5",
        };

        return (
            <motion.button
                ref={ref}
                className={cn(
                    "relative font-orbitron tracking-wider uppercase transition-all duration-300 overflow-hidden group",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    // Clip path for futuristic edge
                    "clip-path-slanted",
                    sizes[size],
                    variants[variant],
                    className
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                {...props}
            >
                {/* 扫描线光效 */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-[200%] group-hover:translate-x-[200%] transition-transform duration-700 ease-out skew-x-12" />

                <span className="relative z-10 flex items-center justify-center gap-2">
                    {children as React.ReactNode}
                </span>
            </motion.button>
        );
    }
);

NeonButton.displayName = "NeonButton";

export default NeonButton;
