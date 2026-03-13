import { useEffect, useRef, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

export interface MenuItem {
  label: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  icon?: string;
  shortcut?: string;
  separator?: boolean;
  submenu?: MenuItem[];
}

interface ContextMenuContextType {
  show: (x: number, y: number, items: MenuItem[]) => void;
  close: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType>({
  show: () => {},
  close: () => {},
});

export function useContextMenu() {
  return useContext(ContextMenuContext);
}

export function ContextMenuProvider({ children }: { children: ReactNode }) {
  const [menu, setMenu] = useState<{ x: number; y: number; items: MenuItem[] } | null>(null);

  const show = useCallback((x: number, y: number, items: MenuItem[]) => {
    // Clamp to viewport
    const menuW = 220;
    const menuH = items.length * 32;
    const cx = Math.min(x, window.innerWidth - menuW - 8);
    const cy = Math.min(y, window.innerHeight - menuH - 8);
    setMenu({ x: cx, y: cy, items });
  }, []);

  const close = useCallback(() => setMenu(null), []);

  return (
    <ContextMenuContext.Provider value={{ show, close }}>
      {children}
      {menu && <ContextMenuPopup x={menu.x} y={menu.y} items={menu.items} onClose={close} />}
    </ContextMenuContext.Provider>
  );
}

function ContextMenuPopup({ x, y, items, onClose }: { x: number; y: number; items: MenuItem[]; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="fixed z-[99999] min-w-[200px] rounded-xl border border-[#2a3441] bg-[#111827]/95 py-1.5 shadow-2xl backdrop-blur-xl animate-context-menu"
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, i) =>
        item.separator ? (
          <div key={`sep-${i}`} className="mx-2 my-1.5 h-px bg-[#1f2937]" />
        ) : item.submenu ? (
          <div
            key={item.label}
            className="relative"
            onMouseEnter={() => setOpenSubmenu(item.label)}
            onMouseLeave={() => setOpenSubmenu(null)}
          >
            <button
              className="flex w-full items-center gap-2.5 px-3 py-[5px] text-left text-[13px] text-[#e2e8f0] transition-colors hover:bg-[#4361ee]/20"
            >
              {item.icon && <span className="w-5 text-center text-sm">{item.icon}</span>}
              <span className="flex-1">{item.label}</span>
              <span className="ml-4 text-[11px] text-[#64748b]">{'\u25b6'}</span>
            </button>
            {openSubmenu === item.label && (
              <div
                className="absolute left-full top-0 z-[100000] min-w-[180px] rounded-xl border border-[#2a3441] bg-[#111827]/95 py-1.5 shadow-2xl backdrop-blur-xl"
              >
                {item.submenu.map((sub) => (
                  <button
                    key={sub.label}
                    disabled={sub.disabled}
                    onClick={() => {
                      if (!sub.disabled && sub.onClick) {
                        sub.onClick();
                        onClose();
                      }
                    }}
                    className={`flex w-full items-center gap-2.5 px-3 py-[5px] text-left text-[13px] transition-colors ${
                      sub.disabled
                        ? 'cursor-default text-[#4b5563]'
                        : 'text-[#e2e8f0] hover:bg-[#4361ee]/20'
                    }`}
                  >
                    {sub.icon && <span className="w-5 text-center text-sm">{sub.icon}</span>}
                    <span className="flex-1">{sub.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            key={item.label}
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled && item.onClick) {
                item.onClick();
                onClose();
              }
            }}
            className={`flex w-full items-center gap-2.5 px-3 py-[5px] text-left text-[13px] transition-colors ${
              item.disabled
                ? 'cursor-default text-[#4b5563]'
                : item.danger
                  ? 'text-[#ff5f57] hover:bg-[#ff5f57]/10'
                  : 'text-[#e2e8f0] hover:bg-[#4361ee]/20'
            }`}
          >
            {item.icon && <span className="w-5 text-center text-sm">{item.icon}</span>}
            <span className="flex-1">{item.label}</span>
            {item.shortcut && (
              <span className="ml-4 text-[11px] text-[#64748b]">{item.shortcut}</span>
            )}
          </button>
        ),
      )}
    </div>
  );
}
