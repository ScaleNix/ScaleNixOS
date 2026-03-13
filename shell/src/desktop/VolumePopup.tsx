import { useEffect, useRef } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useVolumeStore } from '../store/volumeStore';

interface VolumePopupProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function VolumePopup({ open, onClose, anchorRef }: VolumePopupProps) {
  const colors = useThemeStore((s) => s.colors);
  const volume = useVolumeStore((s) => s.volume);
  const muted = useVolumeStore((s) => s.muted);
  const setVolume = useVolumeStore((s) => s.setVolume);
  const toggleMute = useVolumeStore((s) => s.toggleMute);
  const ref = useRef<HTMLDivElement>(null);

  // Click-outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const anchorRect = anchorRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: anchorRect ? window.innerHeight - anchorRect.top + 6 : 52,
    right: anchorRect
      ? window.innerWidth - anchorRect.left - anchorRect.width / 2 - 28
      : 8,
    zIndex: 10000,
  };

  const displayVol = muted ? 0 : volume;

  return (
    <div
      ref={ref}
      style={{
        ...style,
        backgroundColor: `${colors.surface}f0`,
        border: `1px solid ${colors.border}80`,
        backdropFilter: 'blur(20px)',
        borderRadius: 12,
        padding: 14,
        width: 56,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div className="flex flex-col items-center gap-2">
        {/* Volume percentage */}
        <span className="text-[10px] font-semibold tabular-nums" style={{ color: colors.textPrimary }}>
          {displayVol}%
        </span>

        {/* Vertical slider track */}
        <div
          className="relative rounded-full cursor-pointer"
          style={{
            width: 6,
            height: 120,
            backgroundColor: `${colors.border}60`,
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = Math.round(((rect.bottom - e.clientY) / rect.height) * 100);
            setVolume(Math.max(0, Math.min(100, pct)));
          }}
        >
          {/* Fill */}
          <div
            className="absolute bottom-0 left-0 w-full rounded-full transition-all"
            style={{
              height: `${displayVol}%`,
              backgroundColor: muted ? colors.textSecondary : colors.accent,
            }}
          />
          {/* Thumb */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-3 h-3 rounded-full border-2 transition-all"
            style={{
              bottom: `calc(${displayVol}% - 6px)`,
              backgroundColor: colors.surface,
              borderColor: muted ? colors.textSecondary : colors.accent,
            }}
          />
        </div>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          style={{ color: muted ? colors.textSecondary : colors.accent }}
          title={muted ? 'Activer le son' : 'Couper le son'}
        >
          {muted || displayVol === 0 ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              {displayVol > 30 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
              {displayVol > 65 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
