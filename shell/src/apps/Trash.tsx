import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNotifStore } from '../store/notifStore';
import { useThemeStore } from '../store/themeStore';
import { WebDAVClient, fileIcon, formatSize, type TrashItem } from './webdav';

function formatTrashDate(ts: number): string {
  if (!ts) return '--';
  const d = new Date(ts * 1000);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function Trash() {
  const { user, token } = useAuth();
  const push = useNotifStore((s) => s.push);
  const colors = useThemeStore((s) => s.colors);
  const [items, setItems] = useState<TrashItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const clientRef = useRef<WebDAVClient | null>(null);

  const username = user?.preferred_username ?? '';

  useEffect(() => {
    if (username && token) {
      clientRef.current = new WebDAVClient(username, token);
    }
  }, [username, token]);

  const fetchTrash = useCallback(async () => {
    const client = clientRef.current;
    if (!client) return;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const result = await client.listTrash();
      setItems(result);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientRef.current) fetchTrash();
  }, [fetchTrash, username, token]);

  const handleRestore = async (item: TrashItem) => {
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.restoreTrash(item);
      push({ type: 'success', title: `"${item.name}" restaure` });
      fetchTrash();
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleRestoreSelected = async () => {
    const client = clientRef.current;
    if (!client || selected.size === 0) return;
    try {
      for (const href of selected) {
        const item = items.find((i) => i.href === href);
        if (item) await client.restoreTrash(item);
      }
      push({ type: 'success', title: `${selected.size} element(s) restaure(s)` });
      fetchTrash();
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleDeletePermanent = async (item: TrashItem) => {
    if (!confirm(`Supprimer definitivement "${item.name}" ?`)) return;
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.deleteTrash(item);
      push({ type: 'success', title: `"${item.name}" supprime definitivement` });
      fetchTrash();
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleDeleteSelected = async () => {
    const client = clientRef.current;
    if (!client || selected.size === 0) return;
    if (!confirm(`Supprimer definitivement ${selected.size} element(s) ?`)) return;
    try {
      for (const href of selected) {
        const item = items.find((i) => i.href === href);
        if (item) await client.deleteTrash(item);
      }
      push({ type: 'success', title: `${selected.size} element(s) supprime(s) definitivement` });
      fetchTrash();
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Vider la corbeille ? Cette action est irreversible.')) return;
    const client = clientRef.current;
    if (!client) return;
    try {
      await client.emptyTrash();
      push({ type: 'success', title: 'Corbeille videe' });
      fetchTrash();
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const toggleSelect = (href: string, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      setSelected((s) => {
        const next = new Set(s);
        next.has(href) ? next.delete(href) : next.add(href);
        return next;
      });
    } else {
      setSelected(new Set([href]));
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Toolbar */}
      <div
        className="flex h-10 shrink-0 items-center gap-2 px-3"
        style={{ borderBottom: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        <span className="text-sm font-semibold">Corbeille</span>
        <div className="flex-1" />
        <button
          onClick={handleRestoreSelected}
          disabled={selected.size === 0}
          className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          title="Restaurer la selection"
        >
          Restaurer ({selected.size})
        </button>
        <button
          onClick={handleDeleteSelected}
          disabled={selected.size === 0}
          className="rounded px-2 py-1 text-xs transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
          title="Supprimer definitivement"
        >
          Supprimer ({selected.size})
        </button>
        <div className="mx-1 h-5 w-px" style={{ backgroundColor: colors.border }} />
        <button
          onClick={handleEmptyTrash}
          disabled={items.length === 0}
          className="rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-30"
          style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
          title="Vider la corbeille"
        >
          Vider la corbeille
        </button>
        <button
          onClick={fetchTrash}
          className="rounded px-2 py-1 text-xs transition-colors hover:opacity-80"
          style={{ color: colors.textSecondary }}
          title="Actualiser"
        >
          {'\ud83d\udd04'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }} />
          </div>
        ) : error ? (
          <div className="flex h-full flex-col items-center justify-center gap-3">
            <span className="text-3xl">{'\u26a0\ufe0f'}</span>
            <span className="text-sm" style={{ color: colors.textSecondary }}>{error}</span>
            <button
              onClick={fetchTrash}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-white"
              style={{ backgroundColor: colors.accent }}
            >
              Reessayer
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: colors.textSecondary }}>
            <span className="text-4xl">{'\ud83d\uddd1\ufe0f'}</span>
            <span className="text-sm">La corbeille est vide</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Header */}
            <div
              className="flex items-center px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ borderBottom: `1px solid ${colors.border}`, color: colors.textSecondary }}
            >
              <span className="flex-1">Nom</span>
              <span className="w-48">Emplacement d'origine</span>
              <span className="w-36 text-right">Supprime le</span>
              <span className="w-20 text-right">Taille</span>
              <span className="w-24 text-right">Actions</span>
            </div>

            {items.map((item) => {
              const isSelected = selected.has(item.href);
              return (
                <div
                  key={item.href}
                  className="flex items-center gap-2 px-3 py-1.5 cursor-default transition-colors"
                  style={{
                    backgroundColor: isSelected ? `${colors.accent}20` : 'transparent',
                  }}
                  onClick={(e) => toggleSelect(item.href, e)}
                >
                  <span className="text-base shrink-0">
                    {item.isDirectory ? '\ud83d\udcc1' : fileIcon({ name: item.name, isDirectory: false } as any)}
                  </span>
                  <span className="flex-1 truncate text-xs font-medium">{item.name}</span>
                  <span className="w-48 truncate text-[11px]" style={{ color: colors.textSecondary }}>
                    /{item.originalLocation}
                  </span>
                  <span className="w-36 text-right text-[11px]" style={{ color: colors.textSecondary }}>
                    {formatTrashDate(item.deletionTime)}
                  </span>
                  <span className="w-20 text-right text-[11px]" style={{ color: colors.textSecondary }}>
                    {item.isDirectory ? '--' : formatSize(item.size)}
                  </span>
                  <div className="w-24 flex items-center justify-end gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRestore(item); }}
                      className="rounded px-1.5 py-0.5 text-[11px] transition-colors hover:opacity-80"
                      style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
                      title="Restaurer"
                    >
                      {'\u21a9\ufe0f'}
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePermanent(item); }}
                      className="rounded px-1.5 py-0.5 text-[11px] transition-colors hover:opacity-80"
                      style={{ backgroundColor: '#ef444420', color: '#ef4444' }}
                      title="Supprimer definitivement"
                    >
                      {'\u2716'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex h-7 shrink-0 items-center justify-between px-3 text-[11px]"
        style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.surface, color: colors.textSecondary }}
      >
        <span>{items.length} element{items.length !== 1 ? 's' : ''} dans la corbeille</span>
        <span>{formatSize(items.reduce((s, i) => s + i.size, 0))}</span>
      </div>
    </div>
  );
}
