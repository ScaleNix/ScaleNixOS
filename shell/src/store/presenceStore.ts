import { create } from 'zustand';

export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

const STORAGE_KEY = 'scalenix-presence';
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes

interface PresenceStore {
  status: PresenceStatus;
  idleSince: number | null;
  setStatus: (status: PresenceStatus) => void;
  setIdle: () => void;
  setActive: () => void;
}

function loadPreferred(): PresenceStatus {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (['online', 'away', 'busy', 'offline'].includes(data.status)) {
        return data.status;
      }
    }
  } catch { /* corrupt */ }
  return 'online';
}

function persist(status: PresenceStatus) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ status }));
  } catch { /* */ }
}

export const usePresenceStore = create<PresenceStore>((set, get) => {
  // Idle detection
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const resetIdleTimer = () => {
    const { status } = get();
    // Only auto-idle if status is 'online'
    if (status === 'away' && get().idleSince !== null) {
      // User became active again after idle
      set({ status: 'online', idleSince: null });
    }
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      const current = get();
      if (current.status === 'online') {
        set({ status: 'away', idleSince: Date.now() });
      }
    }, IDLE_TIMEOUT);
  };

  // Attach listeners once (defer to next tick so store is fully created)
  if (typeof window !== 'undefined') {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    setTimeout(() => {
      events.forEach((evt) => window.addEventListener(evt, resetIdleTimer, { passive: true }));
      resetIdleTimer();
    }, 0);
  }

  return {
    status: loadPreferred(),
    idleSince: null,

    setStatus: (status) => {
      set({ status, idleSince: null });
      persist(status);
    },

    setIdle: () => {
      set({ status: 'away', idleSince: Date.now() });
    },

    setActive: () => {
      const { status } = get();
      if (status === 'away' && get().idleSince !== null) {
        set({ status: 'online', idleSince: null });
      }
    },
  };
});
