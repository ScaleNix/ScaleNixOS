import { useCallback, useRef } from 'react';
import { useWindowStore, TOPBAR_HEIGHT } from '../store/windowStore';

export function useWindowDrag(windowId: string) {
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      if ((e.target as HTMLElement).closest('button')) return;

      e.preventDefault();
      const store = useWindowStore.getState();
      const win = store.windows.find((w) => w.id === windowId);
      if (!win) return;

      // If maximized or snapped, unsnap on drag start
      if (win.status === 'maximized' || win.snapZone) {
        store.restoreWindow(windowId);
        const restored = useWindowStore.getState().windows.find((w) => w.id === windowId);
        if (!restored) return;
        // Center window under cursor
        const newX = e.clientX - restored.w / 2;
        const newY = e.clientY - 19;
        store.moveWindow(windowId, newX, newY);
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: newX, origY: newY };
      } else {
        dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.x, origY: win.y };
      }

      store.setDragging(true);

      const overlay = document.createElement('div');
      overlay.id = 'drag-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:999999;cursor:grabbing;';
      document.body.appendChild(overlay);

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = ev.clientX - dragRef.current.startX;
        const dy = ev.clientY - dragRef.current.startY;
        let newX = dragRef.current.origX + dx;
        let newY = dragRef.current.origY + dy;

        newX = Math.max(-200, Math.min(newX, window.innerWidth - 100));
        newY = Math.max(TOPBAR_HEIGHT, Math.min(newY, window.innerHeight - 50));

        useWindowStore.getState().moveWindow(windowId, newX, newY);

        // Snap preview detection
        let snapZone: 'left' | 'right' | 'maximize' | null = null;
        if (ev.clientY <= TOPBAR_HEIGHT + 8) {
          snapZone = 'maximize';
        } else if (ev.clientX <= 8) {
          snapZone = 'left';
        } else if (ev.clientX >= window.innerWidth - 8) {
          snapZone = 'right';
        }

        const current = useWindowStore.getState().snapPreview;
        if (snapZone) {
          if (!current || current.zone !== snapZone) {
            useWindowStore.getState().setSnapPreview({ zone: snapZone, windowId });
          }
        } else if (current) {
          useWindowStore.getState().setSnapPreview(null);
        }
      };

      const onMouseUp = () => {
        const preview = useWindowStore.getState().snapPreview;
        if (preview && preview.windowId === windowId) {
          useWindowStore.getState().snapWindow(windowId, preview.zone);
          useWindowStore.getState().setSnapPreview(null);
        }

        dragRef.current = null;
        useWindowStore.getState().setDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.getElementById('drag-overlay')?.remove();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [windowId],
  );

  return { onMouseDown };
}

export function useWindowResize(windowId: string) {
  const resizeRef = useRef<{
    startX: number; startY: number;
    origX: number; origY: number;
    origW: number; origH: number;
    edge: string;
  } | null>(null);

  const onResizeStart = useCallback(
    (e: React.MouseEvent, edge: string) => {
      e.preventDefault();
      e.stopPropagation();
      const win = useWindowStore.getState().windows.find((w) => w.id === windowId);
      if (!win || win.status === 'maximized') return;

      useWindowStore.getState().setDragging(true);

      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: win.x,
        origY: win.y,
        origW: win.w,
        origH: win.h,
        edge,
      };

      const overlay = document.createElement('div');
      overlay.id = 'resize-overlay';
      overlay.style.cssText = `position:fixed;inset:0;z-index:999999;cursor:${getCursor(edge)};`;
      document.body.appendChild(overlay);

      const onMouseMove = (ev: MouseEvent) => {
        if (!resizeRef.current) return;
        const r = resizeRef.current;
        const dx = ev.clientX - r.startX;
        const dy = ev.clientY - r.startY;
        const store = useWindowStore.getState();

        let newX = r.origX;
        let newY = r.origY;
        let newW = r.origW;
        let newH = r.origH;

        if (r.edge.includes('e')) newW = r.origW + dx;
        if (r.edge.includes('w')) { newW = r.origW - dx; newX = r.origX + dx; }
        if (r.edge.includes('s')) newH = r.origH + dy;
        if (r.edge.includes('n')) { newH = r.origH - dy; newY = r.origY + dy; }

        newW = Math.max(400, newW);
        newH = Math.max(300, newH);

        if (r.edge.includes('w') && newW <= 400) newX = r.origX + r.origW - 400;
        if (r.edge.includes('n') && newH <= 300) newY = r.origY + r.origH - 300;

        store.moveWindow(windowId, newX, newY);
        store.resizeWindow(windowId, newW, newH);
      };

      const onMouseUp = () => {
        resizeRef.current = null;
        useWindowStore.getState().setDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
        document.getElementById('resize-overlay')?.remove();
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [windowId],
  );

  return { onResizeStart };
}

function getCursor(edge: string): string {
  const map: Record<string, string> = {
    n: 'ns-resize', s: 'ns-resize', e: 'ew-resize', w: 'ew-resize',
    ne: 'nesw-resize', nw: 'nwse-resize', se: 'nwse-resize', sw: 'nesw-resize',
  };
  return map[edge] ?? 'default';
}
