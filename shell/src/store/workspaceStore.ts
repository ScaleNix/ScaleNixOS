import { create } from 'zustand';

export interface Workspace {
  id: number;
  name: string;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspaceId: number;
  setActiveWorkspace: (id: number) => void;
  addWorkspace: () => void;
  removeWorkspace: (id: number) => void;
  renameWorkspace: (id: number, name: string) => void;
}

const DEFAULT_WORKSPACES: Workspace[] = [
  { id: 1, name: 'Bureau 1' },
  { id: 2, name: 'Bureau 2' },
  { id: 3, name: 'Bureau 3' },
];

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: DEFAULT_WORKSPACES,
  activeWorkspaceId: 1,

  setActiveWorkspace: (id) => set({ activeWorkspaceId: id }),

  addWorkspace: () =>
    set((s) => {
      if (s.workspaces.length >= 9) return s;
      const maxId = Math.max(...s.workspaces.map((w) => w.id));
      return {
        workspaces: [...s.workspaces, { id: maxId + 1, name: `Bureau ${maxId + 1}` }],
      };
    }),

  removeWorkspace: (id) =>
    set((s) => {
      if (s.workspaces.length <= 1) return s;
      const next = s.workspaces.filter((w) => w.id !== id);
      return {
        workspaces: next,
        activeWorkspaceId: s.activeWorkspaceId === id ? next[0].id : s.activeWorkspaceId,
      };
    }),

  renameWorkspace: (id, name) =>
    set((s) => ({
      workspaces: s.workspaces.map((w) => (w.id === id ? { ...w, name } : w)),
    })),
}));
