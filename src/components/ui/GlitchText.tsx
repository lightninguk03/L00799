import React from 'react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

interface GlitchTextProps {
    text: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    as?: 'h1' | 'h2' | 'h3' | 'h4' | 'div' | 'span';
}

const GlitchText: React.FC<GlitchTextProps> = ({
    text,
    className,
    size = 'md',
    as: Component = 'div'
}) => {

    // Size mapping using Tailwind classes
    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-4xl",
        xl: "text-6xl",
        '2xl': "text-8xl",
    };

    return (
        <div className="relative inline-block group">
            <Component
                className={cn(
                    "relative z-10 font-orbitron font-bold text-white mix-blend-screen",
                    sizeClasses[size],
                    className
                )}
            >
                {text}
            </Component>

            {/* Red Channel Shift */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute top-0 left-0 -z-10 w-full h-full text-lightning-cyan opacity-0 group-hover:opacity-70 animate-glitch",
                    "font-orbitron font-bold",
                    sizeClasses[size],
                    className
                )}
                style={{ clipPath: 'inset(40% 0 61% 0)' }}
            >
                {text}
            </span>

            {/* Blue Channel Shift */}
            <span
                aria-hidden="true"
                className={cn(
                    "absolute top-0 left-0 -z-10 w-full h-full text-soul-purple opacity-0 group-hover:opacity-70 animate-glitch",
                    "font-orbitron font-bold",
                    sizeClasses[size],
                    className
                )}
                style={{ animationDirection: 'reverse', clipPath: 'inset(10% 0 70% 0)' }}
            >
                {text}
            </span>
        </div>
    );
};

export default GlitchText;
