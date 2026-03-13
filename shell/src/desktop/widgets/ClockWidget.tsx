import { useEffect, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = [
  'janvier', 'fevrier', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'aout', 'septembre', 'octobre', 'novembre', 'decembre',
];

export function ClockWidget() {
  const [now, setNow] = useState(new Date());
  const colors = useThemeStore((s) => s.colors);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  const day = DAYS[now.getDay()];
  const date = `${day}, ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center rounded-xl px-5 py-4 backdrop-blur-md select-none"
      style={{
        background: `${colors.surface}cc`,
        border: `1px solid ${colors.border}`,
        color: colors.textPrimary,
      }}
    >
      <div className="text-4xl font-bold tracking-widest" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {hh}:{mm}<span className="text-xl" style={{ color: colors.textSecondary }}>:{ss}</span>
      </div>
      <div className="mt-1.5 text-xs capitalize" style={{ color: colors.textSecondary }}>
        {date}
      </div>
    </div>
  );
}
