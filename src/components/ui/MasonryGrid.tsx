import React from 'react';
import { cn } from '../../lib/utils';

interface MasonryGridProps {
  children: React.ReactNode;
  className?: string;
  gap?: number; // 间距 (默认 24px)
}

/**
 * 瀑布流布局组件
 * 使用 CSS columns 实现响应式瀑布流
 * - mobile: 1列
 * - tablet: 2列  
 * - desktop: 3-4列
 */
const MasonryGrid: React.FC<MasonryGridProps> = ({ 
  children, 
  className,
  gap = 24 
}) => {
  return (
    <div 
      className={cn(
        // 响应式列数 + 防止裁剪
        "columns-1 sm:columns-2 lg:columns-3 xl:columns-4 overflow-visible",
        className
      )}
      style={{ 
        columnGap: `${gap}px`,
      }}
    >
      {React.Children.map(children, (child, index) => (
        <div 
          key={index}
          className="break-inside-avoid inline-block w-full pt-2"
          style={{ 
            marginBottom: `${gap}px`,
          }}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

export default MasonryGrid;
