import { useState, useEffect, useCallback, useRef } from 'react';
import { useThemeStore } from '../../store/themeStore';

const WORK_SECS = 25 * 60;
const BREAK_SECS = 5 * 60;

export function PomodoroWidget() {
  const colors = useThemeStore((s) => s.colors);
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [seconds, setSeconds] = useState(WORK_SECS);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const total = mode === 'work' ? WORK_SECS : BREAK_SECS;
  const progress = 1 - seconds / total;
  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          setMode((m) => {
            const next = m === 'work' ? 'break' : 'work';
            setSeconds(next === 'work' ? WORK_SECS : BREAK_SECS);
            return next;
          });
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const reset = useCallback(() => {
    setRunning(false);
    setSeconds(mode === 'work' ? WORK_SECS : BREAK_SECS);
  }, [mode]);

  const circumference = 2 * Math.PI * 42;
  const strokeOffset = circumference * (1 - progress);

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl px-4 py-3 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest" style={{ color: mode === 'work' ? colors.accent : '#22c55e' }}>
        {mode === 'work' ? '🍅 Travail' : '☕ Pause'}
      </div>

      <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
        <svg className="absolute" width="100" height="100" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="42" fill="none" stroke={`${colors.border}`} strokeWidth="5" />
          <circle
            cx="50" cy="50" r="42" fill="none"
            stroke={mode === 'work' ? colors.accent : '#22c55e'}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeOffset}
            transform="rotate(-90 50 50)"
            className="transition-[stroke-dashoffset] duration-1000 ease-linear"
          />
        </svg>
        <span className="text-xl font-bold tabular-nums">{mm}:{ss}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-lg px-3 py-1 text-xs font-medium"
          style={{ background: colors.accent, color: '#fff' }}
        >
          {running ? '⏸ Pause' : '▶ Start'}
        </button>
        <button
          onClick={reset}
          className="rounded-lg px-3 py-1 text-xs font-medium hover:bg-white/10"
          style={{ color: colors.textSecondary }}
        >
          ↺ Reset
        </button>
      </div>
    </div>
  );
}
