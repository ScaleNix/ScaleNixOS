import { create } from 'zustand';

const STORAGE_KEY = 'scalenix-lock';

interface LockStore {
  locked: boolean;
  idleTimeout: number; // minutes
  lock: () => void;
  unlock: () => void;
  setIdleTimeout: (minutes: number) => void;
}

function loadIdleTimeout(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (typeof data.idleTimeout === 'number' && data.idleTimeout > 0) {
        return data.idleTimeout;
      }
    }
  } catch { /* corrupt */ }
  return 5;
}

function persistIdleTimeout(minutes: number) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ idleTimeout: minutes }));
  } catch { /* */ }
}

export const useLockStore = create<LockStore>((set) => ({
  locked: false,
  idleTimeout: loadIdleTimeout(),

  lock: () => set({ locked: true }),

  unlock: () => set({ locked: false }),

  setIdleTimeout: (minutes) => {
    set({ idleTimeout: minutes });
    persistIdleTimeout(minutes);
  },
}));
