import { useEffect, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useDesktopStore } from '../store/desktopStore';
import { useClipboardStore } from '../store/clipboardStore';
import { useContextMenu } from '../components/ContextMenu';
import { useNotifStore } from '../store/notifStore';
import { Taskbar } from './Taskbar';
import { Launcher } from './Launcher';
import { Wallpaper } from './Wallpaper';
import { DesktopIcons } from './DesktopIcons';
import { WindowManager } from '../windows/WindowManager';
import { NotificationContainer } from '../components/Notification';
import { Spotlight } from './Spotlight';
import { getViewableFileType, WebDAVClient } from '../apps/webdav';
import { getTemplateBlob } from '../apps/docTemplates';
import { useAuth } from '../auth/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { useLockStore } from '../store/lockStore';
import { useClipboardHistoryStore } from '../store/clipboardHistoryStore';
import { WidgetLayer } from './widgets/WidgetLayer';
import { useWidgetStore, WIDGET_META, type WidgetType } from '../store/widgetStore';
import LockScreen from './LockScreen';
import { AltTabSwitcher } from './AltTabSwitcher';
import { Onboarding } from './Onboarding';
import { useFullscreen } from '../hooks/useFullscreen';
import { useAutoTheme } from '../hooks/useAutoTheme';
import { useClipboardSync } from '../hooks/useClipboardSync';
import { useNotificationPoller } from '../hooks/useNotificationPoller';

// Simple clipboard for file shortcuts (used by FileExplorer "Copier pour le bureau")
let fileClipboard: { label: string; icon: string; filePath: string; fileName: string; fileType: string } | null = null;
export function setFileClipboard(data: typeof fileClipboard) { fileClipboard = data; }
export function getFileClipboard() { return fileClipboard; }

const iconForType = (t: string | null) =>
  t === 'image' ? '\ud83d\uddbc\ufe0f' : t === 'video' ? '\ud83c\udfac' : t === 'audio' ? '\ud83c\udfb5' : t === 'markdown' ? '\ud83d\udcdd' : '\ud83d\udcc4';

export function Desktop() {
  useAutoTheme();
  useClipboardSync();
  useNotificationPoller();
  const [launcherOpen, setLauncherOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [altTabOpen, setAltTabOpen] = useState(false);
  const { loadApps, loaded } = useAppStore();
  const { show: showCtx } = useContextMenu();
  const addShortcut = useDesktopStore((s) => s.addShortcut);
  const sortIcons = useDesktopStore((s) => s.sortIcons);
  const push = useNotifStore((s) => s.push);
  const { token, user } = useAuth();

  const loadTheme = useThemeStore((s) => s.load);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const setActiveWorkspace = useWorkspaceStore((s) => s.setActiveWorkspace);
  const lock = useLockStore((s) => s.lock);
  const { toggleFullscreen } = useFullscreen();
  const addClipboardEntry = useClipboardHistoryStore((s) => s.addEntry);
  const restoreSession = useWindowStore((s) => s.restoreSession);

  useEffect(() => {
    if (!loaded) {
      loadApps();
    } else {
      restoreSession();
    }
    loadTheme();
  }, [loaded, loadApps, loadTheme, restoreSession]);

  const toggleLauncher = useCallback(() => setLauncherOpen((o) => !o), []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (spotlightOpen) setSpotlightOpen(false);
        else if (launcherOpen) setLauncherOpen(false);
      }
      if (e.key === ' ' && e.metaKey) {
        e.preventDefault();
        toggleLauncher();
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSpotlightOpen((o) => !o);
      }
      // Ctrl+Shift+V: open clipboard history
      if (e.key === 'V' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        const clipApp = useAppStore.getState().getAppById('clipboard-history');
        if (clipApp) useWindowStore.getState().openWindow(clipApp);
      }
      // Ctrl+Alt+L: lock screen
      if (e.key === 'l' && e.ctrlKey && e.altKey) {
        e.preventDefault();
        lock();
      }
      // Alt+Tab: window switcher
      if (e.key === 'Tab' && e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        if (!altTabOpen) setAltTabOpen(true);
      }
      // F11: toggle fullscreen
      if (e.key === 'F11') {
        e.preventDefault();
        toggleFullscreen();
      }

      // Ctrl+D / Super+D: show desktop (minimize all)
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        useWindowStore.getState().minimizeAll();
      }
      // Alt+F4: close active window
      if (e.key === 'F4' && e.altKey) {
        e.preventDefault();
        const activeId = useWindowStore.getState().activeWindowId;
        if (activeId) useWindowStore.getState().closeWindow(activeId);
      }
      // Ctrl+Alt+1..9 to switch workspaces
      if (e.altKey && e.ctrlKey && e.key >= '1' && e.key <= '9') {
        const num = parseInt(e.key);
        const ws = workspaces.find((w) => w.id === num);
        if (ws) {
          e.preventDefault();
          setActiveWorkspace(ws.id);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [launcherOpen, spotlightOpen, altTabOpen, toggleLauncher, workspaces, setActiveWorkspace, lock, toggleFullscreen]);

  // Listen for clipboard copy events to feed clipboard history
  useEffect(() => {
    const handleCopy = () => {
      navigator.clipboard.readText?.().then((text) => {
        if (text) addClipboardEntry(text);
      }).catch(() => {});
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [addClipboardEntry]);

  const handleDesktopContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return;
      e.preventDefault();
      const clip = getFileClipboard();
      const fsClip = useClipboardStore.getState();

      showCtx(e.clientX, e.clientY, [
        { label: 'Ouvrir le Launcher', icon: '\ud83d\ude80', onClick: () => setLauncherOpen(true), shortcut: '\u2318 Space' },
        { label: 'Recherche Spotlight', icon: '\ud83d\udd0d', onClick: () => setSpotlightOpen(true), shortcut: 'Ctrl+K' },
        { separator: true, label: '' },
        {
          label: 'Nouveau dossier',
          icon: '\ud83d\udcc1',
          onClick: () => {
            const name = prompt('Nom du dossier :');
            if (!name) return;
            const username = user?.preferred_username;
            if (!username || !token) {
              push({ type: 'error', title: 'Non authentifie' });
              return;
            }
            const client = new WebDAVClient(username, token);
            client.createFolder('/' + name + '/').then(() => {
              push({ type: 'success', title: `Dossier "${name}" cree` });
              addShortcut({ label: name, icon: '\ud83d\udcc1', type: 'file', filePath: '/' + name + '/', fileName: name });
            }).catch((err: any) => {
              push({ type: 'error', title: 'Erreur', message: err.message ?? 'Impossible de creer le dossier' });
            });
          },
        },
        {
          label: 'Nouveau fichier texte',
          icon: '\u270f\ufe0f',
          onClick: async () => {
            const username = user?.preferred_username;
            if (!username || !token) {
              push({ type: 'error', title: 'Non authentifie' });
              return;
            }
            const name = prompt('Nom du fichier :', 'Document.docx');
            if (!name) return;
            const fileName = name.includes('.') ? name : `${name}.docx`;
            try {
              const client = new WebDAVClient(username, token);
              const blob = getTemplateBlob(fileName);
              await client.uploadBlob('/', blob, fileName);
              push({ type: 'success', title: `"${fileName}" cree` });
              // Open the FileExplorer (native app) — the user can double-click the file to edit in OnlyOffice
              const filesApp = useAppStore.getState().getAppById('nextcloud-files');
              if (filesApp) useWindowStore.getState().openWindow(filesApp);
            } catch (err: any) {
              push({ type: 'error', title: 'Erreur', message: err.message ?? 'Impossible de creer le fichier' });
            }
          },
        },
        { separator: true, label: '' },
        {
          label: clip ? `Coller "${clip.fileName}"` : (fsClip.items.length > 0 ? `Coller (${fsClip.items.length} fichiers)` : 'Coller'),
          icon: '\ud83d\udccb',
          disabled: !clip && fsClip.items.length === 0,
          onClick: () => {
            if (clip) {
              addShortcut({
                label: clip.fileName,
                icon: clip.icon,
                type: 'file',
                filePath: clip.filePath,
                fileName: clip.fileName,
                fileType: clip.fileType,
              });
              fileClipboard = null;
              push({ type: 'success', title: 'Raccourci ajoute au bureau' });
            } else if (fsClip.items.length > 0) {
              for (const item of fsClip.items) {
                const vt = getViewableFileType(item.name);
                addShortcut({
                  label: item.name,
                  icon: item.isDirectory ? '\ud83d\udcc1' : iconForType(vt),
                  type: 'file',
                  filePath: item.downloadUrl,
                  fileName: item.name,
                  fileType: vt ?? undefined,
                });
              }
              push({ type: 'success', title: `${fsClip.items.length} raccourci(s) ajoute(s)` });
            }
          },
        },
        { separator: true, label: '' },
        {
          label: 'Trier les icones',
          icon: '\ud83d\uddc2\ufe0f',
          submenu: [
            { label: 'Par nom', icon: '\ud83d\udd24', onClick: () => sortIcons('name') },
            { label: 'Par type', icon: '\ud83d\udcce', onClick: () => sortIcons('type') },
            { label: 'Par date', icon: '\ud83d\udcc5', onClick: () => sortIcons('date') },
          ],
        },
        { separator: true, label: '' },
        ...Object.entries(WIDGET_META).map(([type, meta]) => ({
          label: `Ajouter ${meta.label}`,
          icon: meta.icon,
          onClick: () => useWidgetStore.getState().addWidget(type as WidgetType),
        })),
        { separator: true, label: '' },
        { label: 'Gestionnaire de widgets', icon: '\ud83e\udea9', onClick: () => {
          const app = useAppStore.getState().getAppById('widget-manager');
          if (app) useWindowStore.getState().openWindow(app);
        }},
        { separator: true, label: '' },
        { label: 'Changer le fond d\'ecran', icon: '\ud83c\udf05', onClick: () => {
          const settingsApp = useAppStore.getState().getAppById('settings');
          if (settingsApp) useWindowStore.getState().openWindow(settingsApp);
        }},
        { label: 'Parametres d\'affichage', icon: '\u2699\ufe0f', onClick: () => {
          const settingsApp = useAppStore.getState().getAppById('settings');
          if (settingsApp) useWindowStore.getState().openWindow(settingsApp);
        }},
        { separator: true, label: '' },
        { label: 'Actualiser', icon: '\ud83d\udd04', onClick: () => window.location.reload() },
      ]);
    },
    [showCtx, addShortcut, sortIcons, push, token, user],
  );

  // Handle files dragged from explorer onto the desktop
  const handleDesktopDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();

    const fileUrl = e.dataTransfer.getData('application/x-scalenix-file-url');
    const fileName = e.dataTransfer.getData('application/x-scalenix-file-name');

    if (fileUrl && fileName) {
      const vt = getViewableFileType(fileName);
      addShortcut({
        label: fileName,
        icon: iconForType(vt),
        type: 'file',
        filePath: fileUrl,
        fileName,
        fileType: vt ?? undefined,
      });
      push({ type: 'success', title: `"${fileName}" ajoute au bureau` });
    }
  }, [addShortcut, push]);

  return (
    <div
      className="relative h-screen w-screen overflow-hidden font-['DM_Sans']"
      onContextMenu={(e) => e.preventDefault()}
    >
      <Wallpaper />

      <div className="relative z-10 flex h-full flex-col">
        {/* Desktop area */}
        <div
          className="relative flex-1"
          onDoubleClick={(e) => {
            if (e.target === e.currentTarget) setLauncherOpen(true);
          }}
          onContextMenu={handleDesktopContextMenu}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDesktopDrop}
        >
          <WidgetLayer />
          <DesktopIcons />
          <WindowManager />
        </div>

        <Taskbar />
      </div>

      <Launcher open={launcherOpen} onClose={() => setLauncherOpen(false)} />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <NotificationContainer />
      <LockScreen />
      <AltTabSwitcher visible={altTabOpen} onDismiss={() => setAltTabOpen(false)} />
      <Onboarding />
    </div>
  );
}
