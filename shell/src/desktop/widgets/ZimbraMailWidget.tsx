import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../auth/useAuth';
import { zimbraAuth, getInbox, type ZimbraMail } from '../../api/zimbraSoap';
import { useAppStore } from '../../store/appStore';
import { useWindowStore } from '../../store/windowStore';

export function ZimbraMailWidget() {
  const colors = useThemeStore((s) => s.colors);
  const { user } = useAuth();
  const [messages, setMessages] = useState<ZimbraMail[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMail = useCallback(async () => {
    if (!user?.email) return;
    try {
      setError(null);
      const token = await zimbraAuth(user.email);
      const result = await getInbox(token, 6);
      setMessages(result.messages);
      setUnread(result.unread);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    fetchMail();
    const id = setInterval(fetchMail, 60_000); // Refresh every 60s
    return () => clearInterval(id);
  }, [fetchMail]);

  const openZimbra = () => {
    const app = useAppStore.getState().getAppById('zimbra-mail');
    if (app) useWindowStore.getState().openWindow(app);
  };

  const timeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'maintenant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}j`;
  };

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2"
        style={{ background: `${colors.accent}22` }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">✉️</span>
          <span className="text-xs font-semibold">Messagerie</span>
          {unread > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>
              {unread}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={fetchMail} className="rounded p-0.5 text-xs hover:bg-white/10" title="Rafraichir">🔄</button>
          <button onClick={openZimbra} className="rounded p-0.5 text-xs hover:bg-white/10" title="Ouvrir">↗</button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Chargement...
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-xs">
            <span style={{ color: '#ef4444' }}>Connexion echouee</span>
            <span style={{ color: colors.textSecondary }}>{error}</span>
            <button onClick={fetchMail} className="mt-1 rounded px-2 py-0.5 text-[10px]" style={{ background: colors.accent, color: '#fff' }}>
              Reessayer
            </button>
          </div>
        )}
        {!loading && !error && messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Aucun message
          </div>
        )}
        {!loading && !error && messages.map((m) => (
          <div
            key={m.id}
            className="flex gap-2 border-b px-3 py-2 hover:bg-white/5 cursor-pointer"
            style={{ borderColor: `${colors.border}66` }}
            onClick={openZimbra}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                {m.unread && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: colors.accent }} />}
                <span className={`truncate text-[11px] ${m.unread ? 'font-semibold' : ''}`}>
                  {m.fromDisplay}
                </span>
                <span className="ml-auto shrink-0 text-[10px]" style={{ color: colors.textSecondary }}>
                  {timeAgo(m.date)}
                </span>
              </div>
              <div className={`truncate text-[11px] ${m.unread ? 'font-medium' : ''}`}>
                {m.hasAttachment && '📎 '}{m.subject}
              </div>
              <div className="truncate text-[10px]" style={{ color: colors.textSecondary }}>
                {m.fragment}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
