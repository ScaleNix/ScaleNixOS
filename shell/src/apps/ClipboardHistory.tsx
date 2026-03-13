import { useEffect, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useClipboardHistoryStore, type ClipboardEntry } from '../store/clipboardHistoryStore';

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60_000) return 'A l\'instant';
  if (diff < 3600_000) return `Il y a ${Math.floor(diff / 60_000)} min`;
  if (diff < 86400_000) return `Il y a ${Math.floor(diff / 3600_000)}h`;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(ts));
}

function truncateText(text: string, maxLen = 120): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '...';
}

function EntryCard({ entry, onCopy, onRemove }: {
  entry: ClipboardEntry;
  onCopy: (text: string) => void;
  onRemove: (id: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);

  return (
    <div
      className="group flex items-start gap-2 rounded-lg px-3 py-2.5 transition-colors cursor-pointer"
      style={{ backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}44` }}
      onClick={() => onCopy(entry.text)}
      title="Cliquer pour copier"
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed"
          style={{ color: colors.textPrimary }}
        >
          {truncateText(entry.text)}
        </div>
        <div className="mt-1 text-[10px]" style={{ color: colors.textSecondary }}>
          {formatTimestamp(entry.timestamp)}
          {entry.text.length > 120 && (
            <span className="ml-2" style={{ color: colors.textSecondary }}>
              {entry.text.length} car.
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-1 shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); onCopy(entry.text); }}
          className="rounded px-2 py-1 text-[10px] font-medium transition-colors hover:brightness-110"
          style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          title="Copier"
        >
          Copier
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(entry.id); }}
          className="rounded px-2 py-1 text-[10px] transition-colors opacity-0 group-hover:opacity-100"
          style={{ color: colors.textSecondary }}
          title="Supprimer"
        >
          Suppr.
        </button>
      </div>
    </div>
  );
}

export function ClipboardHistory() {
  const colors = useThemeStore((s) => s.colors);
  const { entries, removeEntry, clearAll, load } = useClipboardHistoryStore();

  useEffect(() => {
    load();
  }, [load]);

  const copyToClipboard = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for non-secure contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, []);

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: `1px solid ${colors.border}` }}
      >
        <span className="text-sm font-semibold">Historique presse-papiers</span>
        {entries.length > 0 && (
          <button
            onClick={clearAll}
            className="rounded-lg px-2.5 py-1 text-xs font-medium transition-colors hover:brightness-110"
            style={{ backgroundColor: `${colors.accent}20`, color: colors.accent }}
          >
            Tout effacer
          </button>
        )}
      </div>

      {/* Entry count */}
      {entries.length > 0 && (
        <div className="px-4 py-1.5 text-[11px]" style={{ color: colors.textSecondary }}>
          {entries.length} entree{entries.length > 1 ? 's' : ''} — Ctrl+Maj+V pour ouvrir
        </div>
      )}

      {/* Entries list */}
      <div className="flex-1 overflow-auto px-3 pb-3">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-2 text-center px-4">
            <div className="text-3xl opacity-40">
              {'\u{1F4CB}'}
            </div>
            <div className="text-sm font-medium" style={{ color: colors.textSecondary }}>
              Aucun element copie
            </div>
            <div className="text-[11px]" style={{ color: colors.textSecondary }}>
              Les textes copies apparaitront ici.
              <br />
              Ctrl+Maj+V pour ouvrir ce panneau.
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5 pt-1">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onCopy={copyToClipboard}
                onRemove={removeEntry}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
