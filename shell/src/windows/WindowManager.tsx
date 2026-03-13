import { useWindowStore, TOPBAR_HEIGHT, TASKBAR_HEIGHT } from '../store/windowStore';
import { useWorkspaceStore } from '../store/workspaceStore';
import { Window } from './Window';

export function WindowManager() {
  const allWindows = useWindowStore((s) => s.windows);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const snapPreview = useWindowStore((s) => s.snapPreview);

  const windows = allWindows.filter((w) => !w.workspaceId || w.workspaceId === activeWorkspaceId);

  const usableH = typeof window !== 'undefined' ? window.innerHeight - TOPBAR_HEIGHT - TASKBAR_HEIGHT : 600;
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;

  let previewStyle: React.CSSProperties | null = null;
  if (snapPreview) {
    if (snapPreview.zone === 'maximize') {
      previewStyle = { top: TOPBAR_HEIGHT, left: 0, width: vw, height: usableH };
    } else if (snapPreview.zone === 'left') {
      previewStyle = { top: TOPBAR_HEIGHT, left: 0, width: Math.floor(vw / 2), height: usableH };
    } else {
      previewStyle = { top: TOPBAR_HEIGHT, left: Math.floor(vw / 2), width: Math.floor(vw / 2), height: usableH };
    }
  }

  return (
    <>
      {/* Snap preview overlay */}
      {previewStyle && (
        <div
          className="fixed z-[999] rounded-lg border-2 border-[#4361ee]/40 bg-[#4361ee]/10 backdrop-blur-[2px] transition-all duration-150 pointer-events-none"
          style={previewStyle}
        />
      )}
      {windows.map((win) => (
        <Window key={win.id} win={win} />
      ))}
    </>
  );
}
