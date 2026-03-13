import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useAuth } from '../auth/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useLockStore } from '../store/lockStore';
import { useAppPrefsStore } from '../store/appPrefsStore';

interface LauncherProps {
  open: boolean;
  onClose: () => void;
}

const categories = [
  { key: 'all', label: 'Tout', icon: '\u2b50' },
  { key: 'communication', label: 'Communication', icon: '\ud83d\udcac' },
  { key: 'productivity', label: 'Productivite', icon: '\ud83d\udcbc' },
  { key: 'multimedia', label: 'Multimedia', icon: '\ud83c\udfac' },
  { key: 'tools', label: 'Outils', icon: '\ud83d\udee0\ufe0f' },
  { key: 'system', label: 'Systeme', icon: '\u2699\ufe0f' },
] as const;

export function Launcher({ open, onClose }: LauncherProps) {
  const apps = useAppStore((s) => s.apps);
  const { user, logout } = useAuth();
  const openWindow = useWindowStore((s) => s.openWindow);
  const colors = useThemeStore((s) => s.colors);
  const lock = useLockStore((s) => s.lock);
  const disabledApps = useAppPrefsStore((s) => s.disabledApps);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [hoveredApp, setHoveredApp] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSearch('');
      setFilter('all');
      setHoveredApp(null);
      setTimeout(() => searchRef.current?.focus(), 80);
    }
  }, [open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose]);

  if (!open) return null;

  const visibleApps = apps.filter((app) => {
    if (disabledApps.includes(app.id)) return false;
    if (app.roles && app.roles.length > 0 && !app.roles.some((r) => user?.roles.includes(r))) return false;
    if (filter !== 'all' && app.category !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return app.label.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.category?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpen = (app: typeof apps[0]) => {
    openWindow(app);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Transparent backdrop */}
      <div className="absolute inset-0" />

      {/* KDE Kickoff-style panel — bottom-left */}
      <div
        ref={panelRef}
        className="absolute bottom-[48px] left-1 flex w-[620px] overflow-hidden rounded-xl shadow-2xl animate-window-open"
        style={{
          backgroundColor: `${colors.surface}f5`,
          border: `1px solid ${colors.border}`,
          backdropFilter: 'blur(24px)',
          maxHeight: 'calc(100vh - 60px)',
        }}
      >
        {/* ── Left sidebar — categories ── */}
        <div
          className="flex w-[180px] shrink-0 flex-col justify-between py-2"
          style={{ backgroundColor: `${colors.bg}cc`, borderRight: `1px solid ${colors.border}60` }}
        >
          <div className="flex flex-col gap-0.5 px-2">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => { setFilter(cat.key); setSearch(''); }}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all"
                style={{
                  backgroundColor: filter === cat.key ? `${colors.accent}20` : 'transparent',
                  color: filter === cat.key ? colors.accent : colors.textSecondary,
                }}
              >
                <span className="text-sm">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* User section at bottom */}
          <div className="mt-2 border-t px-2 pt-2" style={{ borderColor: `${colors.border}60` }}>
            <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold"
                style={{ backgroundColor: `${colors.accent}30`, color: colors.accent }}
              >
                {(user?.preferred_username || '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold" style={{ color: colors.textPrimary }}>
                  {user?.preferred_username}
                </div>
                <div className="truncate text-[10px]" style={{ color: colors.textSecondary }}>
                  {user?.roles?.includes('admin') ? 'Administrateur' : 'Utilisateur'}
                </div>
              </div>
            </div>
            <div className="flex gap-1 px-1 pb-1">
              <button
                onClick={() => { lock(); onClose(); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] transition-colors hover:bg-white/10"
                style={{ color: colors.textSecondary }}
                title="Verrouiller"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm1 0h4V5a2 2 0 1 0-4 0v2z"/>
                </svg>
                Verrouiller
              </button>
              <button
                onClick={() => { logout(); onClose(); }}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-[10px] transition-colors hover:bg-white/10"
                style={{ color: '#ef4444' }}
                title="Deconnexion"
              >
                <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M2 2h5v1H3v10h4v1H2V2zm8.5 3l3.5 3-3.5 3V9H6V7h4.5V5z"/>
                </svg>
                Quitter
              </button>
            </div>
          </div>
        </div>

        {/* ── Right side — search + app grid ── */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Search bar */}
          <div className="flex items-center gap-2.5 px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}40` }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: colors.textSecondary }} className="shrink-0">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher une application..."
              className="flex-1 bg-transparent text-xs outline-none"
              style={{ color: colors.textPrimary }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="text-xs hover:opacity-70"
                style={{ color: colors.textSecondary }}
              >
                {'\u2715'}
              </button>
            )}
          </div>

          {/* App list */}
          <div className="flex-1 overflow-y-auto py-1" style={{ scrollbarWidth: 'thin', maxHeight: 420 }}>
            {visibleApps.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-xs" style={{ color: colors.textSecondary }}>
                Aucune application trouvee
              </div>
            ) : (
              visibleApps.map((app) => (
                <button
                  key={app.id}
                  onClick={() => handleOpen(app)}
                  onMouseEnter={() => setHoveredApp(app.id)}
                  onMouseLeave={() => setHoveredApp(null)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left transition-colors"
                  style={{
                    backgroundColor: hoveredApp === app.id ? `${colors.accent}12` : 'transparent',
                  }}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      background: `linear-gradient(135deg, ${app.color}30, ${app.color}10)`,
                      border: `1px solid ${app.color}30`,
                    }}
                  >
                    {app.icon.startsWith('http') ? (
                      <img src={app.icon} alt="" className="h-5 w-5" />
                    ) : (
                      <span className="text-lg">{app.icon}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-medium" style={{ color: colors.textPrimary }}>
                      {app.label}
                    </div>
                    <div className="truncate text-[10px]" style={{ color: colors.textSecondary }}>
                      {app.description}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
