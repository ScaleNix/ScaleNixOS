import { useState, useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useAppStore } from '../store/appStore';
import { useAuth } from '../auth/useAuth';
import { useNotifStore } from '../store/notifStore';
import { TitleBar } from './TitleBar';
import { IframeApp } from '../apps/IframeApp';
import { XpraApp } from '../apps/XpraApp';
import { FileExplorer } from '../apps/FileExplorer';
import { FileViewer } from '../apps/FileViewer';
import { Settings } from '../apps/Settings';
import { Trash } from '../apps/Trash';
import { Calculator } from '../apps/Calculator';
import { WorldClock } from '../apps/WorldClock';
import { TaskManager } from '../apps/TaskManager';
import { TextEditor } from '../apps/TextEditor';
import { ScreenCapture } from '../apps/ScreenCapture';
import { KanbanBoard } from '../apps/KanbanBoard';
import { RssReader } from '../apps/RssReader';
import { ClipboardHistory } from '../apps/ClipboardHistory';
import { WidgetManager } from '../apps/WidgetManager';
import { Directory } from '../apps/Directory';
import { AppStore } from '../apps/AppStore';
import { AudioMixer } from '../apps/AudioMixer';
import { UserProfile } from '../apps/UserProfile';
import { useWindowResize } from './useWindowDrag';
import type { WindowState } from '../types/app.types';

const RESIZE_EDGES = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

const edgeStyles: Record<string, React.CSSProperties> = {
  n:  { top: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
  s:  { bottom: -3, left: 8, right: 8, height: 6, cursor: 'ns-resize' },
  e:  { right: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
  w:  { left: -3, top: 8, bottom: 8, width: 6, cursor: 'ew-resize' },
  ne: { top: -3, right: -3, width: 12, height: 12, cursor: 'nesw-resize' },
  nw: { top: -3, left: -3, width: 12, height: 12, cursor: 'nwse-resize' },
  se: { bottom: -3, right: -3, width: 12, height: 12, cursor: 'nwse-resize' },
  sw: { bottom: -3, left: -3, width: 12, height: 12, cursor: 'nesw-resize' },
};

interface WindowProps {
  win: WindowState;
}

const NATIVE_APPS: Record<string, React.FC> = {
  'nextcloud-files': FileExplorer,
  'settings': Settings,
  'trash': Trash,
  'calculator': Calculator,
  'world-clock': WorldClock,
  'task-manager': TaskManager,
  'text-editor': TextEditor,
  'screen-capture': ScreenCapture,
  'kanban': KanbanBoard,
  'rss-reader': RssReader,
  'clipboard-history': ClipboardHistory,
  'widget-manager': WidgetManager,
  'directory': Directory,
  'app-store': AppStore,
  'audio-mixer': AudioMixer,
  'user-profile': UserProfile,
};

export function Window({ win }: WindowProps) {
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const dragging = useWindowStore((s) => s.dragging);
  const getAppById = useAppStore((s) => s.getAppById);
  const { token } = useAuth();
  const activeWindowId = useWindowStore((s) => s.activeWindowId);
  const { onResizeStart } = useWindowResize(win.id);
  const app = getAppById(win.appId);
  const isActive = activeWindowId === win.id;
  const isMaximized = win.status === 'maximized';
  const isPip = !!win.pip;
  const [fileDragOver, setFileDragOver] = useState(false);
  const push = useNotifStore((s) => s.push);

  const isMinimized = win.status === 'minimized';

  const NativeComponent = NATIVE_APPS[win.appId];
  const isIframeApp = !NativeComponent && !win.fileViewer && !win.iframeUrl && app?.type === 'iframe';

  // Whether this window accepts file drops (native apps + iframe apps)
  const acceptsFileDrop = !!(NativeComponent || isIframeApp);

  // Handle file drop on any window (native or iframe)
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragOver(false);

    if (!token) return;

    const fileUrl = e.dataTransfer.getData('application/x-scalenix-file-url');
    const fileName = e.dataTransfer.getData('application/x-scalenix-file-name');

    if (!fileUrl || !fileName) return;

    // For native apps, dispatch a custom event so app components can handle it
    if (NativeComponent) {
      const detail = { fileUrl, fileName, token, windowId: win.id, appId: win.appId };
      window.dispatchEvent(new CustomEvent('scalenix-file-drop', { detail }));
      return;
    }

    // For iframe apps, fetch + postMessage + download fallback
    try {
      const res = await fetch(fileUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();

      const file = new File([blob], fileName, { type: blob.type });

      const iframe = e.currentTarget.querySelector('iframe');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({
          type: 'SCALENIX_FILE_DROP',
          fileName,
          fileType: blob.type,
          fileSize: blob.size,
        }, '*');
      }

      const blobUrl = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

      push({ type: 'info', title: `"${fileName}" telecharge`, message: 'Glissez-le dans l\'application depuis votre dossier de telechargements' });
    } catch (err: any) {
      push({ type: 'error', title: 'Erreur', message: err.message });
    }
  }, [token, push, NativeComponent, win.id, win.appId]);

  const renderContent = () => {
    if (win.fileViewer) {
      return <FileViewer win={win} />;
    }
    if (win.iframeUrl) {
      return (
        <iframe
          src={win.iframeUrl}
          allow="fullscreen"
          allowFullScreen
          className="h-full w-full border-0"
          title={win.title}
        />
      );
    }
    if (NativeComponent) return <NativeComponent />;
    if (!app || !token) {
      return (
        <div className="flex h-full items-center justify-center text-sm text-[#64748b]">
          Application introuvable
        </div>
      );
    }
    if (app.type === 'xpra') return <XpraApp app={app} token={token} />;
    return <IframeApp app={app} token={token} />;
  };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden border bg-[#111827] shadow-[0_24px_80px_rgba(0,0,0,0.6)] animate-window-open ${
        isMaximized ? 'rounded-none' : 'rounded-xl'
      } ${isActive ? 'border-[rgba(67,97,238,0.3)]' : 'border-[#1f2937]'} ${isPip ? 'ring-2 ring-[#4361ee]/40' : ''}`}
      style={{
        left: win.x,
        top: win.y,
        width: win.w,
        height: win.h,
        zIndex: isMinimized ? -1 : win.zIndex,
        transition: isMaximized || win.prevBounds || win.snapZone ? 'left 0.2s, top 0.2s, width 0.2s, height 0.2s' : undefined,
        display: isMinimized ? 'none' : undefined,
      }}
      onMouseDown={() => focusWindow(win.id)}
      onDragOver={acceptsFileDrop ? (e) => { e.preventDefault(); setFileDragOver(true); } : undefined}
      onDragLeave={acceptsFileDrop ? () => setFileDragOver(false) : undefined}
      onDrop={acceptsFileDrop ? handleDrop : undefined}
    >
      <TitleBar win={win} isLinuxApp={app?.type === 'xpra'} />
      <div className="relative flex-1 overflow-hidden">
        {dragging && <div className="absolute inset-0 z-50" />}
        {/* File drop overlay */}
        {fileDragOver && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#4361ee]/20 backdrop-blur-[3px] pointer-events-none transition-all">
            <div className="rounded-2xl border-2 border-dashed border-[#4361ee]/70 bg-[#4361ee]/10 px-8 py-5 text-center shadow-lg">
              <svg className="mx-auto h-8 w-8 text-[#4361ee]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              <p className="mt-2 text-sm font-medium text-[#4361ee]">Deposer le fichier ici</p>
            </div>
          </div>
        )}
        {renderContent()}
      </div>

      {!isMaximized && !isPip &&
        RESIZE_EDGES.map((edge) => (
          <div
            key={edge}
            className="absolute z-50"
            style={edgeStyles[edge]}
            onMouseDown={(e) => onResizeStart(e, edge)}
          />
        ))}
    </div>
  );
}
