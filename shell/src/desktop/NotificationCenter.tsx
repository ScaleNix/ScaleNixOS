import { useEffect, useRef, useState } from 'react';
import { useNotifStore, type NotifHistoryItem, type NotifCategory } from '../store/notifStore';
import { useThemeStore } from '../store/themeStore';

const TYPE_BORDER_COLORS: Record<NotifHistoryItem['type'], string> = {
  info: '#4361ee',
  success: '#28c840',
  warning: '#febc2e',
  error: '#ff5f57',
};

const TYPE_ICONS: Record<NotifHistoryItem['type'], string> = {
  info: '\u2139\ufe0f',
  success: '\u2705',
  warning: '\u26a0\ufe0f',
  error: '\u274c',
};

const CATEGORY_ICONS: Record<NotifCategory, string> = {
  mail: '\u2709\ufe0f',
  chat: '\ud83d\udcac',
  file: '\ud83d\udcc1',
  system: '\u2699\ufe0f',
  calendar: '\ud83d\udcc5',
};

const CATEGORY_LABELS: Record<NotifCategory, string> = {
  mail: 'Mail',
  chat: 'Chat',
  file: 'Fichiers',
  system: 'Systeme',
  calendar: 'Calendrier',
};

type FilterTab = 'all' | NotifCategory;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'mail', label: 'Mail' },
  { key: 'chat', label: 'Chat' },
  { key: 'file', label: 'Fichiers' },
  { key: 'system', label: 'Systeme' },
  { key: 'calendar', label: 'Calendrier' },
];

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Hier';
  return `Il y a ${days}j`;
}

function groupByDate(items: NotifHistoryItem[]): { label: string; items: NotifHistoryItem[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;

  const groups: { label: string; items: NotifHistoryItem[] }[] = [];
  const todayItems: NotifHistoryItem[] = [];
  const yesterdayItems: NotifHistoryItem[] = [];
  const olderItems: NotifHistoryItem[] = [];

  for (const item of items) {
    if (item.timestamp >= today) todayItems.push(item);
    else if (item.timestamp >= yesterday) yesterdayItems.push(item);
    else olderItems.push(item);
  }

  if (todayItems.length > 0) groups.push({ label: "Aujourd'hui", items: todayItems });
  if (yesterdayItems.length > 0) groups.push({ label: 'Hier', items: yesterdayItems });
  if (olderItems.length > 0) groups.push({ label: 'Plus ancien', items: olderItems });

  return groups;
}

function getNotifIcon(item: NotifHistoryItem): string {
  if (item.category && CATEGORY_ICONS[item.category]) {
    return CATEGORY_ICONS[item.category];
  }
  return TYPE_ICONS[item.type];
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export function NotificationCenter({ open, onClose }: Props) {
  const { colors } = useThemeStore();
  const { history, dnd, toggleDnd, clearHistory, dismissHistoryItem, markAllRead } = useNotifStore();
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

  // Mark all as read when opening
  useEffect(() => {
    if (open) markAllRead();
  }, [open, markAllRead]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid the click that opened the panel from closing it
    const timer = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handler);
    };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filter history by active category tab
  const filteredHistory = activeFilter === 'all'
    ? history
    : history.filter((item) => item.category === activeFilter);

  const groups = groupByDate(filteredHistory);

  // Count notifications per category for badge display
  const categoryCounts: Record<string, number> = {};
  for (const item of history) {
    if (item.category) {
      categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    }
  }

  return (
    <>
      {/* Backdrop - invisible but catches clicks */}
      {open && <div className="fixed inset-0 z-[99990]" />}

      <div
        ref={panelRef}
        className="fixed top-0 right-0 z-[99991] flex h-full w-[380px] flex-col shadow-2xl transition-transform duration-300 ease-in-out"
        style={{
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          backgroundColor: colors.surface,
          borderLeft: `1px solid ${colors.border}`,
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-4 py-3"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <h2 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
            Notifications
          </h2>
          <div className="flex items-center gap-2">
            {/* DND Toggle */}
            <button
              onClick={toggleDnd}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs transition-colors"
              style={{
                backgroundColor: dnd ? `${colors.accent}22` : colors.surfaceAlt,
                color: dnd ? colors.accent : colors.textSecondary,
                border: `1px solid ${dnd ? colors.accent : colors.border}`,
              }}
              title={dnd ? 'Desactiver Ne pas deranger' : 'Activer Ne pas deranger'}
            >
              <span className="text-sm">{dnd ? '\ud83c\udf19' : '\ud83d\udd14'}</span>
              <span>{dnd ? 'NPD actif' : 'NPD'}</span>
            </button>

            {/* Clear all */}
            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-md px-2 py-1 text-xs transition-colors hover:opacity-80"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  color: colors.textSecondary,
                  border: `1px solid ${colors.border}`,
                }}
              >
                Tout effacer
              </button>
            )}
          </div>
        </div>

        {/* Category filter tabs */}
        <div
          className="flex shrink-0 gap-1 overflow-x-auto px-3 py-2"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count = tab.key === 'all' ? history.length : (categoryCounts[tab.key] || 0);
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className="flex shrink-0 items-center gap-1 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: isActive ? `${colors.accent}22` : 'transparent',
                  color: isActive ? colors.accent : colors.textSecondary,
                  border: `1px solid ${isActive ? colors.accent : 'transparent'}`,
                }}
              >
                {tab.key !== 'all' && (
                  <span className="text-xs">{CATEGORY_ICONS[tab.key as NotifCategory]}</span>
                )}
                <span>{tab.label}</span>
                {count > 0 && (
                  <span
                    className="ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] leading-none"
                    style={{
                      backgroundColor: isActive ? `${colors.accent}33` : colors.surfaceAlt,
                      color: isActive ? colors.accent : colors.textSecondary,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notification list */}
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="text-3xl opacity-40">{'\ud83d\udd14'}</span>
              <p className="mt-3 text-sm" style={{ color: colors.textSecondary }}>
                {activeFilter === 'all'
                  ? 'Aucune notification'
                  : `Aucune notification ${CATEGORY_LABELS[activeFilter as NotifCategory]?.toLowerCase() || ''}`}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                {/* Group header */}
                <div
                  className="sticky top-0 px-4 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{
                    backgroundColor: colors.surface,
                    color: colors.textSecondary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  {group.label}
                </div>

                {/* Items */}
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="group relative px-4 py-3 transition-colors"
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      borderLeft: `3px solid ${TYPE_BORDER_COLORS[item.type]}`,
                      cursor: item.onClick ? 'pointer' : 'default',
                    }}
                    onClick={() => {
                      if (item.onClick) item.onClick();
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = colors.surfaceAlt;
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Category / Type icon */}
                      <span className="mt-0.5 shrink-0 text-sm">{getNotifIcon(item)}</span>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>
                            {item.title}
                          </p>
                          {item.category && (
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[10px] leading-none"
                              style={{
                                backgroundColor: colors.surfaceAlt,
                                color: colors.textSecondary,
                              }}
                            >
                              {CATEGORY_LABELS[item.category]}
                            </span>
                          )}
                        </div>
                        {item.message && (
                          <p className="mt-0.5 text-xs leading-relaxed" style={{ color: colors.textSecondary }}>
                            {item.message}
                          </p>
                        )}
                        <p className="mt-1 text-[10px]" style={{ color: colors.textSecondary }}>
                          {relativeTime(item.timestamp)}
                        </p>
                      </div>

                      {/* Dismiss */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          dismissHistoryItem(item.id);
                        }}
                        className="shrink-0 rounded p-0.5 text-xs opacity-0 transition-opacity group-hover:opacity-100"
                        style={{ color: colors.textSecondary }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLElement).style.color = colors.textPrimary;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLElement).style.color = colors.textSecondary;
                        }}
                      >
                        {'\u2715'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
