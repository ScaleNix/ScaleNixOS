import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useNotifStore } from '../store/notifStore';

interface QuickSettingsProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

const STORAGE_KEY = 'scalenix-quick-settings';

function loadSettings(): { wifi: boolean; bluetooth: boolean; brightness: number } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* */ }
  return { wifi: true, bluetooth: false, brightness: 80 };
}

function saveSettings(data: { wifi: boolean; bluetooth: boolean; brightness: number }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

export function QuickSettings({ open, onClose, anchorRef }: QuickSettingsProps) {
  const colors = useThemeStore((s) => s.colors);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const dnd = useNotifStore((s) => s.dnd);
  const toggleDnd = useNotifStore((s) => s.toggleDnd);
  const ref = useRef<HTMLDivElement>(null);

  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);
  const [brightness, setBrightness] = useState(80);

  // Load persisted settings
  useEffect(() => {
    const s = loadSettings();
    setWifi(s.wifi);
    setBluetooth(s.bluetooth);
    setBrightness(s.brightness);
  }, []);

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
    right: anchorRect ? window.innerWidth - anchorRect.right : 8,
    zIndex: 10000,
  };

  const isDark = themeId !== 'light';

  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'midnight');
  };

  const toggleWifi = () => {
    const next = !wifi;
    setWifi(next);
    saveSettings({ wifi: next, bluetooth, brightness });
  };

  const toggleBluetooth = () => {
    const next = !bluetooth;
    setBluetooth(next);
    saveSettings({ wifi, bluetooth: next, brightness });
  };

  const handleBrightness = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value);
    setBrightness(v);
    saveSettings({ wifi, bluetooth, brightness: v });
    // Apply brightness filter to the document
    document.documentElement.style.filter = v < 100 ? `brightness(${v / 100})` : '';
  };

  const tiles: { label: string; active: boolean; onClick: () => void; icon: React.ReactNode }[] = [
    {
      label: 'Wi-Fi',
      active: wifi,
      onClick: toggleWifi,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <circle cx="12" cy="20" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      label: 'Bluetooth',
      active: bluetooth,
      onClick: toggleBluetooth,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
        </svg>
      ),
    },
    {
      label: 'NPD',
      active: dnd,
      onClick: toggleDnd,
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ),
    },
    {
      label: isDark ? 'Sombre' : 'Clair',
      active: isDark,
      onClick: toggleDarkMode,
      icon: isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ),
    },
  ];

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
        width: 220,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Toggle tiles - 2x2 grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {tiles.map((tile) => (
          <button
            key={tile.label}
            onClick={tile.onClick}
            className="flex flex-col items-center justify-center gap-1 rounded-lg p-2.5 transition-all"
            style={{
              backgroundColor: tile.active ? `${colors.accent}25` : `${colors.border}30`,
              color: tile.active ? colors.accent : colors.textSecondary,
              border: `1px solid ${tile.active ? `${colors.accent}40` : 'transparent'}`,
            }}
          >
            {tile.icon}
            <span className="text-[9px] font-medium">{tile.label}</span>
          </button>
        ))}
      </div>

      {/* Brightness slider */}
      <div className="flex items-center gap-2 px-1">
        <svg
          width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke={colors.textSecondary} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
        <input
          type="range"
          min={20}
          max={100}
          value={brightness}
          onChange={handleBrightness}
          className="flex-1 h-1 appearance-none rounded-full cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${colors.accent} ${brightness}%, ${colors.border}60 ${brightness}%)`,
            accentColor: colors.accent,
          }}
          title={`Luminosite ${brightness}%`}
        />
        <span className="text-[9px] font-medium tabular-nums w-6 text-right" style={{ color: colors.textSecondary }}>
          {brightness}%
        </span>
      </div>
    </div>
  );
}
