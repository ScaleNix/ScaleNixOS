import { create } from 'zustand';
import type { AppManifest, WindowState } from '../types/app.types';
import { useWorkspaceStore } from './workspaceStore';

export const TOPBAR_HEIGHT = 0;
export const TASKBAR_HEIGHT = 44;
const MIN_W = 400;
const MIN_H = 300;

const SESSION_KEY = 'scalenix-session';

/* ---- Session persistence helpers ---- */

type PersistedWindow = Pick<
  WindowState,
  'id' | 'appId' | 'title' | 'icon' | 'x' | 'y' | 'w' | 'h' | 'status' | 'workspaceId' | 'iframeUrl' | 'snapZone'
>;

function serializeWindows(windows: WindowState[]): PersistedWindow[] {
  return windows
    .filter((w) => w.appId !== '_file-viewer') // transient — don't persist
    .map(({ id, appId, title, icon, x, y, w, h, status, workspaceId, iframeUrl, snapZone }) => ({
      id, appId, title, icon, x, y, w, h, status, workspaceId, iframeUrl, snapZone,
    }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(windows: WindowState[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(serializeWindows(windows)));
    } catch { /* storage full — ignore */ }
  }, 2000);
}

interface WindowStore {
  windows: WindowState[];
  activeWindowId: string | null;
  maxZIndex: number;
  dragging: boolean;
  snapPreview: { zone: 'left' | 'right' | 'maximize'; windowId: string } | null;
  openWindow: (app: AppManifest) => void;
  openEditorWindow: (title: string, icon: string, iframeUrl: string, size?: { w: number; h: number }) => void;
  openFileViewer: (
    fileName: string,
    fileUrl: string,
    fileType: 'image' | 'video' | 'pdf' | 'audio' | 'markdown',
    siblings?: Array<{ url: string; name: string; type: 'image' | 'video' | 'pdf' | 'audio' | 'markdown' }>,
  ) => void;
  focusOrOpen: (app: AppManifest) => void;
  closeWindow: (id: string) => void;
  closeAllByApp: (appId: string) => void;
  minimizeWindow: (id: string) => void;
  minimizeAll: () => void;
  maximizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  focusWindow: (id: string) => void;
  moveWindow: (id: string, x: number, y: number) => void;
  resizeWindow: (id: string, w: number, h: number) => void;
  snapWindow: (id: string, zone: 'left' | 'right' | 'maximize') => void;
  togglePip: (windowId: string) => void;
  moveToWorkspace: (windowId: string, workspaceId: number) => void;
  openBrowserUrl: (url: string) => void;
  setDragging: (v: boolean) => void;
  setSnapPreview: (preview: { zone: 'left' | 'right' | 'maximize'; windowId: string } | null) => void;
  restoreSession: () => void;
  clearSession: () => void;
}

export const useWindowStore = create<WindowStore>((set, get) => ({
  windows: [],
  activeWindowId: null,
  maxZIndex: 1,
  dragging: false,
  snapPreview: null,

  openWindow: (app) => {
    const { windows, maxZIndex } = get();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const usableH = vh - TOPBAR_HEIGHT - TASKBAR_HEIGHT;
    const openCount = windows.filter((w) => w.status !== 'minimized').length;
    const offset = openCount * 30;
    const w = Math.min(app.defaultSize.w, vw - 40);
    const h = Math.min(app.defaultSize.h, usableH - 20);
    const x = Math.max(0, Math.floor((vw - w) / 2) + offset);
    const y = Math.max(TOPBAR_HEIGHT, Math.floor((usableH - h) / 2) + TOPBAR_HEIGHT + offset);
    const newZ = maxZIndex + 1;
    const id = `${app.id}-${Date.now()}`;

    const workspaceId = useWorkspaceStore.getState().activeWorkspaceId;
    set({
      windows: [
        ...windows,
        { id, appId: app.id, title: app.label, icon: app.icon, x, y, w, h, zIndex: newZ, status: 'open', workspaceId },
      ],
      activeWindowId: id,
      maxZIndex: newZ,
    });
  },

  openEditorWindow: (title, icon, iframeUrl, size) => {
    const { windows, maxZIndex } = get();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const usableH = vh - TOPBAR_HEIGHT - TASKBAR_HEIGHT;
    const openCount = windows.filter((w) => w.status !== 'minimized').length;
    const offset = openCount * 30;
    const w = Math.min(size?.w ?? 1280, vw - 40);
    const h = Math.min(size?.h ?? 800, usableH - 20);
    const x = Math.max(0, Math.floor((vw - w) / 2) + offset);
    const y = Math.max(TOPBAR_HEIGHT, Math.floor((usableH - h) / 2) + TOPBAR_HEIGHT + offset);
    const newZ = maxZIndex + 1;
    const id = `editor-${Date.now()}`;

    set({
      windows: [
        ...windows,
        { id, appId: '_editor', title, icon, x, y, w, h, zIndex: newZ, status: 'open', iframeUrl, workspaceId: useWorkspaceStore.getState().activeWorkspaceId },
      ],
      activeWindowId: id,
      maxZIndex: newZ,
    });
  },

  openFileViewer: (fileName, fileUrl, fileType, siblings) => {
    const { windows, maxZIndex } = get();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const usableH = vh - TOPBAR_HEIGHT - TASKBAR_HEIGHT;
    const openCount = windows.filter((w) => w.status !== 'minimized').length;
    const offset = openCount * 30;
    const defaultW = fileType === 'video' ? 960 : 800;
    const defaultH = fileType === 'video' ? 640 : 600;
    const w = Math.min(defaultW, vw - 40);
    const h = Math.min(defaultH, usableH - 20);
    const x = Math.max(0, Math.floor((vw - w) / 2) + offset);
    const y = Math.max(TOPBAR_HEIGHT, Math.floor((usableH - h) / 2) + TOPBAR_HEIGHT + offset);
    const newZ = maxZIndex + 1;
    const id = `viewer-${Date.now()}`;

    const iconMap = { image: '\ud83d\uddbc\ufe0f', video: '\ud83c\udfac', pdf: '\ud83d\udcc4', audio: '\ud83c\udfb5', markdown: '\ud83d\udcdd' };

    set({
      windows: [
        ...windows,
        {
          id,
          appId: '_file-viewer',
          title: fileName,
          icon: iconMap[fileType] ?? '\ud83d\udcc4',
          x, y, w, h,
          zIndex: newZ,
          status: 'open',
          fileViewer: { fileUrl, fileName, fileType, siblings },
          workspaceId: useWorkspaceStore.getState().activeWorkspaceId,
        },
      ],
      activeWindowId: id,
      maxZIndex: newZ,
    });
  },

  focusOrOpen: (app) => {
    const { windows } = get();
    const appWindows = windows
      .filter((w) => w.appId === app.id)
      .sort((a, b) => b.zIndex - a.zIndex);

    if (appWindows.length === 0) {
      get().openWindow(app);
      return;
    }

    const top = appWindows[0];
    if (top.status === 'minimized') {
      get().restoreWindow(top.id);
      get().focusWindow(top.id);
    } else if (get().activeWindowId === top.id) {
      // Already focused — minimize (Windows-style toggle)
      get().minimizeWindow(top.id);
    } else {
      get().focusWindow(top.id);
    }
  },

  closeWindow: (id) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.id !== id),
      activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
    })),

  closeAllByApp: (appId) =>
    set((s) => ({
      windows: s.windows.filter((w) => w.appId !== appId),
      activeWindowId: s.windows.find((w) => w.id === s.activeWindowId)?.appId === appId ? null : s.activeWindowId,
    })),

  minimizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, status: 'minimized' as const } : w)),
      activeWindowId: s.activeWindowId === id ? null : s.activeWindowId,
    })),

  minimizeAll: () =>
    set((s) => ({
      windows: s.windows.map((w) => (w.status !== 'minimized' ? { ...w, status: 'minimized' as const } : w)),
      activeWindowId: null,
    })),

  maximizeWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) =>
        w.id === id
          ? {
              ...w,
              status: 'maximized' as const,
              prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
              x: 0,
              y: TOPBAR_HEIGHT,
              w: window.innerWidth,
              h: window.innerHeight - TOPBAR_HEIGHT - TASKBAR_HEIGHT,
              snapZone: null,
            }
          : w,
      ),
    })),

  restoreWindow: (id) =>
    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        if ((w.status === 'maximized' || w.snapZone) && w.prevBounds) {
          return { ...w, status: 'open' as const, ...w.prevBounds, prevBounds: undefined, snapZone: null };
        }
        return { ...w, status: 'open' as const, snapZone: null };
      }),
      activeWindowId: id,
    })),

  toggleMaximize: (id) => {
    const win = get().windows.find((w) => w.id === id);
    if (!win) return;
    if (win.status === 'maximized') get().restoreWindow(id);
    else get().maximizeWindow(id);
  },

  focusWindow: (id) => {
    const newZ = get().maxZIndex + 1;
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, zIndex: newZ } : w)),
      activeWindowId: id,
      maxZIndex: newZ,
    }));
  },

  moveWindow: (id, x, y) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === id ? { ...w, x, y } : w)),
    })),

  resizeWindow: (id, w, h) =>
    set((s) => ({
      windows: s.windows.map((win) =>
        win.id === id ? { ...win, w: Math.max(MIN_W, w), h: Math.max(MIN_H, h) } : win,
      ),
    })),

  snapWindow: (id, zone) => {
    const vw = window.innerWidth;
    const usableH = window.innerHeight - TOPBAR_HEIGHT - TASKBAR_HEIGHT;

    if (zone === 'maximize') {
      get().maximizeWindow(id);
      return;
    }

    set((s) => ({
      windows: s.windows.map((w) => {
        if (w.id !== id) return w;
        const prevBounds = w.prevBounds ?? { x: w.x, y: w.y, w: w.w, h: w.h };
        if (zone === 'left') {
          return { ...w, prevBounds, status: 'open' as const, snapZone: 'left' as const, x: 0, y: TOPBAR_HEIGHT, w: Math.floor(vw / 2), h: usableH };
        }
        return { ...w, prevBounds, status: 'open' as const, snapZone: 'right' as const, x: Math.floor(vw / 2), y: TOPBAR_HEIGHT, w: Math.floor(vw / 2), h: usableH };
      }),
    }));
  },

  togglePip: (windowId) => {
    const win = get().windows.find((w) => w.id === windowId);
    if (!win) return;
    const newZ = get().maxZIndex + 1;

    if (win.pip) {
      // Restore from PiP
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === windowId
            ? {
                ...w,
                pip: false,
                zIndex: newZ,
                ...(w.prevBounds ?? {}),
                prevBounds: undefined,
                status: 'open' as const,
              }
            : w,
        ),
        activeWindowId: windowId,
        maxZIndex: newZ,
      }));
    } else {
      // Enter PiP — save current bounds, shrink to 320x180 bottom-right
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      set((s) => ({
        windows: s.windows.map((w) =>
          w.id === windowId
            ? {
                ...w,
                pip: true,
                prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h },
                x: vw - 320 - 16,
                y: vh - 180 - TASKBAR_HEIGHT - 16,
                w: 320,
                h: 180,
                zIndex: newZ,
                status: 'open' as const,
                snapZone: null,
              }
            : w,
        ),
        activeWindowId: windowId,
        maxZIndex: newZ,
      }));
    }
  },

  moveToWorkspace: (windowId, workspaceId) =>
    set((s) => ({
      windows: s.windows.map((w) => (w.id === windowId ? { ...w, workspaceId } : w)),
    })),

  openBrowserUrl: (url) => {
    const { windows, maxZIndex } = get();
    // Check if a browser window is already open
    const existing = windows.find((w) => w.appId === 'browser' && w.status !== 'minimized');
    if (existing) {
      // Focus it and send the URL via postMessage
      get().focusWindow(existing.id);
      window.postMessage({ type: 'SCALENIX_BROWSER_OPEN', url }, '*');
    } else {
      // Open new browser window
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const usableH = vh - TOPBAR_HEIGHT - TASKBAR_HEIGHT;
      const openCount = windows.filter((w) => w.status !== 'minimized').length;
      const offset = openCount * 30;
      const w = Math.min(1200, vw - 40);
      const h = Math.min(750, usableH - 20);
      const x = Math.max(0, Math.floor((vw - w) / 2) + offset);
      const y = Math.max(TOPBAR_HEIGHT, Math.floor((usableH - h) / 2) + TOPBAR_HEIGHT + offset);
      const newZ = maxZIndex + 1;
      const id = `browser-${Date.now()}`;
      set({
        windows: [
          ...windows,
          { id, appId: 'browser', title: 'Navigateur', icon: '\uD83C\uDF10', x, y, w, h, zIndex: newZ, status: 'open', workspaceId: useWorkspaceStore.getState().activeWorkspaceId },
        ],
        activeWindowId: id,
        maxZIndex: newZ,
      });
      // Send URL after a tick so the component mounts and listens
      setTimeout(() => window.postMessage({ type: 'SCALENIX_BROWSER_OPEN', url }, '*'), 100);
    }
  },

  setDragging: (v) => set({ dragging: v }),
  setSnapPreview: (preview) => set({ snapPreview: preview }),

  restoreSession: () => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const saved: PersistedWindow[] = JSON.parse(raw);
      if (!Array.isArray(saved) || saved.length === 0) return;

      const restored: WindowState[] = saved.map((w, i) => ({
        ...w,
        zIndex: i + 1,
        status: w.status ?? 'open',
      }));

      set({
        windows: restored,
        maxZIndex: restored.length + 1,
        activeWindowId: restored[restored.length - 1]?.id ?? null,
      });
    } catch { /* corrupt data — ignore */ }
  },

  clearSession: () => {
    localStorage.removeItem(SESSION_KEY);
  },
}));

/* Debounced auto-save: persist windows on every state change */
useWindowStore.subscribe((state) => {
  scheduleSave(state.windows);
});
