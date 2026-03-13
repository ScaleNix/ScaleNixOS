import { useState, useCallback } from 'react';
import { useWidgetStore, type Widget } from '../../store/widgetStore';
import { useThemeStore } from '../../store/themeStore';

interface LinkItem {
  id: string;
  label: string;
  url: string;
  icon: string;
}

const DEFAULT_LINKS: LinkItem[] = [
  { id: 'g', label: 'Google', url: 'https://google.com', icon: '🔍' },
  { id: 'w', label: 'Wikipedia', url: 'https://fr.wikipedia.org', icon: '📚' },
  { id: 'gh', label: 'GitHub', url: 'https://github.com', icon: '🐙' },
];

interface Props {
  widget: Widget;
}

export function QuickLinksWidget({ widget }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');

  const links: LinkItem[] = (widget.data.links as LinkItem[]) || DEFAULT_LINKS;

  const save = useCallback(
    (next: LinkItem[]) => updateWidget(widget.id, { data: { ...widget.data, links: next } }),
    [widget.id, widget.data, updateWidget],
  );

  const addLink = () => {
    if (!label.trim() || !url.trim()) return;
    save([...links, { id: Date.now().toString(36), label: label.trim(), url: url.trim(), icon: '🔗' }]);
    setLabel('');
    setUrl('');
    setAdding(false);
  };

  const remove = (id: string) => save(links.filter((l) => l.id !== id));

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl px-3 py-3 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
          Liens rapides
        </span>
        <button
          onClick={() => setAdding(!adding)}
          className="rounded px-1.5 text-xs hover:bg-white/10"
          style={{ color: colors.accent }}
        >
          {adding ? '×' : '+'}
        </button>
      </div>

      {adding && (
        <div className="mb-2 space-y-1">
          <input
            className="w-full rounded bg-white/10 px-2 py-1 text-xs outline-none placeholder:opacity-40"
            style={{ color: colors.textPrimary }}
            placeholder="Nom"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <input
            className="w-full rounded bg-white/10 px-2 py-1 text-xs outline-none placeholder:opacity-40"
            style={{ color: colors.textPrimary }}
            placeholder="https://..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addLink()}
          />
          <button
            onClick={addLink}
            className="w-full rounded py-1 text-xs font-medium"
            style={{ background: colors.accent, color: '#fff' }}
          >
            Ajouter
          </button>
        </div>
      )}

      <div className="grid grid-cols-3 gap-2 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {links.map((link) => (
          <div key={link.id} className="group relative">
            <button
              onClick={() => window.open(link.url, '_blank')}
              className="flex w-full flex-col items-center gap-1 rounded-lg p-2 text-center hover:bg-white/10"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="w-full truncate text-[10px]">{link.label}</span>
            </button>
            <button
              onClick={() => remove(link.id)}
              className="absolute -right-1 -top-1 hidden h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] text-white group-hover:flex"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
