/**
 * HUD 覆盖层组件
 * 赛博朋克风格的装饰性 HUD 元素
 * - 四角 L 型装饰框架
 * - 扫描线动画
 * - 状态文本显示
 */

import { useTranslation } from 'react-i18next';
import React from 'react';

interface HUDOverlayProps {
  showCorners?: boolean;
  showScanline?: boolean;
  showStatusText?: boolean;
}

const HUDOverlay: React.FC<HUDOverlayProps> = ({
  showCorners = true,
  showScanline = true,
  showStatusText = true,
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {/* 四角 L 型装饰框架 */}
      {showCorners && (
        <>
          {/* 左上角 */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6">
            <div className="w-8 h-8 md:w-12 md:h-12 border-l-2 border-t-2 border-cyber-cyan/50" />
          </div>

          {/* 右上角 */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <div className="w-8 h-8 md:w-12 md:h-12 border-r-2 border-t-2 border-cyber-cyan/50" />
          </div>

          {/* 左下角 */}
          <div className="absolute bottom-20 md:bottom-6 left-4 md:left-6">
            <div className="w-8 h-8 md:w-12 md:h-12 border-l-2 border-b-2 border-cyber-cyan/50" />
          </div>

          {/* 右下角 */}
          <div className="absolute bottom-20 md:bottom-6 right-4 md:right-6">
            <div className="w-8 h-8 md:w-12 md:h-12 border-r-2 border-b-2 border-cyber-cyan/50" />
          </div>
        </>
      )}

      {/* 状态文本 & 交互按钮 */}
      {showStatusText && (
        <>
          {/* 左上角状态 */}
          <div className="absolute top-14 md:top-20 left-4 md:left-6 pointer-events-auto">
            <p className="text-[10px] md:text-xs font-mono text-cyber-cyan/60 tracking-widest">
              {t('hud.system_online')}
            </p>
          </div>

          {/* 右上角 - 语言切换 (已移除，避免与顶部导航栏 NavBar 重复) */}
          {/* <div className="absolute top-14 md:top-20 right-4 md:right-6 pointer-events-auto z-[101]">
            <button ... />
          </div> */}

          {/* 右下角状态 */}
          <div className="absolute bottom-24 md:bottom-20 right-4 md:right-6 text-right">
            <p className="text-[10px] md:text-xs font-mono text-cyber-cyan/60 tracking-widest">
              {t('hud.sync_rate')}
            </p>
          </div>
        </>
      )}

      {/* 扫描线动画 */}
      {showScanline && (
        <div
          className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyber-cyan/30 to-transparent animate-scanline"
          style={{
            animation: 'scanline 4s linear infinite',
          }}
        />
      )}

      {/* 扫描线动画样式 */}
      <style>{`
        @keyframes scanline {
          0% {
            top: -2px;
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            top: 100%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default HUDOverlay;
