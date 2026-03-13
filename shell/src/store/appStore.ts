import { create } from 'zustand';
import type { AppManifest } from '../types/app.types';

interface AppStore {
  apps: AppManifest[];
  loaded: boolean;
  loadApps: () => Promise<void>;
  getAppById: (id: string) => AppManifest | undefined;
}

function resolveEnvVars(url: string): string {
  return url
    .replace('${ZIMBRA_URL}', import.meta.env.VITE_ZIMBRA_URL ?? '')
    .replace('${NEXTCLOUD_URL}', import.meta.env.VITE_NEXTCLOUD_URL ?? '')
    .replace('${XPRA_TERMINAL_URL}', import.meta.env.VITE_XPRA_TERMINAL_URL ?? '')
    .replace('${GRIST_URL}', import.meta.env.VITE_GRIST_URL ?? '')
    .replace('${KEYCLOAK_URL}', import.meta.env.VITE_KEYCLOAK_URL ?? '')
    .replace('${ELEMENT_URL}', import.meta.env.VITE_ELEMENT_URL ?? '')
    .replace('${LIVEKIT_MEET_URL}', import.meta.env.VITE_LIVEKIT_MEET_URL ?? '')
    .replace('${LIBREOFFICE_URL}', import.meta.env.VITE_LIBREOFFICE_URL ?? '')
    .replace('${OUTLINE_URL}', import.meta.env.VITE_OUTLINE_URL ?? '')
    .replace('${GHOST_URL}', import.meta.env.VITE_GHOST_URL ?? '')
    .replace('${JELLYFIN_URL}', import.meta.env.VITE_JELLYFIN_URL ?? '')
    .replace('${IMMICH_URL}', import.meta.env.VITE_IMMICH_URL ?? '')
    .replace('${VAULTWARDEN_URL}', import.meta.env.VITE_VAULTWARDEN_URL ?? '')
    .replace('${CODE_SERVER_URL}', import.meta.env.VITE_CODE_SERVER_URL ?? '')
    .replace('${EXCALIDRAW_URL}', import.meta.env.VITE_EXCALIDRAW_URL ?? '')
    .replace('${CHROMIUM_URL}', import.meta.env.VITE_CHROMIUM_URL ?? '');
}

export const useAppStore = create<AppStore>((set, get) => ({
  apps: [],
  loaded: false,

  loadApps: async () => {
    try {
      const res = await fetch('/apps/registry.json');
      const data: AppManifest[] = await res.json();
      const resolved = data.map((app) => ({
        ...app,
        url: app.url ? resolveEnvVars(app.url) : undefined,
      }));
      set({ apps: resolved, loaded: true });
    } catch (err) {
      console.error('Failed to load app registry', err);
      set({ loaded: true });
    }
  },

  getAppById: (id) => get().apps.find((a) => a.id === id),
}));
