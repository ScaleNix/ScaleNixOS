import { useWidgetStore, WIDGET_META, type WidgetType } from '../store/widgetStore';
import { useThemeStore } from '../store/themeStore';

export function WidgetManager() {
  const colors = useThemeStore((s) => s.colors);
  const widgets = useWidgetStore((s) => s.widgets);
  const { addWidget, removeWidget, toggleWidget, showAll, hideAll, clearAll, resetPosition } = useWidgetStore();

  const visibleCount = widgets.filter((w) => w.visible).length;
  const allTypes = Object.entries(WIDGET_META) as [WidgetType, typeof WIDGET_META[WidgetType]][];

  return (
    <div className="flex h-full flex-col overflow-hidden" style={{ background: colors.surface, color: colors.textPrimary }}>
      {/* Header */}
      <div className="flex items-center justify-between border-b px-5 py-3" style={{ borderColor: colors.border }}>
        <div>
          <h1 className="text-base font-bold">Gestionnaire de widgets</h1>
          <p className="text-xs" style={{ color: colors.textSecondary }}>
            {widgets.length} widget{widgets.length !== 1 ? 's' : ''} · {visibleCount} visible{visibleCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={showAll}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-white/10"
            style={{ color: colors.accent }}
            title="Tout afficher"
          >
            👁 Tout afficher
          </button>
          <button
            onClick={hideAll}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-white/10"
            style={{ color: colors.textSecondary }}
            title="Tout masquer"
          >
            🙈 Tout masquer
          </button>
          <button
            onClick={clearAll}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-white/10 text-red-400"
            title="Tout supprimer"
          >
            🗑 Tout supprimer
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Active widgets list */}
        <div className="flex w-1/2 flex-col border-r" style={{ borderColor: colors.border }}>
          <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Widgets actifs ({widgets.length})
          </div>
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {widgets.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm" style={{ color: colors.textSecondary }}>
                Aucun widget
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: colors.border }}>
                {widgets.map((w) => {
                  const meta = WIDGET_META[w.type];
                  return (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5"
                      style={{ borderColor: colors.border }}
                    >
                      <span className="text-xl">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{meta.label}</div>
                        <div className="text-[10px] truncate" style={{ color: colors.textSecondary }}>
                          x:{Math.round(w.x)} y:{Math.round(w.y)} · {w.w}×{w.h}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleWidget(w.id)}
                        className="rounded p-1 text-sm hover:bg-white/10"
                        title={w.visible ? 'Masquer' : 'Afficher'}
                      >
                        {w.visible ? '👁' : '🙈'}
                      </button>
                      <button
                        onClick={() => resetPosition(w.id)}
                        className="rounded p-1 text-sm hover:bg-white/10"
                        title="Repositionner"
                      >
                        📍
                      </button>
                      <button
                        onClick={() => removeWidget(w.id)}
                        className="rounded p-1 text-sm text-red-400 hover:bg-white/10"
                        title="Supprimer"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add widget catalog */}
        <div className="flex w-1/2 flex-col">
          <div className="border-b px-4 py-2 text-xs font-semibold uppercase tracking-wide" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            Ajouter un widget
          </div>
          <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'thin' }}>
            <div className="grid grid-cols-2 gap-2">
              {allTypes.map(([type, meta]) => (
                <button
                  key={type}
                  onClick={() => addWidget(type)}
                  className="group flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-colors hover:bg-white/5"
                  style={{ borderColor: colors.border }}
                >
                  <span className="text-2xl">{meta.icon}</span>
                  <span className="text-xs font-medium">{meta.label}</span>
                  <span className="text-[10px] leading-tight" style={{ color: colors.textSecondary }}>
                    {meta.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
