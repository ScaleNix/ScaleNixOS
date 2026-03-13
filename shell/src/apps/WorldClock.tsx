import { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

interface ClockZone {
  id: string;
  label: string;
  city: string;
  timezone: string;
  flag: string;
}

const DEFAULT_ZONES: ClockZone[] = [
  { id: 'paris', label: 'Paris', city: 'France', timezone: 'Europe/Paris', flag: '\ud83c\uddeb\ud83c\uddf7' },
  { id: 'london', label: 'Londres', city: 'Royaume-Uni', timezone: 'Europe/London', flag: '\ud83c\uddec\ud83c\udde7' },
  { id: 'new-york', label: 'New York', city: 'Etats-Unis', timezone: 'America/New_York', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { id: 'tokyo', label: 'Tokyo', city: 'Japon', timezone: 'Asia/Tokyo', flag: '\ud83c\uddef\ud83c\uddf5' },
  { id: 'sydney', label: 'Sydney', city: 'Australie', timezone: 'Australia/Sydney', flag: '\ud83c\udde6\ud83c\uddfa' },
  { id: 'dubai', label: 'Dubai', city: 'Emirats Arabes Unis', timezone: 'Asia/Dubai', flag: '\ud83c\udde6\ud83c\uddea' },
];

const ALL_ZONES: ClockZone[] = [
  ...DEFAULT_ZONES,
  { id: 'berlin', label: 'Berlin', city: 'Allemagne', timezone: 'Europe/Berlin', flag: '\ud83c\udde9\ud83c\uddea' },
  { id: 'moscow', label: 'Moscou', city: 'Russie', timezone: 'Europe/Moscow', flag: '\ud83c\uddf7\ud83c\uddfa' },
  { id: 'shanghai', label: 'Shanghai', city: 'Chine', timezone: 'Asia/Shanghai', flag: '\ud83c\udde8\ud83c\uddf3' },
  { id: 'mumbai', label: 'Mumbai', city: 'Inde', timezone: 'Asia/Kolkata', flag: '\ud83c\uddee\ud83c\uddf3' },
  { id: 'sao-paulo', label: 'Sao Paulo', city: 'Bresil', timezone: 'America/Sao_Paulo', flag: '\ud83c\udde7\ud83c\uddf7' },
  { id: 'los-angeles', label: 'Los Angeles', city: 'Etats-Unis', timezone: 'America/Los_Angeles', flag: '\ud83c\uddfa\ud83c\uddf8' },
  { id: 'toronto', label: 'Toronto', city: 'Canada', timezone: 'America/Toronto', flag: '\ud83c\udde8\ud83c\udde6' },
  { id: 'casablanca', label: 'Casablanca', city: 'Maroc', timezone: 'Africa/Casablanca', flag: '\ud83c\uddf2\ud83c\udde6' },
  { id: 'nairobi', label: 'Nairobi', city: 'Kenya', timezone: 'Africa/Nairobi', flag: '\ud83c\uddf0\ud83c\uddea' },
  { id: 'singapore', label: 'Singapour', city: 'Singapour', timezone: 'Asia/Singapore', flag: '\ud83c\uddf8\ud83c\uddec' },
  { id: 'seoul', label: 'Seoul', city: 'Coree du Sud', timezone: 'Asia/Seoul', flag: '\ud83c\uddf0\ud83c\uddf7' },
  { id: 'tunis', label: 'Tunis', city: 'Tunisie', timezone: 'Africa/Tunis', flag: '\ud83c\uddf9\ud83c\uddf3' },
];

function getTimeForZone(tz: string, now: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now);
}

function getDateForZone(tz: string, now: Date) {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: tz, weekday: 'short', day: 'numeric', month: 'short',
  }).format(now);
}

function getOffsetLabel(tz: string, now: Date): string {
  const local = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  const remote = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  const diff = Math.round((remote.getTime() - local.getTime()) / 3600000);
  if (diff === 0) return 'Meme heure';
  return diff > 0 ? `+${diff}h` : `${diff}h`;
}

function isDaytime(tz: string, now: Date): boolean {
  const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', hour12: false }).format(now));
  return h >= 7 && h < 20;
}

const STORAGE_KEY = 'scalenix-worldclock-zones';

export function WorldClock() {
  const colors = useThemeStore((s) => s.colors);
  const [now, setNow] = useState(new Date());
  const [zones, setZones] = useState<ClockZone[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_ZONES;
  });
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(zones));
  }, [zones]);

  const removeZone = (id: string) => setZones((z) => z.filter((zz) => zz.id !== id));
  const addZone = (zone: ClockZone) => {
    if (!zones.find((z) => z.id === zone.id)) {
      setZones((z) => [...z, zone]);
    }
    setAdding(false);
    setSearch('');
  };

  const available = ALL_ZONES.filter((z) => !zones.find((zz) => zz.id === z.id));
  const filtered = search
    ? available.filter((z) => z.label.toLowerCase().includes(search.toLowerCase()) || z.city.toLowerCase().includes(search.toLowerCase()))
    : available;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <span className="text-sm font-semibold">Horloge mondiale</span>
        <button
          onClick={() => setAdding(!adding)}
          className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
        >
          {adding ? 'Fermer' : '+ Ajouter'}
        </button>
      </div>

      {/* Add zone panel */}
      {adding && (
        <div className="px-4 py-2" style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.surface }}>
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une ville..."
            className="w-full rounded-lg bg-transparent px-3 py-1.5 text-xs outline-none"
            style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary }}
          />
          <div className="mt-1 max-h-32 overflow-auto">
            {filtered.map((z) => (
              <button
                key={z.id}
                onClick={() => addZone(z)}
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:opacity-80 transition-colors"
                style={{ color: colors.textPrimary }}
              >
                <span>{z.flag}</span>
                <span className="font-medium">{z.label}</span>
                <span style={{ color: colors.textSecondary }}>— {z.city}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="py-2 text-center text-[11px]" style={{ color: colors.textSecondary }}>Aucune ville trouvee</div>
            )}
          </div>
        </div>
      )}

      {/* Clock list */}
      <div className="flex-1 overflow-auto">
        {zones.map((zone) => {
          const time = getTimeForZone(zone.timezone, now);
          const date = getDateForZone(zone.timezone, now);
          const offset = getOffsetLabel(zone.timezone, now);
          const day = isDaytime(zone.timezone, now);

          return (
            <div
              key={zone.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors group"
              style={{ borderBottom: `1px solid ${colors.border}22` }}
            >
              <span className="text-xl">{zone.flag}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{zone.label}</span>
                  <span className="text-[10px] rounded px-1 py-0.5"
                    style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}>
                    {offset}
                  </span>
                  <span className="text-sm">{day ? '\u2600\ufe0f' : '\ud83c\udf19'}</span>
                </div>
                <div className="text-[11px]" style={{ color: colors.textSecondary }}>{zone.city} — {date}</div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold" style={{ color: colors.textPrimary }}>{time}</div>
              </div>
              <button
                onClick={() => removeZone(zone.id)}
                className="opacity-0 group-hover:opacity-100 rounded p-1 text-xs transition-opacity hover:opacity-80"
                style={{ color: colors.textSecondary }}
                title="Retirer"
              >
                {'\u2716'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
