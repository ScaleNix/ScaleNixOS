import { useEffect, useCallback, useState } from 'react';
import { useShortcutStore, type Shortcut } from '../store/shortcutStore';
import { useThemeStore } from '../store/themeStore';

const CATEGORY_LABELS: Record<string, string> = {
  system: 'Systeme',
  navigation: 'Navigation',
  apps: 'Applications',
};

const CATEGORY_ORDER = ['system', 'navigation', 'apps'];

function formatKeyCombo(e: KeyboardEvent): string | null {
  const key = e.key;
  // Ignore lone modifier presses
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(key)) return null;

  const parts: string[] = [];
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  // Normalize key display
  let displayKey = key;
  if (key === ' ') displayKey = 'Space';
  else if (key.length === 1) displayKey = key.toUpperCase();
  else if (key === 'Escape') displayKey = 'Escape';

  parts.push(displayKey);
  return parts.join('+');
}

export function ShortcutSettings() {
  const { colors } = useThemeStore();
  const { shortcuts, editing, resetDefaults } = useShortcutStore();

  // Group shortcuts by category
  const grouped = CATEGORY_ORDER.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: shortcuts.filter((s) => s.category === cat),
  })).filter((g) => g.items.length > 0);

  // Conflict detection passed to each row
  const findConflict = (pendingKeys: string, currentId: string): string | null => {
    const conflict = shortcuts.find((s) => s.id !== currentId && s.keys === pendingKeys);
    return conflict ? conflict.label : null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold" style={{ color: colors.textPrimary }}>
          Raccourcis clavier
        </h3>
        <button
          className="px-3 py-1.5 rounded text-sm cursor-pointer"
          style={{
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
          }}
          onClick={resetDefaults}
        >
          Reinitialiser
        </button>
      </div>

      {grouped.map((group) => (
        <div key={group.category}>
          <h4
            className="text-xs font-semibold uppercase tracking-wider mb-2 px-4"
            style={{ color: colors.textSecondary }}
          >
            {group.label}
          </h4>
          <div
            className="rounded-xl overflow-hidden divide-y"
            style={{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              border: `1px solid ${colors.border}`,
            }}
          >
            {group.items.map((shortcut) => (
              <ShortcutRowWithConflict
                key={shortcut.id}
                shortcut={shortcut}
                isEditing={editing === shortcut.id}
                findConflict={findConflict}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Wrapper that manages pending keys state and passes conflict info */
function ShortcutRowWithConflict({
  shortcut,
  isEditing,
  findConflict,
}: {
  shortcut: Shortcut;
  isEditing: boolean;
  findConflict: (keys: string, id: string) => string | null;
}) {
  const { colors } = useThemeStore();
  const { setEditing, updateShortcut } = useShortcutStore();
  const [pendingKeys, setPendingKeys] = useState<string | null>(null);

  const conflict = pendingKeys ? findConflict(pendingKeys, shortcut.id) : null;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const combo = formatKeyCombo(e);
      if (combo) {
        if (combo === 'Escape') {
          setEditing(null);
          setPendingKeys(null);
          return;
        }
        setPendingKeys(combo);
      }
    },
    [setEditing],
  );

  useEffect(() => {
    if (!isEditing) {
      setPendingKeys(null);
      return;
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isEditing, handleKeyDown]);

  const confirmEdit = () => {
    if (pendingKeys && !conflict) {
      updateShortcut(shortcut.id, pendingKeys);
      setPendingKeys(null);
    }
  };

  const cancelEdit = () => {
    setEditing(null);
    setPendingKeys(null);
  };

  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{ backgroundColor: isEditing ? colors.surfaceAlt : 'transparent' }}
    >
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: colors.textPrimary }}>
          {shortcut.label}
        </div>
        <div className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          {shortcut.description}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-4">
        {isEditing ? (
          <>
            <kbd
              className="px-3 py-1.5 rounded text-xs font-mono min-w-[120px] text-center"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${pendingKeys ? (conflict ? '#ef4444' : colors.accent) : colors.border}`,
                color: pendingKeys ? (conflict ? '#ef4444' : colors.accent) : colors.textSecondary,
              }}
            >
              {pendingKeys ?? 'Appuyez sur une touche...'}
            </kbd>
            {conflict && (
              <span className="text-xs whitespace-nowrap" style={{ color: '#ef4444' }}>
                Conflit: {conflict}
              </span>
            )}
            <button
              className="px-2 py-1 rounded text-xs font-medium cursor-pointer disabled:opacity-40"
              style={{ backgroundColor: colors.accent, color: '#fff' }}
              disabled={!pendingKeys || !!conflict}
              onClick={confirmEdit}
            >
              OK
            </button>
            <button
              className="px-2 py-1 rounded text-xs cursor-pointer"
              style={{ color: colors.textSecondary, border: `1px solid ${colors.border}` }}
              onClick={cancelEdit}
            >
              Annuler
            </button>
          </>
        ) : (
          <>
            <kbd
              className="px-3 py-1.5 rounded text-xs font-mono"
              style={{
                backgroundColor: colors.surface,
                border: `1px solid ${colors.border}`,
                color: colors.textPrimary,
              }}
            >
              {shortcut.keys}
            </kbd>
            {shortcut.editable && (
              <button
                className="px-2 py-1 rounded text-xs cursor-pointer"
                style={{ color: colors.accent, border: `1px solid ${colors.border}` }}
                onClick={() => setEditing(shortcut.id)}
              >
                Modifier
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
