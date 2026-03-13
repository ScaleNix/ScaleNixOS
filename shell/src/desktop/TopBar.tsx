import { useState, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useWindowStore } from '../store/windowStore';
import { useAppStore } from '../store/appStore';
import { useThemeStore } from '../store/themeStore';
import { useNotifStore } from '../store/notifStore';
import { useLockStore } from '../store/lockStore';
import { PresenceBadge } from './PresenceBadge';
import { NotificationCenter } from './NotificationCenter';

export function TopBar() {
  const { user, logout } = useAuth();
  const [time, setTime] = useState(new Date());
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const windows = useWindowStore((s) => s.windows);
  const { getAppById } = useAppStore();
  const colors = useThemeStore((s) => s.colors);
  const dnd = useNotifStore((s) => s.dnd);
  const unreadCount = useNotifStore((s) => s.history.filter((h) => !h.read).length);
  const lock = useLockStore((s) => s.lock);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const activeWin = windows.find((w) => w.id === activeWindowId);
  const activeApp = activeWin ? getAppById(activeWin.appId) : null;

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  return (
    <div
      className="flex h-9 shrink-0 items-center justify-between px-4 backdrop-blur-md select-none"
      style={{ backgroundColor: `${colors.surface}cc`, borderBottom: `1px solid ${colors.border}` }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold" style={{ color: colors.accent }}>ScalenixOS</span>
        {activeApp && (
          <span className="text-xs" style={{ color: colors.textSecondary }}>
            {activeApp.icon} {activeApp.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {dnd && <span className="text-xs" title="Ne pas deranger">{'\ud83c\udf19'}</span>}
        <button
          onClick={() => setNotifOpen(true)}
          className="relative rounded p-0.5 text-xs transition-colors hover:opacity-80"
          style={{ color: colors.textSecondary }}
          title="Notifications"
        >
          {'\ud83d\udd14'}
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: colors.accent }}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
        <button
          onClick={lock}
          className="rounded p-0.5 text-xs transition-colors hover:opacity-80"
          style={{ color: colors.textSecondary }}
          title="Verrouiller (Ctrl+Alt+L)"
        >
          {'\ud83d\udd12'}
        </button>
        <div className="flex items-center gap-1.5">
          <PresenceBadge />
          <span className="text-xs" style={{ color: colors.textSecondary }}>{user?.preferred_username}</span>
        </div>
        <span className="text-xs" style={{ color: colors.textSecondary }}>{dateStr} {timeStr}</span>
        <button
          onClick={logout}
          className="rounded px-2 py-0.5 text-xs transition-colors hover:opacity-80"
          style={{ color: colors.textSecondary }}
        >
          Deconnexion
        </button>
      </div>
      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  );
}
