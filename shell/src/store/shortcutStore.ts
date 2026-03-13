import { create } from 'zustand';

export interface Shortcut {
  id: string;
  label: string;
  description: string;
  keys: string;
  action: string;
  category: string;
  editable: boolean;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: 'launcher', label: 'Applications', description: 'Ouvrir le lanceur', keys: 'Ctrl+Space', action: 'openLauncher', category: 'system', editable: true },
  { id: 'clipboard', label: 'Presse-papiers', description: 'Historique du presse-papiers', keys: 'Ctrl+Shift+V', action: 'openClipboard', category: 'system', editable: true },
  { id: 'lock', label: 'Verrouiller', description: "Verrouiller l'ecran", keys: 'Ctrl+Alt+L', action: 'lockScreen', category: 'system', editable: true },
  { id: 'screenshot', label: "Capture d'ecran", description: 'Prendre une capture', keys: 'Ctrl+Shift+S', action: 'screenshot', category: 'system', editable: true },
  { id: 'alt-tab', label: 'Alt+Tab', description: 'Basculer entre les fenetres', keys: 'Alt+Tab', action: 'altTab', category: 'navigation', editable: false },
  { id: 'fullscreen', label: 'Plein ecran', description: 'Basculer le mode plein ecran', keys: 'F11', action: 'toggleFullscreen', category: 'system', editable: false },
  { id: 'show-desktop', label: 'Bureau', description: 'Afficher le bureau', keys: 'Ctrl+D', action: 'showDesktop', category: 'navigation', editable: true },
  { id: 'close-window', label: 'Fermer', description: 'Fermer la fenetre active', keys: 'Alt+F4', action: 'closeWindow', category: 'navigation', editable: true },
  { id: 'workspace-1', label: 'Bureau 1', description: 'Basculer vers le bureau 1', keys: 'Ctrl+Alt+1', action: 'switchWorkspace1', category: 'navigation', editable: true },
  { id: 'workspace-2', label: 'Bureau 2', description: 'Basculer vers le bureau 2', keys: 'Ctrl+Alt+2', action: 'switchWorkspace2', category: 'navigation', editable: true },
  { id: 'workspace-3', label: 'Bureau 3', description: 'Basculer vers le bureau 3', keys: 'Ctrl+Alt+3', action: 'switchWorkspace3', category: 'navigation', editable: true },
  { id: 'files', label: 'Fichiers', description: "Ouvrir l'explorateur", keys: 'Ctrl+E', action: 'openFiles', category: 'apps', editable: true },
  { id: 'terminal', label: 'Terminal', description: 'Ouvrir le terminal', keys: 'Ctrl+Alt+T', action: 'openTerminal', category: 'apps', editable: true },
];

const STORAGE_KEY = 'scalenix-shortcuts';

interface ShortcutStore {
  shortcuts: Shortcut[];
  editing: string | null;
  updateShortcut: (id: string, keys: string) => void;
  resetDefaults: () => void;
  setEditing: (id: string | null) => void;
  getShortcut: (id: string) => Shortcut | undefined;
}

function persist(shortcuts: Shortcut[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts));
  } catch { /* quota exceeded */ }
}

function loadFromStorage(): Shortcut[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Shortcut[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Merge with defaults to pick up any new shortcuts added in updates
        const savedMap = new Map(parsed.map((s) => [s.id, s]));
        return DEFAULT_SHORTCUTS.map((def) => {
          const saved = savedMap.get(def.id);
          return saved ? { ...def, keys: saved.keys } : def;
        });
      }
    }
  } catch { /* corrupted */ }
  return [...DEFAULT_SHORTCUTS];
}

export const useShortcutStore = create<ShortcutStore>((set, get) => ({
  shortcuts: loadFromStorage(),
  editing: null,

  updateShortcut: (id, keys) => {
    const next = get().shortcuts.map((s) => (s.id === id ? { ...s, keys } : s));
    set({ shortcuts: next, editing: null });
    persist(next);
  },

  resetDefaults: () => {
    const defaults = DEFAULT_SHORTCUTS.map((s) => ({ ...s }));
    set({ shortcuts: defaults, editing: null });
    persist(defaults);
  },

  setEditing: (id) => {
    set({ editing: id });
  },

  getShortcut: (id) => {
    return get().shortcuts.find((s) => s.id === id);
  },
}));
