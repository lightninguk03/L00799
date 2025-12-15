import React, { useState } from 'react';
import NavBar from './NavBar';
import CreatePostModal from '../ui/CreatePostModal';
import HUDOverlay from '../ui/HUDOverlay';

import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { getMediaUrl } from '../../lib/utils';
import bgCyberpunkDefault from '../../assets/bg_cyberpunk.jpg';

interface LayoutProps {
    children: React.ReactNode;
}

const HolographicLayout: React.FC<LayoutProps> = ({ children }) => {
    const [isPostModalOpen, setIsPostModalOpen] = useState(false);
    const { config } = useSiteConfig();
    const backgroundImage = getMediaUrl(config.backgroundImage) || bgCyberpunkDefault;

    return (
        <div className="min-h-screen text-flux-white font-rajdhani selection:bg-soul-purple selection:text-white overflow-x-hidden">
            {/* Global Background Layer */}
            <div className="fixed inset-0 z-[-10]">
                {/* Base Image */}
                <div
                    className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />

                {/* Reality Collapse Filters */}
                <div className="absolute inset-0 bg-void-black/80 backdrop-grayscale-[30%]" />

                {/* Animated Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-20 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

                {/* Vignette & Noise */}
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] opacity-80" />
            </div>

            {/* 赛博朋克扫描线效果 */}
            <div className="cyber-scanline" />
            
            {/* HUD Overlay (Fixed Elements like Corner Markers) */}
            <HUDOverlay />

            <NavBar />

            {/* Main Content Area */}
            {/* Added substantial padding bottom for Dock, and top for NavBar */}
            <main className="relative z-0 min-h-screen w-full overflow-y-auto overflow-x-hidden pt-24 pb-32 px-4 md:px-8">
                <div className="max-w-7xl mx-auto">
                    {children}
                </div>
            </main>

            {/* Navigation Dock (Floating) - Removed as per user request to avoid redundancy and overlap */}
            {/* <HolographicDock /> */}

            {/* Global Widgets */}
            {/* ChatWidget removed as requested */}
            {/* <ChatWidget /> */}
            <CreatePostModal isOpen={isPostModalOpen} onClose={() => setIsPostModalOpen(false)} />

            {/* Ambient Noise/Glitch Layer (Optional, low opacity) */}
            <div className="fixed inset-0 pointer-events-none z-[9999] opacity-[0.02] mix-blend-overlay bg-repeat bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIi8+CjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiLz4KPC9zdmc+')]" />
        </div>
    );
};

export default HolographicLayout;
