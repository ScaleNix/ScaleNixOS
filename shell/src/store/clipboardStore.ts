import { create } from 'zustand';

export interface ClipboardItem {
  name: string;
  path: string;
  isDirectory: boolean;
  /** WebDAV download URL */
  downloadUrl: string;
  contentType: string;
  size: number;
}

interface ClipboardStore {
  items: ClipboardItem[];
  mode: 'copy' | 'cut' | null;
  setClipboard: (items: ClipboardItem[], mode: 'copy' | 'cut') => void;
  clear: () => void;
}

export const useClipboardStore = create<ClipboardStore>((set) => ({
  items: [],
  mode: null,
  setClipboard: (items, mode) => set({ items, mode }),
  clear: () => set({ items: [], mode: null }),
}));
