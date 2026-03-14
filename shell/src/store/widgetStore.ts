import { create } from 'zustand';

export type WidgetType = 'clock' | 'sticky-note' | 'system-monitor' | 'weather' | 'calendar' | 'todo-list' | 'quote' | 'pomodoro' | 'quick-links' | 'zimbra-mail' | 'zimbra-calendar' | 'zimbra-tasks' | 'matrix-chat' | 'nextcloud-files';

export interface Widget {
  id: string;
  type: WidgetType;
  x: number;
  y: number;
  w: number;
  h: number;
  visible: boolean;
  data: Record<string, unknown>;
}

interface WidgetStore {
  widgets: Widget[];
  addWidget: (type: WidgetType, partial?: Partial<Pick<Widget, 'x' | 'y' | 'w' | 'h' | 'data'>>) => void;
  removeWidget: (id: string) => void;
  updateWidget: (id: string, patch: Partial<Omit<Widget, 'id' | 'type'>>) => void;
  toggleWidget: (id: string) => void;
  showAll: () => void;
  hideAll: () => void;
  clearAll: () => void;
  resetPosition: (id: string) => void;
  load: () => void;
}

const STORAGE_KEY = 'scalenix-widgets';

function persist(widgets: Widget[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(widgets));
  } catch { /* quota exceeded */ }
}

const DEFAULT_SIZES: Record<WidgetType, { w: number; h: number }> = {
  clock: { w: 260, h: 140 },
  'sticky-note': { w: 220, h: 200 },
  'system-monitor': { w: 240, h: 180 },
  weather: { w: 280, h: 220 },
  calendar: { w: 260, h: 300 },
  'todo-list': { w: 240, h: 300 },
  quote: { w: 300, h: 160 },
  pomodoro: { w: 240, h: 220 },
  'quick-links': { w: 280, h: 240 },
  'zimbra-mail': { w: 300, h: 320 },
  'zimbra-calendar': { w: 280, h: 300 },
  'zimbra-tasks': { w: 280, h: 280 },
  'matrix-chat': { w: 300, h: 320 },
  'nextcloud-files': { w: 280, h: 300 },
};

export const WIDGET_META: Record<WidgetType, { label: string; icon: string; description: string }> = {
  clock: { label: 'Horloge', icon: '\u23f0', description: 'Heure et date actuelles' },
  'sticky-note': { label: 'Note', icon: '\ud83d\udccc', description: 'Note adhesive modifiable' },
  'system-monitor': { label: 'Moniteur', icon: '\ud83d\udcca', description: 'CPU, RAM et disque' },
  weather: { label: 'Meteo', icon: '\u2600\ufe0f', description: 'Meteo simulee avec previsions' },
  calendar: { label: 'Calendrier', icon: '\ud83d\udcc5', description: 'Mini calendrier du mois' },
  'todo-list': { label: 'Taches', icon: '\u2705', description: 'Liste de taches a cocher' },
  quote: { label: 'Citation', icon: '\ud83d\udcac', description: 'Citation inspirante du jour' },
  pomodoro: { label: 'Pomodoro', icon: '\ud83c\udf45', description: 'Minuteur 25/5 min' },
  'quick-links': { label: 'Liens rapides', icon: '\ud83d\udd17', description: 'Grille de favoris' },
  'zimbra-mail': { label: 'Messagerie', icon: '\u2709\ufe0f', description: 'Emails Zimbra en temps reel' },
  'zimbra-calendar': { label: 'Agenda', icon: '\ud83d\udcc5', description: 'Evenements Zimbra a venir' },
  'zimbra-tasks': { label: 'Taches Zimbra', icon: '\ud83d\udccb', description: 'Taches Zimbra en cours' },
  'matrix-chat': { label: 'Chat', icon: '\ud83d\udcac', description: 'Messages Element/Matrix' },
  'nextcloud-files': { label: 'Fichiers', icon: '\ud83d\udcc1', description: 'Fichiers Nextcloud recents' },
};

export const useWidgetStore = create<WidgetStore>((set, get) => ({
  widgets: [],

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Widget[];
        if (Array.isArray(parsed)) {
          set({ widgets: parsed });
          return;
        }
      }
    } catch { /* corrupted */ }
    // First launch: create default widgets — right-aligned column layout
    const sw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const gap = 16;
    const col1X = sw - 300 - 24;       // Right column
    const col2X = sw - 300 - 280 - 40; // Second column (left of right)

    const defaults: Widget[] = [
      // Right column: Clock → Calendar → Chat
      { id: 'default-clock', type: 'clock', x: col1X, y: 20, w: 280, h: 140, visible: true, data: {} },
      { id: 'default-calendar', type: 'calendar', x: col1X, y: 20 + 140 + gap, w: 280, h: 300, visible: true, data: {} },
      { id: 'default-chat', type: 'matrix-chat', x: col1X, y: 20 + 140 + gap + 300 + gap, w: 280, h: 280, visible: true, data: {} },

      // Second column: Sticky Note → Todo → System Monitor
      { id: 'default-sticky', type: 'sticky-note', x: col2X, y: 20, w: 240, h: 180, visible: true, data: { content: 'Welcome to ScaleNix OS!\n\nUse the launcher to open apps.\nCtrl+K for quick search.', color: 'yellow' } },
      {
        id: 'default-todo', type: 'todo-list', x: col2X, y: 20 + 180 + gap, w: 260, h: 320, visible: true,
        data: {
          items: [
            { id: 't1', text: 'Configure VPN for remote access', done: false },
            { id: 't2', text: 'Review Nextcloud module PR', done: false },
            { id: 't3', text: 'Test Keycloak SSO on mobile', done: false },
            { id: 't4', text: 'Update TLS certificates', done: true },
            { id: 't5', text: 'Deploy Traefik v3 reverse proxy', done: true },
            { id: 't6', text: 'Prepare client demo', done: false },
          ],
        },
      },
      { id: 'default-monitor', type: 'system-monitor', x: col2X, y: 20 + 180 + gap + 320 + gap, w: 260, h: 180, visible: true, data: {} },
    ];
    set({ widgets: defaults });
    persist(defaults);
  },

  addWidget: (type, partial) => {
    const defaults = DEFAULT_SIZES[type];
    const widget: Widget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      x: partial?.x ?? 100 + Math.random() * 200,
      y: partial?.y ?? 100 + Math.random() * 200,
      w: partial?.w ?? defaults.w,
      h: partial?.h ?? defaults.h,
      visible: true,
      data: partial?.data ?? {},
    };
    const next = [...get().widgets, widget];
    set({ widgets: next });
    persist(next);
  },

  removeWidget: (id) => {
    const next = get().widgets.filter((w) => w.id !== id);
    set({ widgets: next });
    persist(next);
  },

  updateWidget: (id, patch) => {
    const next = get().widgets.map((w) => (w.id === id ? { ...w, ...patch } : w));
    set({ widgets: next });
    persist(next);
  },

  toggleWidget: (id) => {
    const next = get().widgets.map((w) =>
      w.id === id ? { ...w, visible: !w.visible } : w,
    );
    set({ widgets: next });
    persist(next);
  },

  showAll: () => {
    const next = get().widgets.map((w) => ({ ...w, visible: true }));
    set({ widgets: next });
    persist(next);
  },

  hideAll: () => {
    const next = get().widgets.map((w) => ({ ...w, visible: false }));
    set({ widgets: next });
    persist(next);
  },

  clearAll: () => {
    set({ widgets: [] });
    persist([]);
  },

  resetPosition: (id) => {
    const next = get().widgets.map((w) =>
      w.id === id ? { ...w, x: 100 + Math.random() * 200, y: 100 + Math.random() * 200 } : w,
    );
    set({ widgets: next });
    persist(next);
  },
}));
