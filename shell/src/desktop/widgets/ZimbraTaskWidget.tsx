import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../auth/useAuth';
import { zimbraAuth, getTasks, type ZimbraTask } from '../../api/zimbraSoap';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  NEED: { label: 'A faire', color: '#f97316' },
  INPR: { label: 'En cours', color: '#3b82f6' },
  COMP: { label: 'Termine', color: '#22c55e' },
  WAIT: { label: 'En attente', color: '#a855f7' },
  DEFERRED: { label: 'Reporte', color: '#64748b' },
};

export function ZimbraTaskWidget() {
  const colors = useThemeStore((s) => s.colors);
  const { user } = useAuth();
  const [tasks, setTasks] = useState<ZimbraTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user?.email) return;
    try {
      setError(null);
      const token = await zimbraAuth(user.email);
      const result = await getTasks(token);
      setTasks(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchTasks();
    const id = setInterval(fetchTasks, 5 * 60_000);
    return () => clearInterval(id);
  }, [fetchTasks]);

  const active = tasks.filter((t) => t.status !== 'COMP');
  const completed = tasks.filter((t) => t.status === 'COMP');

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2"
        style={{ background: '#10b98122' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📋</span>
          <span className="text-xs font-semibold">Taches Zimbra</span>
          {active.length > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: '#f97316' }}>
              {active.length}
            </span>
          )}
        </div>
        <button onClick={fetchTasks} className="rounded p-0.5 text-xs hover:bg-white/10" title="Rafraichir">🔄</button>
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
            <button onClick={fetchTasks} className="mt-1 rounded px-2 py-0.5 text-[10px]" style={{ background: colors.accent, color: '#fff' }}>
              Reessayer
            </button>
          </div>
        )}
        {!loading && !error && tasks.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Aucune tache
          </div>
        )}
        {!loading && !error && (
          <>
            {active.map((t) => {
              const st = STATUS_LABELS[t.status] || STATUS_LABELS.NEED;
              return (
                <div key={t.id} className="mb-1.5 flex items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-white/5">
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full" style={{ background: st.color }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-medium">{t.name}</div>
                    {t.fragment && (
                      <div className="truncate text-[10px]" style={{ color: colors.textSecondary }}>{t.fragment}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px]" style={{ color: colors.textSecondary }}>
                      <span style={{ color: st.color }}>{st.label}</span>
                      {t.percentComplete > 0 && <span>{t.percentComplete}%</span>}
                      {t.dueDate && (
                        <span>
                          {new Date(t.dueDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                        </span>
                      )}
                      {t.categories.length > 0 && (
                        <span className="truncate">{t.categories.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {completed.length > 0 && (
              <div className="mt-2">
                <div className="mb-1 text-[10px] font-semibold uppercase" style={{ color: colors.textSecondary }}>
                  Terminees ({completed.length})
                </div>
                {completed.slice(0, 3).map((t) => (
                  <div key={t.id} className="mb-1 flex items-center gap-2 px-2 py-1 opacity-50">
                    <span className="text-[10px]">✅</span>
                    <span className="truncate text-[11px] line-through">{t.name}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
