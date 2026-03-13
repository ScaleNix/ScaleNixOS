import { useEffect, useState } from 'react';
import { useThemeStore } from '../../store/themeStore';

interface UsageData {
  cpu: number;
  ram: number;
  disk: number;
}

function randomUsage(): UsageData {
  return {
    cpu: 15 + Math.random() * 70,
    ram: 30 + Math.random() * 50,
    disk: 40 + Math.random() * 30,
  };
}

function Bar({ label, value, barColor, textColor }: { label: string; value: number; barColor: string; textColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-10 shrink-0 text-right text-[11px] font-medium" style={{ color: textColor }}>
        {label}
      </span>
      <div className="relative h-3.5 flex-1 overflow-hidden rounded-full" style={{ background: `${barColor}22` }}>
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-in-out"
          style={{
            width: `${value}%`,
            background: barColor,
          }}
        />
      </div>
      <span className="w-10 text-right text-[11px] tabular-nums" style={{ color: textColor }}>
        {value.toFixed(0)}%
      </span>
    </div>
  );
}

export function SystemMonitor() {
  const [usage, setUsage] = useState<UsageData>(randomUsage);
  const colors = useThemeStore((s) => s.colors);

  useEffect(() => {
    const id = setInterval(() => setUsage(randomUsage()), 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl px-4 py-3 backdrop-blur-md select-none"
      style={{
        background: `${colors.surface}cc`,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="mb-2.5 text-xs font-semibold tracking-wide uppercase" style={{ color: colors.textSecondary }}>
        Moniteur systeme
      </div>

      <div className="flex flex-1 flex-col justify-center gap-2.5">
        <Bar label="CPU" value={usage.cpu} barColor={colors.accent} textColor={colors.textPrimary} />
        <Bar label="RAM" value={usage.ram} barColor="#22c55e" textColor={colors.textPrimary} />
        <Bar label="Disk" value={usage.disk} barColor="#f97316" textColor={colors.textPrimary} />
      </div>
    </div>
  );
}
