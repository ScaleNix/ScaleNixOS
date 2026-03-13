import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../auth/useAuth';
import { zimbraAuth, getCalendarEvents, type ZimbraEvent } from '../../api/zimbraSoap';
import { useAppStore } from '../../store/appStore';
import { useWindowStore } from '../../store/windowStore';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['jan', 'fev', 'mars', 'avr', 'mai', 'juin', 'juil', 'aout', 'sept', 'oct', 'nov', 'dec'];

function formatEventTime(ts: number, allDay: boolean): string {
  if (allDay) return 'Toute la journee';
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDay(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return 'Demain';
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

export function ZimbraCalendarWidget() {
  const colors = useThemeStore((s) => s.colors);
  const { user } = useAuth();
  const [events, setEvents] = useState<ZimbraEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    if (!user?.email) return;
    try {
      setError(null);
      const token = await zimbraAuth(user.email);
      const result = await getCalendarEvents(token, 7);
      setEvents(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchEvents();
    const id = setInterval(fetchEvents, 5 * 60_000); // Refresh every 5 min
    return () => clearInterval(id);
  }, [fetchEvents]);

  const openCalendar = () => {
    const app = useAppStore.getState().getAppById('zimbra-calendar');
    if (app) useWindowStore.getState().openWindow(app);
  };

  // Group events by day
  const grouped = events.reduce<Record<string, ZimbraEvent[]>>((acc, evt) => {
    const day = formatDay(evt.start);
    (acc[day] ??= []).push(evt);
    return acc;
  }, {});

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2"
        style={{ background: '#8b5cf622' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📅</span>
          <span className="text-xs font-semibold">Agenda</span>
          {events.length > 0 && (
            <span className="text-[10px]" style={{ color: colors.textSecondary }}>
              {events.length} evenement{events.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={fetchEvents} className="rounded p-0.5 text-xs hover:bg-white/10" title="Rafraichir">🔄</button>
          <button onClick={openCalendar} className="rounded p-0.5 text-xs hover:bg-white/10" title="Ouvrir">↗</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2" style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Chargement...
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-center text-xs">
            <span style={{ color: '#ef4444' }}>Connexion echouee</span>
            <button onClick={fetchEvents} className="mt-1 rounded px-2 py-0.5 text-[10px]" style={{ background: colors.accent, color: '#fff' }}>
              Reessayer
            </button>
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Aucun evenement a venir
          </div>
        )}
        {!loading && !error && Object.entries(grouped).map(([day, dayEvents]) => (
          <div key={day} className="mb-2">
            <div className="mb-1 text-[10px] font-semibold uppercase" style={{ color: colors.accent }}>
              {day}
            </div>
            {dayEvents.map((evt) => (
              <div
                key={evt.id}
                className="mb-1 flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5 cursor-pointer"
                onClick={openCalendar}
              >
                <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full" style={{ background: '#8b5cf6' }} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1 truncate text-[11px] font-medium">
                    {evt.name}
                    {evt.isRecurring && <span className="text-[9px]" title="Recurrent">🔁</span>}
                  </div>
                  <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                    {formatEventTime(evt.start, evt.allDay)}
                    {evt.location && ` · ${evt.location}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
