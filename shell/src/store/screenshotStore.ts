import { create } from 'zustand';
import { useWindowStore } from './windowStore';

interface ScreenshotStore {
  capturing: boolean;
  lastCapture: string | null;
  isRecording: boolean;
  recordingDuration: number;
  lastRecording: string | null;
  startCapture: () => void;
  finishCapture: (dataUrl: string) => void;
  cancelCapture: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  setRecordingDuration: (duration: number) => void;
  setLastRecording: (url: string | null) => void;
}

export const useScreenshotStore = create<ScreenshotStore>((set) => ({
  capturing: false,
  lastCapture: null,
  isRecording: false,
  recordingDuration: 0,
  lastRecording: null,

  startCapture: () => set({ capturing: true }),

  finishCapture: (dataUrl) => {
    set({ capturing: false, lastCapture: dataUrl });

    // Open a ScreenCapture window to display the screenshot
    const windowStore = useWindowStore.getState();
    windowStore.openWindow({
      id: 'screen-capture',
      label: 'Screenshot',
      icon: '📸',
      description: 'Screenshot capture',
      type: 'native',
      defaultSize: { w: 900, h: 650 },
      category: 'tools',
      color: '#6366f1',
    });
  },

  cancelCapture: () => set({ capturing: false }),

  startRecording: () => set({ isRecording: true, recordingDuration: 0, lastRecording: null }),

  stopRecording: () => set({ isRecording: false }),

  setRecordingDuration: (duration) => set({ recordingDuration: duration }),

  setLastRecording: (url) => set({ lastRecording: url }),
}));
