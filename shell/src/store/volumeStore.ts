import { create } from 'zustand';

const STORAGE_KEY = 'scalenix-volume';

interface VolumeStore {
  volume: number;   // 0-100
  muted: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  load: () => void;
}

function persist(data: { volume: number; muted: boolean }) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

export const useVolumeStore = create<VolumeStore>((set, get) => ({
  volume: 75,
  muted: false,

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(100, v));
    set({ volume, muted: volume === 0 });
    persist({ volume, muted: volume === 0 });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    persist({ volume: get().volume, muted });
  },

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({ volume: data.volume ?? 75, muted: data.muted ?? false });
      }
    } catch { /* corrupt */ }
  },
}));
