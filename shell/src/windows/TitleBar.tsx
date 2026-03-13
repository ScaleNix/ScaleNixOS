import { useState, useRef, useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useWindowDrag } from './useWindowDrag';
import { SnapLayoutPopup } from './SnapLayoutPopup';
import type { WindowState } from '../types/app.types';

interface TitleBarProps {
  win: WindowState;
  isLinuxApp?: boolean;
}

export function TitleBar({ win, isLinuxApp }: TitleBarProps) {
  const { closeWindow, minimizeWindow, toggleMaximize, togglePip } = useWindowStore();
  const { onMouseDown } = useWindowDrag(win.id);
  const [showSnap, setShowSnap] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const handleMaximizeEnter = useCallback(() => {
    clearHideTimer();
    setShowSnap(true);
  }, [clearHideTimer]);

  const handleMaximizeLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setShowSnap(false), 200);
  }, []);

  const handlePopupClose = useCallback(() => {
    setShowSnap(false);
  }, []);

  return (
    <div
      className="flex h-[38px] shrink-0 cursor-grab items-center gap-2 border-b border-[#1f2937]/50 bg-[#0d1117] px-3 select-none active:cursor-grabbing"
      onMouseDown={onMouseDown}
      onDoubleClick={() => toggleMaximize(win.id)}
    >
      {/* macOS-style controls */}
      <div className="group flex items-center gap-[7px]">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#ff5f57] text-[0px] transition-all hover:brightness-110 group-hover:text-[9px] group-hover:text-black/70"
          aria-label="Fermer"
        >x</button>
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }}
          className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#febc2e] text-[0px] transition-all hover:brightness-110 group-hover:text-[9px] group-hover:text-black/70"
          aria-label="Minimiser"
        >-</button>
        <div
          className="relative"
          onMouseEnter={handleMaximizeEnter}
          onMouseLeave={handleMaximizeLeave}
        >
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); toggleMaximize(win.id); }}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#28c840] text-[0px] transition-all hover:brightness-110 group-hover:text-[9px] group-hover:text-black/70"
            aria-label={win.status === 'maximized' ? 'Restaurer' : 'Maximiser'}
          >{win.status === 'maximized' ? '\u25a3' : '\u25a1'}</button>
          {showSnap && (
            <SnapLayoutPopup windowId={win.id} onClose={handlePopupClose} />
          )}
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 overflow-hidden">
        <span className="text-sm leading-none">{win.icon}</span>
        <span className="truncate text-xs font-medium text-[#e2e8f0]/80">{win.title}</span>
        {isLinuxApp && (
          <span className="rounded bg-[#1abc9c]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#1abc9c]">
            Linux
          </span>
        )}
      </div>

      <div className="flex w-[55px] items-center justify-end">
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); togglePip(win.id); }}
          className={`flex h-5 w-5 items-center justify-center rounded text-[11px] transition-colors ${
            win.pip
              ? 'bg-[#4361ee]/30 text-[#4361ee]'
              : 'text-[#e2e8f0]/40 hover:bg-[#1f2937] hover:text-[#e2e8f0]/80'
          }`}
          aria-label={win.pip ? 'Quitter PiP' : 'Picture-in-Picture'}
          title={win.pip ? 'Quitter PiP' : 'Picture-in-Picture'}
        >{'\u29c9'}</button>
      </div>
    </div>
  );
}
