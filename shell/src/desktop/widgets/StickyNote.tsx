import { useCallback, useRef, useState } from 'react';
import { useWidgetStore, type Widget } from '../../store/widgetStore';

const NOTE_COLORS: Record<string, { bg: string; header: string; text: string }> = {
  yellow: { bg: '#fef9c3', header: '#facc15', text: '#713f12' },
  green: { bg: '#dcfce7', header: '#4ade80', text: '#14532d' },
  blue: { bg: '#dbeafe', header: '#60a5fa', text: '#1e3a5f' },
  pink: { bg: '#fce7f3', header: '#f472b6', text: '#831843' },
};

interface Props {
  widget: Widget;
}

export function StickyNote({ widget }: Props) {
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const removeWidget = useWidgetStore((s) => s.removeWidget);
  const noteColor = (widget.data.color as string) || 'yellow';
  const palette = NOTE_COLORS[noteColor] || NOTE_COLORS.yellow;
  const content = (widget.data.content as string) ?? '';

  // Dragging
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setDragging(true);
      dragOffset.current = { x: e.clientX - widget.x, y: e.clientY - widget.y };

      const handleMove = (ev: MouseEvent) => {
        updateWidget(widget.id, {
          x: ev.clientX - dragOffset.current.x,
          y: ev.clientY - dragOffset.current.y,
        });
      };

      const handleUp = () => {
        setDragging(false);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [widget.id, widget.x, widget.y, updateWidget],
  );

  const handleContentChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateWidget(widget.id, { data: { ...widget.data, content: e.target.value } });
    },
    [widget.id, widget.data, updateWidget],
  );

  const cycleColor = useCallback(() => {
    const keys = Object.keys(NOTE_COLORS);
    const idx = keys.indexOf(noteColor);
    const next = keys[(idx + 1) % keys.length];
    updateWidget(widget.id, { data: { ...widget.data, color: next } });
  }, [widget.id, widget.data, noteColor, updateWidget]);

  return (
    <div
      className="flex flex-col overflow-hidden rounded-lg shadow-lg"
      style={{
        width: widget.w,
        height: widget.h,
        background: palette.bg,
        cursor: dragging ? 'grabbing' : 'default',
      }}
    >
      {/* Title bar */}
      <div
        className="flex h-7 shrink-0 cursor-grab items-center justify-between px-2 active:cursor-grabbing"
        style={{ background: palette.header }}
        onMouseDown={handleMouseDown}
      >
        <button
          className="h-4 w-4 rounded-full border border-white/40 text-[10px] leading-none"
          style={{ background: palette.bg }}
          title="Changer couleur"
          onClick={cycleColor}
        />
        <span className="text-[10px] font-semibold" style={{ color: palette.text }}>
          Note
        </span>
        <button
          className="flex h-4 w-4 items-center justify-center rounded-full text-xs leading-none hover:bg-black/10"
          style={{ color: palette.text }}
          title="Supprimer"
          onClick={() => removeWidget(widget.id)}
        >
          x
        </button>
      </div>

      {/* Content */}
      <textarea
        className="flex-1 resize-none border-none bg-transparent p-2 text-sm outline-none placeholder:italic placeholder:opacity-50"
        style={{ color: palette.text }}
        placeholder="Ecrivez ici..."
        value={content}
        onChange={handleContentChange}
      />
    </div>
  );
}
