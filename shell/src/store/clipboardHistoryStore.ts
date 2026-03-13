import { create } from 'zustand';

export interface ClipboardEntry {
  id: string;
  text: string;
  timestamp: number;
}

const MAX_ENTRIES = 20;
const STORAGE_KEY = 'scalenix-clipboard-history';

interface ClipboardHistoryStore {
  entries: ClipboardEntry[];
  addEntry: (text: string) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
  load: () => void;
  broadcastClipboard: (text: string) => void;
}

function saveEntries(entries: ClipboardEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* storage full or unavailable */ }
}

export const useClipboardHistoryStore = create<ClipboardHistoryStore>((set, get) => ({
  entries: [],

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entries: ClipboardEntry[] = JSON.parse(raw);
        set({ entries: entries.slice(0, MAX_ENTRIES) });
      }
    } catch { /* corrupt data */ }
  },

  addEntry: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const { entries } = get();
    // Deduplicate: remove existing entry with same text
    const filtered = entries.filter((e) => e.text !== trimmed);
    const newEntry: ClipboardEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text: trimmed,
      timestamp: Date.now(),
    };
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    set({ entries: updated });
    saveEntries(updated);
  },

  removeEntry: (id: string) => {
    const updated = get().entries.filter((e) => e.id !== id);
    set({ entries: updated });
    saveEntries(updated);
  },

  clearAll: () => {
    set({ entries: [] });
    saveEntries([]);
  },

  broadcastClipboard: (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const message = { type: 'SCALENIX_CLIPBOARD', text: trimmed };
    // Broadcast to all iframes in the document
    const iframes = document.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      try {
        iframe.contentWindow?.postMessage(message, '*');
      } catch { /* cross-origin or unavailable */ }
    });
  },
}));
