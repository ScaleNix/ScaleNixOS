import { create } from 'zustand';

export interface ThemeColors {
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
}

export interface WallpaperConfig {
  type: 'gradient' | 'solid' | 'image';
  value: string; // CSS gradient, hex color, or data URL / object URL
}

export interface ThemePreset {
  id: string;
  name: string;
  colors: ThemeColors;
  wallpaper: WallpaperConfig;
}

export interface CommunityTheme {
  name: string;
  colors: ThemeColors;
}

export const COMMUNITY_THEMES: CommunityTheme[] = [
  {
    name: 'Nord',
    colors: {
      bg: '#2e3440', surface: '#3b4252', surfaceAlt: '#434c5e',
      border: '#4c566a', accent: '#88c0d0',
      textPrimary: '#eceff4', textSecondary: '#d8dee9',
    },
  },
  {
    name: 'Dracula',
    colors: {
      bg: '#282a36', surface: '#44475a', surfaceAlt: '#383a4a',
      border: '#6272a4', accent: '#bd93f9',
      textPrimary: '#f8f8f2', textSecondary: '#bfbfbf',
    },
  },
  {
    name: 'Solarized Dark',
    colors: {
      bg: '#002b36', surface: '#073642', surfaceAlt: '#0a3f4c',
      border: '#586e75', accent: '#b58900',
      textPrimary: '#839496', textSecondary: '#657b83',
    },
  },
  {
    name: 'Catppuccin Mocha',
    colors: {
      bg: '#1e1e2e', surface: '#313244', surfaceAlt: '#292940',
      border: '#45475a', accent: '#cba6f7',
      textPrimary: '#cdd6f4', textSecondary: '#a6adc8',
    },
  },
  {
    name: 'Rose Pine',
    colors: {
      bg: '#191724', surface: '#1f1d2e', surfaceAlt: '#26233a',
      border: '#403d52', accent: '#eb6f92',
      textPrimary: '#e0def4', textSecondary: '#908caa',
    },
  },
];

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#0a0f1e', surface: '#111827', surfaceAlt: '#0d1117',
      border: '#1f2937', accent: '#4361ee',
      textPrimary: '#e2e8f0', textSecondary: '#64748b',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 80% 10%, rgba(67,97,238,0.15) 0%, transparent 60%)' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#0b1622', surface: '#0f1d2e', surfaceAlt: '#0a1628',
      border: '#1a3050', accent: '#0ea5e9',
      textPrimary: '#e0f2fe', textSecondary: '#7dd3fc',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 30% 80%, rgba(14,165,233,0.18) 0%, transparent 55%), radial-gradient(ellipse at 70% 20%, rgba(6,182,212,0.12) 0%, transparent 50%)' },
  },
  {
    id: 'aurora',
    name: 'Aurora',
    colors: {
      bg: '#0a0f1a', surface: '#111827', surfaceAlt: '#0e1420',
      border: '#1e2d3d', accent: '#8b5cf6',
      textPrimary: '#ede9fe', textSecondary: '#a78bfa',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 20% 50%, rgba(139,92,246,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 30%, rgba(236,72,153,0.1) 0%, transparent 50%)' },
  },
  {
    id: 'forest',
    name: 'Forest',
    colors: {
      bg: '#0a1510', surface: '#111f17', surfaceAlt: '#0d1812',
      border: '#1a3328', accent: '#22c55e',
      textPrimary: '#dcfce7', textSecondary: '#86efac',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 50% 80%, rgba(34,197,94,0.12) 0%, transparent 55%), radial-gradient(ellipse at 80% 20%, rgba(16,185,129,0.1) 0%, transparent 50%)' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    colors: {
      bg: '#1a0a0a', surface: '#1f1111', surfaceAlt: '#1a0d0d',
      border: '#3d1e1e', accent: '#f97316',
      textPrimary: '#fff7ed', textSecondary: '#fdba74',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 30% 70%, rgba(249,115,22,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 30%, rgba(239,68,68,0.1) 0%, transparent 50%)' },
  },
  {
    id: 'light',
    name: 'Light',
    colors: {
      bg: '#f1f5f9', surface: '#ffffff', surfaceAlt: '#f8fafc',
      border: '#e2e8f0', accent: '#4361ee',
      textPrimary: '#1e293b', textSecondary: '#64748b',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 80% 10%, rgba(67,97,238,0.08) 0%, transparent 60%)' },
  },
  {
    id: 'rose',
    name: 'Rose',
    colors: {
      bg: '#1a0a14', surface: '#1f1018', surfaceAlt: '#180c12',
      border: '#3d1e30', accent: '#ec4899',
      textPrimary: '#fce7f3', textSecondary: '#f9a8d4',
    },
    wallpaper: { type: 'gradient', value: 'radial-gradient(ellipse at 60% 60%, rgba(236,72,153,0.15) 0%, transparent 50%), radial-gradient(ellipse at 20% 20%, rgba(168,85,247,0.1) 0%, transparent 50%)' },
  },
];

const STORAGE_KEY = 'scalenix-theme';

export type TaskbarPosition = 'bottom' | 'top' | 'left' | 'right';
export type TaskbarSize = 'small' | 'medium' | 'large';
export type AnimationSpeed = 'slow' | 'normal' | 'fast';
export type AutoThemeMode = 'off' | 'system' | 'schedule';

export const TASKBAR_SIZE_PX: Record<TaskbarSize, number> = {
  small: 40,
  medium: 48,
  large: 56,
};

export const ANIMATION_DURATION: Record<AnimationSpeed, number> = {
  slow: 0.4,
  normal: 0.2,
  fast: 0.1,
};

interface ThemeStore {
  themeId: string;
  colors: ThemeColors;
  wallpaper: WallpaperConfig;
  customWallpaper: string | null;

  // Feature #23 – Configurable Taskbar
  taskbarPosition: TaskbarPosition;
  taskbarSize: TaskbarSize;
  taskbarAutoHide: boolean;

  // Feature #25 – Configurable Animations
  animationsEnabled: boolean;
  animationSpeed: AnimationSpeed;

  // Auto theme switching
  autoTheme: AutoThemeMode;
  scheduleLight: string;
  scheduleDark: string;

  load: () => void;
  setTheme: (presetId: string) => void;
  setCustomWallpaper: (dataUrl: string | null) => void;
  setAccentColor: (color: string) => void;
  setTaskbarPosition: (position: TaskbarPosition) => void;
  setTaskbarSize: (size: TaskbarSize) => void;
  setTaskbarAutoHide: (autoHide: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setAnimationSpeed: (speed: AnimationSpeed) => void;

  // Auto theme switching
  setAutoTheme: (mode: AutoThemeMode) => void;
  setSchedule: (light: string, dark: string) => void;

  // Feature #24 – Community Themes (import/export)
  applyCustomColors: (name: string, colors: ThemeColors) => void;
}

function applyCSS(colors: ThemeColors) {
  const root = document.documentElement;
  root.style.setProperty('--theme-bg', colors.bg);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-alt', colors.surfaceAlt);
  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-text', colors.textPrimary);
  root.style.setProperty('--theme-text2', colors.textSecondary);
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  themeId: 'midnight',
  colors: THEME_PRESETS[0].colors,
  wallpaper: THEME_PRESETS[0].wallpaper,
  customWallpaper: null,

  // Feature #23 defaults
  taskbarPosition: 'bottom',
  taskbarSize: 'medium',
  taskbarAutoHide: false,

  // Feature #25 defaults
  animationsEnabled: true,
  animationSpeed: 'normal',

  // Auto theme defaults
  autoTheme: 'off',
  scheduleLight: '08:00',
  scheduleDark: '20:00',

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const preset = THEME_PRESETS.find((p) => p.id === data.themeId);
        if (preset) {
          const colors = { ...preset.colors, ...(data.accentOverride ? { accent: data.accentOverride } : {}) };
          applyCSS(colors);
          set({
            themeId: data.themeId,
            colors,
            wallpaper: preset.wallpaper,
            customWallpaper: data.customWallpaper ?? null,
            taskbarPosition: data.taskbarPosition ?? 'bottom',
            taskbarSize: data.taskbarSize ?? 'medium',
            taskbarAutoHide: data.taskbarAutoHide ?? false,
            animationsEnabled: data.animationsEnabled ?? true,
            animationSpeed: data.animationSpeed ?? 'normal',
            autoTheme: data.autoTheme ?? 'off',
            scheduleLight: data.scheduleLight ?? '08:00',
            scheduleDark: data.scheduleDark ?? '20:00',
          });
          return;
        }
        // Feature #24 – Restore custom / community / imported theme
        if (data.customColors) {
          applyCSS(data.customColors);
          set({
            themeId: data.themeId,
            colors: data.customColors,
            wallpaper: { type: 'solid', value: data.customColors.bg },
            customWallpaper: data.customWallpaper ?? null,
            taskbarPosition: data.taskbarPosition ?? 'bottom',
            taskbarSize: data.taskbarSize ?? 'medium',
            taskbarAutoHide: data.taskbarAutoHide ?? false,
            animationsEnabled: data.animationsEnabled ?? true,
            animationSpeed: data.animationSpeed ?? 'normal',
            autoTheme: data.autoTheme ?? 'off',
            scheduleLight: data.scheduleLight ?? '08:00',
            scheduleDark: data.scheduleDark ?? '20:00',
          });
          return;
        }
      }
    } catch { /* corrupt */ }
    applyCSS(THEME_PRESETS[0].colors);
  },

  setTheme: (presetId) => {
    const preset = THEME_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    applyCSS(preset.colors);
    set({ themeId: presetId, colors: preset.colors, wallpaper: preset.wallpaper });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, themeId: presetId, accentOverride: null }));
    } catch { /* */ }
  },

  setCustomWallpaper: (dataUrl) => {
    set({ customWallpaper: dataUrl });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, customWallpaper: dataUrl }));
    } catch { /* */ }
  },

  setAccentColor: (color) => {
    const { colors, themeId } = get();
    const newColors = { ...colors, accent: color };
    applyCSS(newColors);
    set({ colors: newColors });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, themeId, accentOverride: color }));
    } catch { /* */ }
  },

  // Feature #23 – Configurable Taskbar actions
  setTaskbarPosition: (position) => {
    set({ taskbarPosition: position });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, taskbarPosition: position }));
    } catch { /* */ }
  },

  setTaskbarSize: (size) => {
    set({ taskbarSize: size });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, taskbarSize: size }));
    } catch { /* */ }
  },

  setTaskbarAutoHide: (autoHide) => {
    set({ taskbarAutoHide: autoHide });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, taskbarAutoHide: autoHide }));
    } catch { /* */ }
  },

  // Feature #25 – Configurable Animations actions
  setAnimationsEnabled: (enabled) => {
    set({ animationsEnabled: enabled });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, animationsEnabled: enabled }));
    } catch { /* */ }
  },

  setAnimationSpeed: (speed) => {
    set({ animationSpeed: speed });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, animationSpeed: speed }));
    } catch { /* */ }
  },

  // Auto theme switching actions
  setAutoTheme: (mode) => {
    set({ autoTheme: mode });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, autoTheme: mode }));
    } catch { /* */ }
  },

  setSchedule: (light, dark) => {
    set({ scheduleLight: light, scheduleDark: dark });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, scheduleLight: light, scheduleDark: dark }));
    } catch { /* */ }
  },

  // Feature #24 – Apply custom / community / imported theme colors
  applyCustomColors: (name, colors) => {
    const id = `custom-${name.toLowerCase().replace(/\s+/g, '-')}`;
    applyCSS(colors);
    set({
      themeId: id,
      colors,
      wallpaper: { type: 'solid', value: colors.bg },
    });
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...prev,
        themeId: id,
        customColors: colors,
        customThemeName: name,
        accentOverride: null,
      }));
    } catch { /* */ }
  },
}));
