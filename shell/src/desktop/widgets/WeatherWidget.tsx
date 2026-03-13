import { useMemo } from 'react';
import { useThemeStore } from '../../store/themeStore';

const CONDITIONS = [
  { icon: '\u2600\ufe0f', label: 'Ensoleille' },
  { icon: '\u26c5', label: 'Partiellement nuageux' },
  { icon: '\u2601\ufe0f', label: 'Nuageux' },
  { icon: '\ud83c\udf27\ufe0f', label: 'Pluie legere' },
  { icon: '\u26c8\ufe0f', label: 'Orageux' },
];

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export function WeatherWidget() {
  const colors = useThemeStore((s) => s.colors);

  const data = useMemo(() => {
    const day = Math.floor(Date.now() / 86400000);
    const temp = 12 + (day % 20);
    const cond = CONDITIONS[day % CONDITIONS.length];
    const today = new Date().getDay();
    const forecast = [0, 1, 2].map((i) => ({
      day: DAYS_FR[(today + i + 1) % 7],
      icon: CONDITIONS[(day + i + 1) % CONDITIONS.length].icon,
      high: temp + Math.round(Math.sin(i * 2) * 4),
      low: temp - 3 + Math.round(Math.cos(i * 3) * 2),
    }));
    return { temp, cond, humidity: 40 + (day % 40), wind: 5 + (day % 25), forecast };
  }, []);

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl px-4 py-3 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[11px] uppercase tracking-wide" style={{ color: colors.textSecondary }}>Paris</div>
          <div className="text-3xl font-bold">{data.temp}°C</div>
          <div className="text-xs" style={{ color: colors.textSecondary }}>{data.cond.label}</div>
        </div>
        <div className="text-5xl">{data.cond.icon}</div>
      </div>

      <div className="mt-2 flex gap-3 text-[11px]" style={{ color: colors.textSecondary }}>
        <span>💧 {data.humidity}%</span>
        <span>💨 {data.wind} km/h</span>
      </div>

      <div className="mt-auto flex justify-between border-t pt-2" style={{ borderColor: colors.border }}>
        {data.forecast.map((f) => (
          <div key={f.day} className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>{f.day}</span>
            <span className="text-lg">{f.icon}</span>
            <span className="text-[10px] tabular-nums">{f.high}° / {f.low}°</span>
          </div>
        ))}
      </div>
    </div>
  );
}
