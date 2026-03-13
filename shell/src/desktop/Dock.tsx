import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useAuth } from '../auth/useAuth';
import { useContextMenu, type MenuItem } from '../components/ContextMenu';
import { AppIcon } from '../components/AppIcon';

export function Dock() {
  const apps = useAppStore((s) => s.apps);
  const { user } = useAuth();
  const openWindow = useWindowStore((s) => s.openWindow);
  const windows = useWindowStore((s) => s.windows);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const minimizeWindow = useWindowStore((s) => s.minimizeWindow);
  const { show: showCtx } = useContextMenu();

  const visibleApps = apps.filter((app) => {
    if (!app.roles || app.roles.length === 0) return true;
    return app.roles.some((role) => user?.roles.includes(role));
  });

  const handleDockClick = (app: typeof apps[0]) => {
    const win = windows.find((w) => w.appId === app.id);
    if (win) {
      if (win.status === 'minimized') {
        restoreWindow(win.id);
      }
      focusWindow(win.id);
    } else {
      openWindow(app);
    }
  };

  const handleDockContextMenu = (e: React.MouseEvent, app: typeof apps[0]) => {
    e.preventDefault();
    e.stopPropagation();
    const win = windows.find((w) => w.appId === app.id);

    const items: MenuItem[] = [
      { label: 'Ouvrir', icon: '\ud83d\udcc2', onClick: () => handleDockClick(app) },
    ];

    if (win) {
      items.push(
        { separator: true, label: '' },
        ...(win.status === 'minimized'
          ? [{ label: 'Restaurer', icon: '\ud83d\udd3c', onClick: () => restoreWindow(win.id) }]
          : [{ label: 'Minimiser', icon: '\ud83d\udd3d', onClick: () => minimizeWindow(win.id) }]),
        { label: 'Fermer', icon: '\u2716', danger: true, onClick: () => closeWindow(win.id) },
      );
    }

    showCtx(e.clientX, e.clientY, items);
  };

  return (
    <div className="absolute right-0 bottom-2 left-0 z-[1000] flex justify-center pointer-events-none">
      <div className="pointer-events-auto flex items-end gap-1 rounded-2xl border border-[#1f2937]/80 bg-[#0d1117]/80 px-3 py-2 shadow-2xl backdrop-blur-[20px]">
        {visibleApps.map((app) => {
          const win = windows.find((w) => w.appId === app.id);
          const isOpen = !!win;
          const isMinimized = win?.status === 'minimized';
          const isActive = win && useWindowStore.getState().activeWindowId === win.id;

          return (
            <div
              key={app.id}
              className="relative flex flex-col items-center"
              onContextMenu={(e) => handleDockContextMenu(e, app)}
            >
              <div className={`transition-opacity ${isMinimized ? 'opacity-50' : ''}`}>
                <AppIcon app={app} size={46} onClick={() => handleDockClick(app)} />
              </div>
              {/* Indicator dot */}
              <div className="mt-0.5 flex h-1 items-center justify-center">
                {isOpen && (
                  <div
                    className={`rounded-full transition-all ${
                      isActive ? 'h-1 w-3 bg-[#4361ee]' : 'h-1 w-1 bg-[#64748b]'
                    }`}
                  />
                )}
              </div>
            </div>
          );
        })}

        {/* Separator + launcher button */}
        <div className="mx-1 h-10 w-px bg-[#1f2937]" />
        <button
          onClick={() => {
            const evt = new KeyboardEvent('keydown', { key: ' ', metaKey: true });
            window.dispatchEvent(evt);
          }}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-xl bg-[#1f2937]/50 text-xl text-[#64748b] transition-all hover:-translate-y-1 hover:bg-[#1f2937] hover:text-[#e2e8f0]"
          title="Launcher (Cmd+Space)"
        >
          +
        </button>
      </div>
    </div>
  );
}
