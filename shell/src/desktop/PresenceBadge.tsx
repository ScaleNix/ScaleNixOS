import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { usePresenceStore, type PresenceStatus } from '../store/presenceStore';

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#22c55e',
  away: '#eab308',
  busy: '#ef4444',
  offline: '#9ca3af',
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  online: 'En ligne',
  away: 'Absent',
  busy: 'Occup\u00e9',
  offline: 'Hors ligne',
};

const ALL_STATUSES: PresenceStatus[] = ['online', 'away', 'busy', 'offline'];

export function PresenceBadge() {
  const colors = useThemeStore((s) => s.colors);
  const { status, setStatus } = usePresenceStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative" data-testid="presence-badge">
      {/* Dot button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full transition-colors hover:opacity-80"
        style={{ width: 20, height: 20 }}
        title={STATUS_LABELS[status]}
        aria-label={`Statut: ${STATUS_LABELS[status]}`}
      >
        <span
          className="block rounded-full"
          style={{
            width: 10,
            height: 10,
            backgroundColor: STATUS_COLORS[status],
            boxShadow: `0 0 4px ${STATUS_COLORS[status]}`,
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 rounded-lg shadow-lg border py-1 z-[9999]"
          style={{
            backgroundColor: colors.surface,
            borderColor: colors.border,
            minWidth: 140,
          }}
        >
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => {
                setStatus(s);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm transition-colors hover:brightness-125"
              style={{
                color: status === s ? colors.accent : colors.textPrimary,
                backgroundColor: status === s ? `${colors.accent}15` : 'transparent',
              }}
            >
              <span
                className="block rounded-full flex-shrink-0"
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: STATUS_COLORS[s],
                }}
              />
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
