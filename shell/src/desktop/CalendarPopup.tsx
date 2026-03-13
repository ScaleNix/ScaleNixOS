import { useState, useEffect, useRef } from 'react';
import { useThemeStore } from '../store/themeStore';

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

interface CalendarPopupProps {
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function CalendarPopup({ open, onClose, anchorRef }: CalendarPopupProps) {
  const colors = useThemeStore((s) => s.colors);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Reset to current month when opening
  useEffect(() => {
    if (open) {
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth());
    }
  }, [open]);

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

  const firstDay = new Date(viewYear, viewMonth, 1);
  // Monday-based: 0=Mon ... 6=Sun
  const startDow = (firstDay.getDay() + 6) % 7;
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Fill remaining cells to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  // Position above the anchor
  const anchorRect = anchorRef.current?.getBoundingClientRect();
  const style: React.CSSProperties = {
    position: 'fixed',
    bottom: anchorRect ? window.innerHeight - anchorRect.top + 6 : 52,
    right: anchorRect ? window.innerWidth - anchorRect.right : 8,
    zIndex: 10000,
  };

  return (
    <div
      ref={ref}
      style={{
        ...style,
        backgroundColor: `${colors.surface}f0`,
        border: `1px solid ${colors.border}80`,
        backdropFilter: 'blur(20px)',
        borderRadius: 12,
        padding: 12,
        width: 260,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={prevMonth}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          style={{ color: colors.textSecondary }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 1L3 6L8 11" />
          </svg>
        </button>
        <span className="text-xs font-semibold" style={{ color: colors.textPrimary }}>
          {MONTHS_FR[viewMonth]} {viewYear}
        </span>
        <button
          onClick={nextMonth}
          className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          style={{ color: colors.textSecondary }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 1L9 6L4 11" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAYS_FR.map((d) => (
          <div
            key={d}
            className="flex h-6 items-center justify-center text-[9px] font-medium"
            style={{ color: colors.textSecondary }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => (
          <div
            key={i}
            className="flex h-[30px] w-full items-center justify-center rounded-md text-[11px] font-medium"
            style={{
              color: day ? (isToday(day) ? '#fff' : colors.textPrimary) : 'transparent',
              backgroundColor: day && isToday(day) ? colors.accent : 'transparent',
              cursor: day ? 'pointer' : 'default',
            }}
            onMouseEnter={(e) => {
              if (day && !isToday(day)) {
                (e.currentTarget as HTMLElement).style.backgroundColor = `${colors.accent}20`;
              }
            }}
            onMouseLeave={(e) => {
              if (day && !isToday(day)) {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
              }
            }}
          >
            {day ?? ''}
          </div>
        ))}
      </div>

      {/* Today button */}
      <div className="mt-2 flex justify-center">
        <button
          onClick={() => {
            const now = new Date();
            setViewYear(now.getFullYear());
            setViewMonth(now.getMonth());
          }}
          className="text-[10px] font-medium px-3 py-1 rounded-md transition-colors hover:bg-white/10"
          style={{ color: colors.accent }}
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  );
}
