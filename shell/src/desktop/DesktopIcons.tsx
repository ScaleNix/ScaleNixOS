import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useDesktopStore, type DesktopShortcut } from '../store/desktopStore';
import { useAuth } from '../auth/useAuth';
import { useContextMenu } from '../components/ContextMenu';

const ICON_W = 80;
const ICON_H = 88;
const GAP_X = 8;
const GAP_Y = 8;
const OFFSET_X = 16;
const OFFSET_Y = 12;

export function DesktopIcons() {
  const { getAppById } = useAppStore();
  const { openWindow, openFileViewer } = useWindowStore();
  const { user } = useAuth();
  const { show: showCtx } = useContextMenu();
  const { shortcuts, loadShortcuts, removeShortcut, moveShortcut } = useDesktopStore();
  const dragRef = useRef<{ id: string; startX: number; startY: number; origCol: number; origRow: number } | null>(null);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  const handleOpen = useCallback((shortcut: DesktopShortcut) => {
    if (shortcut.type === 'app' && shortcut.appId) {
      const app = getAppById(shortcut.appId);
      if (app) openWindow(app);
    } else if (shortcut.type === 'file' && shortcut.filePath && shortcut.fileType) {
      openFileViewer(
        shortcut.fileName ?? shortcut.label,
        shortcut.filePath,
        shortcut.fileType as 'image' | 'video' | 'pdf' | 'audio' | 'markdown',
      );
    }
  }, [getAppById, openWindow, openFileViewer]);

  const handleContextMenu = useCallback((e: React.MouseEvent, sc: DesktopShortcut) => {
    e.preventDefault();
    e.stopPropagation();
    const app = sc.appId ? getAppById(sc.appId) : undefined;

    showCtx(e.clientX, e.clientY, [
      { label: 'Ouvrir', icon: '\ud83d\udcc2', onClick: () => handleOpen(sc) },
      { separator: true, label: '' },
      { label: 'Retirer du bureau', icon: '\ud83d\uddd1\ufe0f', danger: true, onClick: () => removeShortcut(sc.id) },
      ...(app ? [{ separator: true, label: '' }, { label: app.description ?? sc.label, icon: '\u2139\ufe0f', disabled: true }] : []),
    ]);
  }, [getAppById, handleOpen, removeShortcut, showCtx]);

  const handleDragStart = useCallback((e: React.MouseEvent, sc: DesktopShortcut) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = { id: sc.id, startX: e.clientX, startY: e.clientY, origCol: sc.col, origRow: sc.row };

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = ev.clientX - dragRef.current.startX;
      const dy = ev.clientY - dragRef.current.startY;
      const newCol = Math.max(0, dragRef.current.origCol + Math.round(dx / (ICON_W + GAP_X)));
      const newRow = Math.max(0, dragRef.current.origRow + Math.round(dy / (ICON_H + GAP_Y)));
      if (newCol !== dragRef.current.origCol || newRow !== dragRef.current.origRow) {
        moveShortcut(dragRef.current.id, newCol, newRow);
        dragRef.current.origCol = newCol;
        dragRef.current.origRow = newRow;
        dragRef.current.startX = ev.clientX;
        dragRef.current.startY = ev.clientY;
      }
    };

    const onUp = () => {
      dragRef.current = null;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [moveShortcut]);

  return (
    <>
      {shortcuts.map((sc) => {
        // Check role access for app shortcuts
        if (sc.type === 'app' && sc.appId) {
          const app = getAppById(sc.appId);
          if (app?.roles && app.roles.length > 0 && !app.roles.some((r) => user?.roles.includes(r))) {
            return null;
          }
        }

        const x = OFFSET_X + sc.col * (ICON_W + GAP_X);
        const y = OFFSET_Y + sc.row * (ICON_H + GAP_Y);

        return (
          <button
            key={sc.id}
            className="group absolute flex flex-col items-center gap-1 rounded-lg p-1.5 transition-colors hover:bg-white/5 active:bg-white/10"
            style={{ left: x, top: y, width: ICON_W }}
            onDoubleClick={() => handleOpen(sc)}
            onContextMenu={(e) => handleContextMenu(e, sc)}
            onMouseDown={(e) => handleDragStart(e, sc)}
          >
            <span className="text-3xl drop-shadow-lg transition-transform group-hover:scale-110">
              {sc.icon}
            </span>
            <span className="max-w-full truncate text-[11px] font-medium text-[#e2e8f0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
              {sc.label}
            </span>
          </button>
        );
      })}
    </>
  );
}
