import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SlideItem {
  id: string | number;
  title: string;
  description?: string;
  image?: string;
  videoUrl?: string;
  type?: 'content' | 'video';
}

interface ContentSliderProps {
  items: SlideItem[];
  autoPlay?: boolean;
  autoPlayInterval?: number;
  className?: string;
  showDots?: boolean;
  showArrows?: boolean;
}

const ContentSlider: React.FC<ContentSliderProps> = ({
  items,
  autoPlay = false,
  autoPlayInterval = 5000,
  className,
  showDots = true,
  showArrows = true,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const minSwipeDistance = 50;

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [isTransitioning]);

  const goToPrevious = useCallback(() => {
    const newIndex = currentIndex === 0 ? items.length - 1 : currentIndex - 1;
    goToSlide(newIndex);
  }, [currentIndex, items.length, goToSlide]);

  const goToNext = useCallback(() => {
    const newIndex = currentIndex === items.length - 1 ? 0 : currentIndex + 1;
    goToSlide(newIndex);
  }, [currentIndex, items.length, goToSlide]);

  // Auto play
  useEffect(() => {
    if (autoPlay && items.length > 1) {
      autoPlayRef.current = setInterval(goToNext, autoPlayInterval);
      return () => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      };
    }
  }, [autoPlay, autoPlayInterval, goToNext, items.length]);

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNext();
    } else if (isRightSwipe) {
      goToPrevious();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  if (items.length === 0) return null;

  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Slider Container */}
      <div
        ref={sliderRef}
        className="relative w-full"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {items.map((item) => (
            <div
              key={item.id}
              className="w-full flex-shrink-0 px-2"
            >
              <div className="relative bg-glass-black/60 border border-white/10 rounded-xl overflow-hidden">
                {/* Content or Video */}
                {item.type === 'video' && item.videoUrl ? (
                  <div className="relative aspect-video bg-black/80 flex items-center justify-center">
                    {/* Video placeholder - 预留视频位置 */}
                    <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-cyber-cyan/20" />
                    <div className="relative z-10 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 border border-cyber-cyan/50 flex items-center justify-center hover:bg-cyber-cyan/20 transition-colors cursor-pointer">
                        <Play className="w-8 h-8 text-cyber-cyan ml-1" />
                      </div>
                      <p className="text-gray-400 text-sm font-mono">视频加载中...</p>
                    </div>
                    {/* 实际视频可以这样嵌入 */}
                    {/* <iframe src={item.videoUrl} className="absolute inset-0 w-full h-full" /> */}
                  </div>
                ) : (
                  <>
                    {item.image && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-orbitron font-bold text-white mb-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-400 text-sm leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 hover:border-cyber-cyan/50 transition-all z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white hover:bg-black/80 hover:border-cyber-cyan/50 transition-all z-10"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-6 bg-cyber-cyan shadow-[0_0_10px_rgba(0,255,255,0.5)]"
                  : "bg-white/30 hover:bg-white/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ContentSlider;
