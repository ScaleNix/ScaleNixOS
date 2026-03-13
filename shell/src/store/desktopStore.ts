import { create } from 'zustand';

export interface DesktopShortcut {
  id: string;
  label: string;
  icon: string;
  type: 'app' | 'file';
  appId?: string;
  filePath?: string;
  fileName?: string;
  fileType?: string;
  col: number;
  row: number;
}

const STORAGE_KEY = 'scalenix-desktop-shortcuts';
const MAX_COLS = 20;
const MAX_ROWS = 20;

const DEFAULT_SHORTCUTS: DesktopShortcut[] = [
  { id: 'sc-files', label: 'Fichiers', icon: '\ud83d\udcc1', type: 'app', appId: 'nextcloud-files', col: 0, row: 0 },
  { id: 'sc-mail', label: 'Messagerie', icon: '\u2709\ufe0f', type: 'app', appId: 'zimbra-mail', col: 0, row: 1 },
  { id: 'sc-calendar', label: 'Agenda', icon: '\ud83d\udcc5', type: 'app', appId: 'zimbra-calendar', col: 0, row: 2 },
  { id: 'sc-editor', label: '\u00c9diteur', icon: '\ud83d\udcdd', type: 'app', appId: 'onlyoffice', col: 0, row: 3 },
  { id: 'sc-libreoffice', label: 'LibreOffice', icon: '\ud83d\udcda', type: 'app', appId: 'libreoffice', col: 1, row: 0 },
  { id: 'sc-notes', label: 'Notes', icon: '\ud83d\udcdd', type: 'app', appId: 'outline', col: 1, row: 1 },
  { id: 'sc-blog', label: 'Blog', icon: '\u270d\ufe0f', type: 'app', appId: 'ghost', col: 1, row: 2 },
  { id: 'sc-chat', label: 'Chat', icon: '\ud83d\udcac', type: 'app', appId: 'matrix-chat', col: 1, row: 3 },
  { id: 'sc-visio', label: 'Visio', icon: '\ud83d\udcf9', type: 'app', appId: 'livekit-meet', col: 2, row: 0 },
  { id: 'sc-media', label: 'Media', icon: '\ud83c\udfac', type: 'app', appId: 'jellyfin', col: 2, row: 1 },
  { id: 'sc-photos', label: 'Photos', icon: '\ud83d\uddbc\ufe0f', type: 'app', appId: 'immich', col: 2, row: 2 },
  { id: 'sc-terminal', label: 'Terminal', icon: '\ud83d\udcbb', type: 'app', appId: 'terminal', col: 3, row: 0 },
  { id: 'sc-grist', label: 'Grist', icon: '\ud83d\udcca', type: 'app', appId: 'grist', col: 3, row: 1 },
  { id: 'sc-browser', label: 'Navigateur', icon: '\ud83c\udf10', type: 'app', appId: 'browser', col: 3, row: 2 },
];

function findEmptyCell(shortcuts: DesktopShortcut[]): { col: number; row: number } {
  const occupied = new Set(shortcuts.map((s) => `${s.col},${s.row}`));
  for (let col = 0; col < MAX_COLS; col++) {
    for (let row = 0; row < MAX_ROWS; row++) {
      if (!occupied.has(`${col},${row}`)) return { col, row };
    }
  }
  return { col: 0, row: 0 };
}

interface DesktopStore {
  shortcuts: DesktopShortcut[];
  loadShortcuts: () => void;
  addShortcut: (shortcut: Omit<DesktopShortcut, 'id' | 'col' | 'row'>) => void;
  removeShortcut: (id: string) => void;
  moveShortcut: (id: string, col: number, row: number) => void;
  sortIcons: (by: 'name' | 'type' | 'date') => void;
}

function persist(shortcuts: DesktopShortcut[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch { /* quota exceeded */ }
}

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  shortcuts: [],

  loadShortcuts: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DesktopShortcut[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          set({ shortcuts: parsed });
          return;
        }
      }
    } catch { /* corrupted */ }
    set({ shortcuts: DEFAULT_SHORTCUTS });
    persist(DEFAULT_SHORTCUTS);
  },

  addShortcut: (partial) => {
    const { shortcuts } = get();
    const { col, row } = findEmptyCell(shortcuts);
    const newShortcut: DesktopShortcut = {
      ...partial,
      id: `sc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      col,
      row,
    };
    const next = [...shortcuts, newShortcut];
    set({ shortcuts: next });
    persist(next);
  },

  removeShortcut: (id) => {
    const next = get().shortcuts.filter((s) => s.id !== id);
    set({ shortcuts: next });
    persist(next);
  },

  moveShortcut: (id, col, row) => {
    const next = get().shortcuts.map((s) => (s.id === id ? { ...s, col, row } : s));
    set({ shortcuts: next });
    persist(next);
  },

  sortIcons: (by) => {
    const sorted = [...get().shortcuts];
    switch (by) {
      case 'name':
        sorted.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
        break;
      case 'type':
        sorted.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'app' ? -1 : 1;
          return a.label.localeCompare(b.label, 'fr');
        });
        break;
      case 'date':
        // Sort by id which contains a timestamp (newer first)
        sorted.sort((a, b) => {
          const tsA = parseInt(a.id.replace(/^sc-/, '').split('-')[0]) || 0;
          const tsB = parseInt(b.id.replace(/^sc-/, '').split('-')[0]) || 0;
          return tsB - tsA;
        });
        break;
    }
    // Re-assign grid positions column-first
    const next = sorted.map((s, i) => ({
      ...s,
      col: Math.floor(i / MAX_ROWS),
      row: i % MAX_ROWS,
    }));
    set({ shortcuts: next });
    persist(next);
  },
}));
