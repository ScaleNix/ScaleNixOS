export interface AppManifest {
  id: string;
  label: string;
  icon: string;
  description: string;
  type: 'iframe' | 'xpra' | 'native';
  url?: string;
  component?: string;
  keycloak_client?: string;
  roles?: string[];
  sandboxPolicy?: string;
  defaultSize: { w: number; h: number };
  category: 'communication' | 'productivity' | 'system' | 'tools' | 'multimedia';
  color: string;
}

export interface WindowState {
  id: string;
  appId: string;
  title: string;
  icon: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
  status: 'open' | 'minimized' | 'maximized';
  /** Picture-in-Picture mode */
  pip?: boolean;
  prevBounds?: { x: number; y: number; w: number; h: number };
  snapZone?: 'left' | 'right' | null;
  /** Virtual desktop this window belongs to */
  workspaceId?: number;
  /** Custom iframe URL for editor windows (overrides app url) */
  iframeUrl?: string;
  /** File viewer data for native file viewer windows */
  fileViewer?: {
    fileUrl: string;
    fileName: string;
    fileType: 'image' | 'video' | 'pdf' | 'audio' | 'markdown';
    /** All sibling files in the same directory that can be viewed */
    siblings?: Array<{ url: string; name: string; type: 'image' | 'video' | 'pdf' | 'audio' | 'markdown' }>;
  };
}
