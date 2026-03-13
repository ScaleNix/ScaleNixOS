import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useAuth } from '../auth/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useNotifStore } from '../store/notifStore';
import { useLockStore } from '../store/lockStore';
import { usePresenceStore, type PresenceStatus } from '../store/presenceStore';
import { useVolumeStore } from '../store/volumeStore';
import { useProfileStore } from '../store/profileStore';
import { useContextMenu, type MenuItem } from '../components/ContextMenu';
import { NotificationCenter } from './NotificationCenter';
import { CalendarPopup } from './CalendarPopup';
import { VolumePopup } from './VolumePopup';
import { QuickSettings } from './QuickSettings';
import { useFullscreen } from '../hooks/useFullscreen';

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#22c55e',
  away: '#eab308',
  busy: '#ef4444',
  offline: '#9ca3af',
};

export function Taskbar() {
  const apps = useAppStore((s) => s.apps);
  const { user } = useAuth();
  const allWindows = useWindowStore((s) => s.windows);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const windows = allWindows.filter((w) => !w.workspaceId || w.workspaceId === activeWorkspaceId);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const minimizeAll = useWindowStore((s) => s.minimizeAll);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const closeAllByApp = useWindowStore((s) => s.closeAllByApp);
  const moveToWorkspace = useWindowStore((s) => s.moveToWorkspace);
  const openWindow = useWindowStore((s) => s.openWindow);
  const colors = useThemeStore((s) => s.colors);
  const { show: showCtx } = useContextMenu();
  const profileAvatar = useProfileStore((s) => s.avatar);
  const profileDisplayName = useProfileStore((s) => s.displayName);
  const profileStatusMessage = useProfileStore((s) => s.statusMessage);
  const profileAvatarColor = useProfileStore((s) => s.avatarColor);

  // System tray state
  const [time, setTime] = useState(new Date());
  const dnd = useNotifStore((s) => s.dnd);
  const unreadCount = useNotifStore((s) => s.history.filter((h) => !h.read).length);
  const lock = useLockStore((s) => s.lock);
  const { isFullscreen, toggleFullscreen } = useFullscreen();
  const [notifOpen, setNotifOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [volumeOpen, setVolumeOpen] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const presenceStatus = usePresenceStore((s) => s.status);
  const volumeVal = useVolumeStore((s) => s.volume);
  const volumeMuted = useVolumeStore((s) => s.muted);
  const volumeLoad = useVolumeStore((s) => s.load);

  // Refs for popup anchoring
  const dateRef = useRef<HTMLButtonElement>(null);
  const volumeRef = useRef<HTMLButtonElement>(null);
  const quickRef = useRef<HTMLButtonElement>(null);

  // Load persisted volume on mount
  useEffect(() => { volumeLoad(); }, [volumeLoad]);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const timeStr = time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });

  const handleWindowClick = (winId: string) => {
    const win = windows.find((w) => w.id === winId);
    if (!win) return;
    if (win.status === 'minimized') {
      restoreWindow(win.id);
      focusWindow(win.id);
    } else if (activeWindowId === win.id) {
      minimizeWindow(win.id);
    } else {
      focusWindow(win.id);
    }
  };

  const handleWindowContext = (e: React.MouseEvent, winId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const win = windows.find((w) => w.id === winId);
    if (!win) return;
    const moveItems: MenuItem[] = workspaces
      .filter((ws) => ws.id !== activeWorkspaceId)
      .map((ws) => ({
        label: ws.name,
        icon: '\ud83d\udcbb',
        onClick: () => moveToWorkspace(win.id, ws.id),
      }));
    showCtx(e.clientX, e.clientY, [
      ...(win.status === 'minimized'
        ? [{ label: 'Restaurer', icon: '\ud83d\udd3c', onClick: () => { restoreWindow(win.id); focusWindow(win.id); } }]
        : [{ label: 'Minimiser', icon: '\ud83d\udd3d', onClick: () => minimizeWindow(win.id) }]
      ),
      ...(moveItems.length > 0 ? [
        { separator: true, label: '' },
        ...moveItems.map((mi) => ({ ...mi, label: `Deplacer vers ${mi.label}` })),
      ] : []),
      { separator: true, label: '' },
      { label: 'Fermer', icon: '\u2716', danger: true, onClick: () => closeWindow(win.id) },
    ]);
  };

  // Group windows by app for the taskbar
  const windowsByApp = new Map<string, typeof windows>();
  for (const win of windows) {
    const existing = windowsByApp.get(win.appId) || [];
    existing.push(win);
    windowsByApp.set(win.appId, existing);
  }

  return (
    <>
      <div
        className="flex h-[44px] shrink-0 items-center backdrop-blur-xl select-none z-[1000]"
        style={{
          backgroundColor: `${colors.surface}e6`,
          borderTop: `1px solid ${colors.border}80`,
          boxShadow: '0 -2px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* ── Start Button ── */}
        <button
          onClick={() => {
            const evt = new KeyboardEvent('keydown', { key: ' ', metaKey: true });
            window.dispatchEvent(evt);
          }}
          className="flex h-full items-center gap-2 px-4 transition-colors hover:brightness-125"
          style={{ color: colors.textPrimary }}
          title="Applications (Meta+Space)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="0.5" y="0.5" width="6.5" height="6.5" rx="1.5" fill={colors.accent} />
            <rect x="9" y="0.5" width="6.5" height="6.5" rx="1.5" fill={colors.accent} opacity="0.65" />
            <rect x="0.5" y="9" width="6.5" height="6.5" rx="1.5" fill={colors.accent} opacity="0.65" />
            <rect x="9" y="9" width="6.5" height="6.5" rx="1.5" fill={colors.accent} opacity="0.4" />
          </svg>
        </button>

        {/* ── Separator ── */}
        <div className="h-5 w-px shrink-0" style={{ backgroundColor: `${colors.border}80` }} />

        {/* ── Open windows (grouped by app) ── */}
        <div className="flex flex-1 h-full items-center gap-0.5 overflow-x-auto px-1 scrollbar-none">
          {Array.from(windowsByApp.entries()).map(([appId, appWindows]) => {
            const app = apps.find((a) => a.id === appId);
            const hasActive = appWindows.some((w) => w.id === activeWindowId);
            // If single window, show title; if multiple, show app label + count
            if (appWindows.length === 1) {
              const win = appWindows[0];
              const isActive = win.id === activeWindowId;
              const isMinimized = win.status === 'minimized';
              return (
                <button
                  key={win.id}
                  onClick={() => handleWindowClick(win.id)}
                  onContextMenu={(e) => handleWindowContext(e, win.id)}
                  className="relative flex h-[34px] items-center gap-1.5 rounded-lg px-2.5 text-left transition-all"
                  style={{
                    backgroundColor: isActive ? `${colors.accent}20` : 'transparent',
                    color: isMinimized ? colors.textSecondary : colors.textPrimary,
                  }}
                  title={win.title}
                >
                  <span className="shrink-0 text-sm leading-none">{win.icon}</span>
                  <span className="truncate text-[11px] font-medium max-w-[160px]">{win.title}</span>
                  {/* Active indicator bar */}
                  <div
                    className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full transition-all"
                    style={{
                      height: 2,
                      width: isActive ? 20 : 8,
                      backgroundColor: isActive ? colors.accent : colors.textSecondary,
                      opacity: isActive ? 1 : 0.5,
                    }}
                  />
                </button>
              );
            }
            // Multiple windows of same app — show grouped
            return (
              <button
                key={appId}
                onClick={() => {
                  // Focus first non-active or cycle
                  const inactive = appWindows.find((w) => w.id !== activeWindowId);
                  if (inactive) {
                    if (inactive.status === 'minimized') restoreWindow(inactive.id);
                    focusWindow(inactive.id);
                  } else {
                    minimizeWindow(appWindows[0].id);
                  }
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  showCtx(e.clientX, e.clientY, [
                    ...appWindows.map((w) => ({
                      label: w.title,
                      icon: w.icon,
                      onClick: () => { if (w.status === 'minimized') restoreWindow(w.id); focusWindow(w.id); },
                    })),
                    { separator: true, label: '' },
                    { label: `Fermer tout (${appWindows.length})`, icon: '\u2716', danger: true, onClick: () => closeAllByApp(appId) },
                  ]);
                }}
                className="relative flex h-[34px] items-center gap-1.5 rounded-lg px-2.5 transition-all"
                style={{
                  backgroundColor: hasActive ? `${colors.accent}20` : `${colors.border}33`,
                  color: colors.textPrimary,
                }}
                title={`${app?.label || appId} (${appWindows.length})`}
              >
                <span className="shrink-0 text-sm leading-none">{app?.icon}</span>
                <span className="truncate text-[11px] font-medium max-w-[120px]">{app?.label}</span>
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold"
                  style={{ backgroundColor: `${colors.accent}30`, color: colors.accent }}
                >
                  {appWindows.length}
                </span>
                <div
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full"
                  style={{
                    height: 2,
                    width: hasActive ? 20 : 12,
                    backgroundColor: hasActive ? colors.accent : colors.textSecondary,
                  }}
                />
              </button>
            );
          })}
        </div>

        {/* ── Separator ── */}
        <div className="h-5 w-px shrink-0" style={{ backgroundColor: `${colors.border}80` }} />

        {/* ── System Tray ── */}
        <div className="flex h-full items-center gap-1 px-2">
          {/* Workspace switcher */}
          <div className="flex items-center gap-0.5 mr-1">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              const wsWindowCount = allWindows.filter((w) => w.workspaceId === ws.id).length;
              return (
                <button
                  key={ws.id}
                  onClick={() => setActiveWorkspace(ws.id)}
                  className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[10px] font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? `${colors.accent}30` : 'transparent',
                    color: isActive ? colors.accent : colors.textSecondary,
                  }}
                  title={`${ws.name} (${wsWindowCount})`}
                >
                  {ws.id}
                </button>
              );
            })}
          </div>

          {/* DND indicator */}
          {dnd && (
            <span className="text-xs" title="Ne pas deranger">{'\ud83c\udf19'}</span>
          )}

          {/* Notifications */}
          <button
            onClick={() => setNotifOpen(true)}
            className="relative flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title="Notifications"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1.5A3.5 3.5 0 0 0 4.5 5v2.5c0 .5-.2 1-.6 1.4L3 9.8v.7h10v-.7l-.9-.9c-.4-.4-.6-.9-.6-1.4V5A3.5 3.5 0 0 0 8 1.5zM6.5 12a1.5 1.5 0 0 0 3 0h-3z"/>
            </svg>
            {unreadCount > 0 && (
              <span
                className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                style={{ backgroundColor: '#ef4444' }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Lock */}
          <button
            onClick={lock}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title="Verrouiller (Ctrl+Alt+L)"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm1 0h4V5a2 2 0 1 0-4 0v2z"/>
            </svg>
          </button>


          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title={isFullscreen ? "Quitter le plein ecran (F11)" : "Plein ecran (F11)"}
          >
            {isFullscreen ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 3 21 3 21 9" />
                <polyline points="9 21 3 21 3 15" />
                <line x1="21" y1="3" x2="14" y2="10" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            )}
          </button>
          {/* Separator */}
          <div className="h-5 w-px mx-0.5" style={{ backgroundColor: `${colors.border}80` }} />

          {/* Presence + User */}
          <button
            onClick={() => {
              const profileApp = apps.find((a) => a.id === 'user-profile');
              if (profileApp) openWindow(profileApp);
            }}
            className="flex h-[30px] items-center gap-1.5 rounded-md px-2 transition-colors hover:bg-white/10"
            title={profileStatusMessage ? `${profileDisplayName || user?.preferred_username} - ${profileStatusMessage}` : (profileDisplayName || user?.preferred_username)}
          >
            {/* Avatar or initials */}
            <div className="relative shrink-0">
              {profileAvatar ? (
                <img
                  src={profileAvatar}
                  alt=""
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold text-white"
                  style={{ backgroundColor: profileAvatarColor }}
                >
                  {(profileDisplayName || user?.name || user?.preferred_username || '')
                    .split(/\s+/)
                    .filter(Boolean)
                    .map((w: string) => w[0].toUpperCase())
                    .slice(0, 2)
                    .join('')}
                </div>
              )}
              <span
                className="absolute -bottom-0.5 -right-0.5 block h-2 w-2 rounded-full border"
                style={{
                  backgroundColor: STATUS_COLORS[presenceStatus],
                  borderColor: colors.surface,
                  boxShadow: `0 0 3px ${STATUS_COLORS[presenceStatus]}`,
                }}
              />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
                {profileDisplayName || user?.preferred_username}
              </span>
              {profileStatusMessage && (
                <span className="text-[9px] truncate max-w-[80px]" style={{ color: colors.textSecondary, opacity: 0.7 }}>
                  {profileStatusMessage}
                </span>
              )}
            </div>
          </button>

          {/* Volume */}
          <button
            ref={volumeRef}
            onClick={() => { setVolumeOpen(!volumeOpen); setCalendarOpen(false); setQuickOpen(false); }}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title={`Volume ${volumeMuted ? 'coupe' : volumeVal + '%'}`}
          >
            {volumeMuted || volumeVal === 0 ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                {volumeVal > 30 && <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />}
                {volumeVal > 65 && <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />}
              </svg>
            )}
          </button>

          {/* Quick Settings */}
          <button
            ref={quickRef}
            onClick={() => { setQuickOpen(!quickOpen); setCalendarOpen(false); setVolumeOpen(false); }}
            className="flex h-[30px] w-[30px] items-center justify-center rounded-md transition-colors hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title="Parametres rapides"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
          </button>

          {/* Separator */}
          <div className="h-5 w-px mx-0.5" style={{ backgroundColor: `${colors.border}80` }} />

          {/* Date/Time -> Calendar */}
          <button
            ref={dateRef}
            onClick={() => { setCalendarOpen(!calendarOpen); setVolumeOpen(false); setQuickOpen(false); }}
            className="flex h-[30px] items-center rounded-md px-2 transition-colors hover:bg-white/10"
            title="Calendrier"
          >
            <div className="flex flex-col items-end leading-none">
              <span className="text-[11px] font-semibold tabular-nums" style={{ color: colors.textPrimary }}>{timeStr}</span>
              <span className="text-[9px]" style={{ color: colors.textSecondary }}>{dateStr}</span>
            </div>
          </button>

          {/* Show Desktop (thin strip at the end) */}
          <button
            onClick={minimizeAll}
            className="flex h-full w-[6px] items-center justify-center transition-colors hover:bg-white/10"
            title="Afficher le bureau"
          >
            <div className="h-4 w-px" style={{ backgroundColor: `${colors.border}80` }} />
          </button>
        </div>
      </div>

      <NotificationCenter open={notifOpen} onClose={() => setNotifOpen(false)} />
      <CalendarPopup open={calendarOpen} onClose={() => setCalendarOpen(false)} anchorRef={dateRef} />
      <VolumePopup open={volumeOpen} onClose={() => setVolumeOpen(false)} anchorRef={volumeRef} />
      <QuickSettings open={quickOpen} onClose={() => setQuickOpen(false)} anchorRef={quickRef} />
    </>
  );
}
