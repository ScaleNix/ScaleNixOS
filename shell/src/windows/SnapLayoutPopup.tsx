import { useWindowStore, TOPBAR_HEIGHT, TASKBAR_HEIGHT } from '../store/windowStore';
import { useThemeStore } from '../store/themeStore';

export type SnapLayout =
  | 'left-half' | 'right-half'
  | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  | 'left-third' | 'center-third' | 'right-third';

interface SnapLayoutPopupProps {
  windowId: string;
  onClose: () => void;
}

/** Small SVG thumbnail depicting a snap zone within a screen outline. */
function LayoutThumbnail({
  zones,
  highlighted,
  accent,
  border,
  surface,
}: {
  zones: Array<{ x: number; y: number; w: number; h: number }>;
  highlighted: number;
  accent: string;
  border: string;
  surface: string;
}) {
  return (
    <svg viewBox="0 0 48 32" className="h-full w-full">
      {zones.map((z, i) => (
        <rect
          key={i}
          x={z.x}
          y={z.y}
          width={z.w}
          height={z.h}
          rx={2}
          fill={i === highlighted ? accent : surface}
          stroke={border}
          strokeWidth={1}
          opacity={i === highlighted ? 0.85 : 0.4}
        />
      ))}
    </svg>
  );
}

const HALVES_ZONES = [
  { x: 1, y: 1, w: 22, h: 30 },
  { x: 25, y: 1, w: 22, h: 30 },
];

const QUARTERS_ZONES = [
  { x: 1, y: 1, w: 22, h: 14 },
  { x: 25, y: 1, w: 22, h: 14 },
  { x: 1, y: 17, w: 22, h: 14 },
  { x: 25, y: 17, w: 22, h: 14 },
];

const THIRDS_ZONES = [
  { x: 1, y: 1, w: 14, h: 30 },
  { x: 17, y: 1, w: 14, h: 30 },
  { x: 33, y: 1, w: 14, h: 30 },
];

interface LayoutOption {
  layout: SnapLayout;
  zones: Array<{ x: number; y: number; w: number; h: number }>;
  highlighted: number;
  label: string;
}

const LAYOUT_ROWS: LayoutOption[][] = [
  [
    { layout: 'left-half', zones: HALVES_ZONES, highlighted: 0, label: 'Left half' },
    { layout: 'right-half', zones: HALVES_ZONES, highlighted: 1, label: 'Right half' },
  ],
  [
    { layout: 'top-left', zones: QUARTERS_ZONES, highlighted: 0, label: 'Top-left' },
    { layout: 'top-right', zones: QUARTERS_ZONES, highlighted: 1, label: 'Top-right' },
    { layout: 'bottom-left', zones: QUARTERS_ZONES, highlighted: 2, label: 'Bottom-left' },
    { layout: 'bottom-right', zones: QUARTERS_ZONES, highlighted: 3, label: 'Bottom-right' },
  ],
  [
    { layout: 'left-third', zones: THIRDS_ZONES, highlighted: 0, label: 'Left third' },
    { layout: 'center-third', zones: THIRDS_ZONES, highlighted: 1, label: 'Center third' },
    { layout: 'right-third', zones: THIRDS_ZONES, highlighted: 2, label: 'Right third' },
  ],
];

function computeBounds(layout: SnapLayout) {
  const vw = window.innerWidth;
  const usableH = window.innerHeight - TOPBAR_HEIGHT - TASKBAR_HEIGHT;
  const top = TOPBAR_HEIGHT;
  const halfW = Math.floor(vw / 2);
  const halfH = Math.floor(usableH / 2);
  const thirdW = Math.floor(vw / 3);

  switch (layout) {
    case 'left-half':
      return { x: 0, y: top, w: halfW, h: usableH };
    case 'right-half':
      return { x: halfW, y: top, w: vw - halfW, h: usableH };
    case 'top-left':
      return { x: 0, y: top, w: halfW, h: halfH };
    case 'top-right':
      return { x: halfW, y: top, w: vw - halfW, h: halfH };
    case 'bottom-left':
      return { x: 0, y: top + halfH, w: halfW, h: usableH - halfH };
    case 'bottom-right':
      return { x: halfW, y: top + halfH, w: vw - halfW, h: usableH - halfH };
    case 'left-third':
      return { x: 0, y: top, w: thirdW, h: usableH };
    case 'center-third':
      return { x: thirdW, y: top, w: thirdW, h: usableH };
    case 'right-third':
      return { x: thirdW * 2, y: top, w: vw - thirdW * 2, h: usableH };
  }
}

export function SnapLayoutPopup({ windowId, onClose }: SnapLayoutPopupProps) {
  const { colors } = useThemeStore();
  const windows = useWindowStore((s) => s.windows);
  const win = windows.find((w) => w.id === windowId);

  const applyLayout = (layout: SnapLayout) => {
    if (!win) return;
    const bounds = computeBounds(layout);
    const store = useWindowStore.getState();
    // Save previous bounds before snapping
    const prevBounds = win.prevBounds ?? { x: win.x, y: win.y, w: win.w, h: win.h };
    const updated = store.windows.map((w) =>
      w.id === windowId
        ? { ...w, ...bounds, prevBounds, status: 'open' as const, snapZone: null }
        : w,
    );
    useWindowStore.setState({ windows: updated });
    onClose();
  };

  return (
    <div
      className="absolute left-0 top-full z-[9999] mt-1 rounded-lg p-2 shadow-xl"
      style={{
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        minWidth: 220,
      }}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseLeave={onClose}
    >
      <p
        className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: colors.textSecondary }}
      >
        Snap Layout
      </p>
      <div className="flex flex-col gap-1.5">
        {LAYOUT_ROWS.map((row, ri) => (
          <div key={ri} className="flex gap-1.5">
            {row.map((opt) => (
              <button
                key={opt.layout}
                title={opt.label}
                onClick={() => applyLayout(opt.layout)}
                className="flex-1 rounded p-1 transition-colors"
                style={{ backgroundColor: colors.surfaceAlt }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.accent + '33';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = colors.surfaceAlt;
                }}
              >
                <LayoutThumbnail
                  zones={opt.zones}
                  highlighted={opt.highlighted}
                  accent={colors.accent}
                  border={colors.border}
                  surface={colors.surfaceAlt}
                />
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
