import { useState, useCallback } from 'react';
import { useWidgetStore, type Widget } from '../../store/widgetStore';
import { useThemeStore } from '../../store/themeStore';

interface TodoItem {
  id: string;
  text: string;
  done: boolean;
}

interface Props {
  widget: Widget;
}

export function TodoListWidget({ widget }: Props) {
  const colors = useThemeStore((s) => s.colors);
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const [input, setInput] = useState('');

  const items: TodoItem[] = (widget.data.items as TodoItem[]) || [];

  const save = useCallback(
    (next: TodoItem[]) => updateWidget(widget.id, { data: { ...widget.data, items: next } }),
    [widget.id, widget.data, updateWidget],
  );

  const addItem = () => {
    const text = input.trim();
    if (!text) return;
    save([...items, { id: Date.now().toString(36), text, done: false }]);
    setInput('');
  };

  const toggle = (id: string) => save(items.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  const remove = (id: string) => save(items.filter((it) => it.id !== id));

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl px-3 py-3 backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
        Taches ({items.filter((i) => !i.done).length}/{items.length})
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
        {items.map((it) => (
          <div key={it.id} className="group flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-white/5">
            <input
              type="checkbox"
              checked={it.done}
              onChange={() => toggle(it.id)}
              className="h-3.5 w-3.5 shrink-0 accent-current"
              style={{ accentColor: colors.accent }}
            />
            <span className={`flex-1 text-xs ${it.done ? 'line-through opacity-50' : ''}`}>{it.text}</span>
            <button
              onClick={() => remove(it.id)}
              className="hidden text-xs opacity-50 hover:opacity-100 group-hover:block"
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-1">
        <input
          className="flex-1 rounded bg-white/10 px-2 py-1 text-xs outline-none placeholder:opacity-40"
          style={{ color: colors.textPrimary }}
          placeholder="Nouvelle tache..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addItem()}
        />
        <button
          onClick={addItem}
          className="rounded px-2 py-1 text-xs font-medium"
          style={{ background: colors.accent, color: '#fff' }}
        >
          +
        </button>
      </div>
    </div>
  );
}
