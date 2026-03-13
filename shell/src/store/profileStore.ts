import { create } from 'zustand';

const STORAGE_KEY = 'scalenix-profile';

interface ProfileStore {
  avatar: string | null;
  statusMessage: string;
  displayName: string;
  avatarColor: string;
  setAvatar: (url: string | null) => void;
  setStatusMessage: (msg: string) => void;
  setDisplayName: (name: string) => void;
  setAvatarColor: (color: string) => void;
}

function loadPersisted(): Partial<ProfileStore> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return {};
}

function persist(state: Pick<ProfileStore, 'avatar' | 'statusMessage' | 'displayName' | 'avatarColor'>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* */ }
}

const saved = loadPersisted();

export const useProfileStore = create<ProfileStore>((set, get) => ({
  avatar: saved.avatar ?? null,
  statusMessage: saved.statusMessage ?? '',
  displayName: saved.displayName ?? '',
  avatarColor: saved.avatarColor ?? '#8b5cf6',

  setAvatar: (url) => {
    set({ avatar: url });
    const s = get();
    persist({ avatar: s.avatar, statusMessage: s.statusMessage, displayName: s.displayName, avatarColor: s.avatarColor });
  },

  setStatusMessage: (msg) => {
    set({ statusMessage: msg });
    const s = get();
    persist({ avatar: s.avatar, statusMessage: s.statusMessage, displayName: s.displayName, avatarColor: s.avatarColor });
  },

  setDisplayName: (name) => {
    set({ displayName: name });
    const s = get();
    persist({ avatar: s.avatar, statusMessage: s.statusMessage, displayName: s.displayName, avatarColor: s.avatarColor });
  },

  setAvatarColor: (color) => {
    set({ avatarColor: color });
    const s = get();
    persist({ avatar: s.avatar, statusMessage: s.statusMessage, displayName: s.displayName, avatarColor: s.avatarColor });
  },
}));
