import { create } from 'zustand';

interface BadgeStore {
  badges: Record<string, number>; // appId -> count
  setBadge: (appId: string, count: number) => void;
  clearBadge: (appId: string) => void;
  incrementBadge: (appId: string) => void;
}

export const useBadgeStore = create<BadgeStore>((set) => ({
  badges: { 'zimbra-mail': 3, 'matrix-chat': 7 },

  setBadge: (appId, count) =>
    set((s) => ({
      badges: { ...s.badges, [appId]: count },
    })),

  clearBadge: (appId) =>
    set((s) => {
      const { [appId]: _, ...rest } = s.badges;
      return { badges: rest };
    }),

  incrementBadge: (appId) =>
    set((s) => ({
      badges: { ...s.badges, [appId]: (s.badges[appId] ?? 0) + 1 },
    })),
}));
