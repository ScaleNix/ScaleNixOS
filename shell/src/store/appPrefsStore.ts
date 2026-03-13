import { create } from 'zustand';

const STORAGE_KEY = 'scalenix-app-prefs';

interface AppPrefsState {
  disabledApps: string[];
  toggleApp: (appId: string) => void;
  isDisabled: (appId: string) => boolean;
}

function loadDisabled(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function persist(disabled: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(disabled));
}

export const useAppPrefsStore = create<AppPrefsState>((set, get) => ({
  disabledApps: loadDisabled(),

  toggleApp: (appId: string) => {
    const current = get().disabledApps;
    const next = current.includes(appId)
      ? current.filter((id) => id !== appId)
      : [...current, appId];
    persist(next);
    set({ disabledApps: next });
  },

  isDisabled: (appId: string) => get().disabledApps.includes(appId),
}));
