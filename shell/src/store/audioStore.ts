import { create } from 'zustand';

const STORAGE_KEY = 'scalenix-audio';

interface AudioStore {
  volume: number;           // 0-100
  muted: boolean;
  notificationSound: boolean;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setNotificationSound: (enabled: boolean) => void;
  load: () => void;
}

type PersistData = { volume: number; muted: boolean; notificationSound: boolean };

function persistData(data: PersistData) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* */ }
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  volume: 50,
  muted: false,
  notificationSound: true,

  setVolume: (v) => {
    const volume = Math.max(0, Math.min(100, v));
    const muted = volume === 0;
    set({ volume, muted });
    persistData({ volume, muted, notificationSound: get().notificationSound });
  },

  toggleMute: () => {
    const muted = !get().muted;
    set({ muted });
    persistData({ volume: get().volume, muted, notificationSound: get().notificationSound });
  },

  setNotificationSound: (enabled) => {
    set({ notificationSound: enabled });
    persistData({ volume: get().volume, muted: get().muted, notificationSound: enabled });
  },

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        set({
          volume: data.volume ?? 50,
          muted: data.muted ?? false,
          notificationSound: data.notificationSound ?? true,
        });
      }
    } catch { /* corrupt */ }
  },
}));

// ── Web Audio API sound generator ──────────────────────────────────────

let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function playTone(frequency: number, durationMs: number, gainValue: number, startTime: number) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(gainValue, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationMs / 1000);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + durationMs / 1000);
}

export type SoundType = 'notification' | 'error' | 'success' | 'click';

export function playSound(type: SoundType) {
  const state = useAudioStore.getState();
  if (state.muted || state.volume === 0) return;

  const ctx = getAudioCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const vol = state.volume / 100;
  const now = ctx.currentTime;

  switch (type) {
    case 'notification':
      // Short pleasant ding: 880Hz sine, 150ms
      playTone(880, 150, vol * 0.3, now);
      break;

    case 'error':
      // Two short low beeps: 220Hz, 100ms x2
      playTone(220, 100, vol * 0.3, now);
      playTone(220, 100, vol * 0.3, now + 0.15);
      break;

    case 'success':
      // Ascending two-tone: 440Hz then 660Hz, 100ms each
      playTone(440, 100, vol * 0.3, now);
      playTone(660, 100, vol * 0.3, now + 0.12);
      break;

    case 'click':
      // Very short click: 1000Hz, 30ms
      playTone(1000, 30, vol * 0.15, now);
      break;
  }
}
