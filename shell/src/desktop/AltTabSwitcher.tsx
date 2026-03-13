import { useEffect, useState, useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useThemeStore } from '../store/themeStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import type { WindowState } from '../types/app.types';

interface AltTabSwitcherProps {
  visible: boolean;
  onDismiss: () => void;
}

export function AltTabSwitcher({ visible, onDismiss }: AltTabSwitcherProps) {
  const windows = useWindowStore((s) => s.windows);
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const colors = useThemeStore((s) => s.colors);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Filter to windows in the current workspace
  const switchableWindows = windows.filter(
    (w) => !w.workspaceId || w.workspaceId === activeWorkspaceId,
  );

  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset selection when overlay opens
  useEffect(() => {
    if (visible) {
      // Start at index 1 (the next window after the current one) if there are multiple windows
      const currentIdx = switchableWindows.findIndex((w) => w.id === activeWindowId);
      if (switchableWindows.length > 1 && currentIdx !== -1) {
        setSelectedIndex((currentIdx + 1) % switchableWindows.length);
      } else {
        setSelectedIndex(0);
      }
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectWindow = useCallback(
    (win: WindowState) => {
      if (win.status === 'minimized') {
        restoreWindow(win.id);
      }
      focusWindow(win.id);
      onDismiss();
    },
    [focusWindow, restoreWindow, onDismiss],
  );

  // Handle Tab presses while Alt is held, and Alt release
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedIndex((prev) => {
          if (e.shiftKey) {
            // Alt+Shift+Tab: go backwards
            return prev <= 0 ? switchableWindows.length - 1 : prev - 1;
          }
          return (prev + 1) % switchableWindows.length;
        });
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // When Alt is released, select the highlighted window
      if (e.key === 'Alt') {
        e.preventDefault();
        const win = switchableWindows[selectedIndex];
        if (win) {
          selectWindow(win);
        } else {
          onDismiss();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [visible, selectedIndex, switchableWindows, selectWindow, onDismiss]);

  if (!visible || switchableWindows.length === 0) return null;

  const accent = colors.accent || '#4361ee';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 20,
          borderRadius: 16,
          background: `${colors.surface || '#1a1a2e'}e6`,
          border: `1px solid ${colors.border || '#ffffff1a'}`,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5)',
          maxWidth: '80vw',
          overflowX: 'auto',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {switchableWindows.map((win, idx) => {
          const isSelected = idx === selectedIndex;
          return (
            <div
              key={win.id}
              onClick={() => selectWindow(win)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 12,
                borderRadius: 12,
                width: 120,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: isSelected ? `${accent}30` : 'transparent',
                border: isSelected
                  ? `2px solid ${accent}`
                  : '2px solid transparent',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {/* App icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  background: `${colors.surfaceAlt || '#2a2a3e'}`,
                  border: `1px solid ${colors.border || '#ffffff1a'}`,
                  opacity: win.status === 'minimized' ? 0.5 : 1,
                }}
              >
                {win.icon}
              </div>

              {/* Window title */}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: isSelected
                    ? (colors.textPrimary || '#ffffff')
                    : (colors.textSecondary || '#ffffffaa'),
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  lineHeight: '14px',
                }}
                title={win.title}
              >
                {win.title}
              </span>

              {/* Minimized indicator */}
              {win.status === 'minimized' && (
                <span
                  style={{
                    fontSize: 9,
                    color: colors.textSecondary || '#ffffff88',
                    fontStyle: 'italic',
                  }}
                >
                  (minimise)
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hint text */}
      <div
        style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: 12,
          color: colors.textSecondary || '#ffffff88',
          background: `${colors.surface || '#1a1a2e'}cc`,
          padding: '6px 16px',
          borderRadius: 8,
          border: `1px solid ${colors.border || '#ffffff1a'}`,
        }}
      >
        Tab pour naviguer &middot; Relacher Alt pour selectionner &middot; Echap pour annuler
      </div>
    </div>
  );
}
