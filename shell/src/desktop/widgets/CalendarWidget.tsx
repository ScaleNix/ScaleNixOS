import { useState } from 'react';
import { useThemeStore } from '../../store/themeStore';

const DAY_LABELS = ['L', 'Ma', 'Me', 'J', 'V', 'S', 'D'];
const MONTHS_FR = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

export function CalendarWidget() {
  const colors = useThemeStore((s) => s.colors);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const prev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
    else setViewMonth(viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
    else setViewMonth(viewMonth + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl px-3 py-3 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="mb-2 flex items-center justify-between">
        <button onClick={prev} className="rounded px-1.5 text-sm hover:bg-white/10">◀</button>
        <span className="text-xs font-semibold">{MONTHS_FR[viewMonth]} {viewYear}</span>
        <button onClick={next} className="rounded px-1.5 text-sm hover:bg-white/10">▶</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-medium" style={{ color: colors.textSecondary }}>
        {DAY_LABELS.map((d) => <div key={d}>{d}</div>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-0.5 text-center text-[11px]">
        {cells.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate();
          return (
            <div
              key={i}
              className={`flex h-6 items-center justify-center rounded-full ${isToday ? 'font-bold' : ''}`}
              style={isToday ? { background: colors.accent, color: '#fff' } : undefined}
            >
              {day ?? ''}
            </div>
          );
        })}
      </div>
    </div>
  );
}
