import { useEffect, useRef, useCallback } from 'react';
import { useWidgetStore, type Widget } from '../../store/widgetStore';
import { ClockWidget } from './ClockWidget';
import { StickyNote } from './StickyNote';
import { SystemMonitor } from './SystemMonitor';
import { WeatherWidget } from './WeatherWidget';
import { CalendarWidget } from './CalendarWidget';
import { TodoListWidget } from './TodoListWidget';
import { QuoteWidget } from './QuoteWidget';
import { PomodoroWidget } from './PomodoroWidget';
import { QuickLinksWidget } from './QuickLinksWidget';
import { ZimbraMailWidget } from './ZimbraMailWidget';
import { ZimbraCalendarWidget } from './ZimbraCalendarWidget';
import { ZimbraTaskWidget } from './ZimbraTaskWidget';
import { MatrixChatWidget } from './MatrixChatWidget';
import { NextcloudWidget } from './NextcloudWidget';

function WidgetWrapper({ widget }: { widget: Widget }) {
  const updateWidget = useWidgetStore((s) => s.updateWidget);
  const removeWidget = useWidgetStore((s) => s.removeWidget);
  const dragging = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Sticky notes handle their own drag; others use generic drag here
  const isStickyNote = widget.type === 'sticky-note';

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isStickyNote) return; // StickyNote handles its own drag
      // Only drag from the widget itself, not from interactive children
      if ((e.target as HTMLElement).closest('button, input, textarea, select')) return;

      e.preventDefault();
      dragging.current = true;
      offset.current = { x: e.clientX - widget.x, y: e.clientY - widget.y };

      const handleMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        updateWidget(widget.id, {
          x: ev.clientX - offset.current.x,
          y: ev.clientY - offset.current.y,
        });
      };

      const handleUp = () => {
        dragging.current = false;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };

      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [widget.id, widget.x, widget.y, isStickyNote, updateWidget],
  );

  const renderContent = () => {
    switch (widget.type) {
      case 'clock':
        return <ClockWidget />;
      case 'sticky-note':
        return <StickyNote widget={widget} />;
      case 'system-monitor':
        return <SystemMonitor />;
      case 'weather':
        return <WeatherWidget />;
      case 'calendar':
        return <CalendarWidget />;
      case 'todo-list':
        return <TodoListWidget widget={widget} />;
      case 'quote':
        return <QuoteWidget />;
      case 'pomodoro':
        return <PomodoroWidget />;
      case 'quick-links':
        return <QuickLinksWidget widget={widget} />;
      case 'zimbra-mail':
        return <ZimbraMailWidget />;
      case 'zimbra-calendar':
        return <ZimbraCalendarWidget />;
      case 'zimbra-tasks':
        return <ZimbraTaskWidget />;
      case 'matrix-chat':
        return <MatrixChatWidget />;
      case 'nextcloud-files':
        return <NextcloudWidget />;
      default:
        return null;
    }
  };

  return (
    <div
      className="group/widget absolute"
      style={{
        left: widget.x,
        top: widget.y,
        width: widget.type === 'sticky-note' ? undefined : widget.w,
        height: widget.type === 'sticky-note' ? undefined : widget.h,
        cursor: isStickyNote ? undefined : 'grab',
      }}
      onMouseDown={handleMouseDown}
    >
      {renderContent()}
      {/* Close button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); removeWidget(widget.id); }}
        className="absolute right-1 top-1 z-50 flex h-5 w-5 items-center justify-center rounded-full bg-red-500/90 text-[10px] font-bold text-white opacity-0 shadow-md transition-opacity group-hover/widget:opacity-100 hover:bg-red-600"
        title="Fermer le widget"
        data-testid="widget-close"
      >
        ×
      </button>
    </div>
  );
}

export function WidgetLayer() {
  const widgets = useWidgetStore((s) => s.widgets);
  const load = useWidgetStore((s) => s.load);

  useEffect(() => {
    load();
  }, [load]);

  const visibleWidgets = widgets.filter((w) => w.visible);

  if (visibleWidgets.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-[1]">
      {visibleWidgets.map((widget) => (
        <div key={widget.id} className="pointer-events-auto">
          <WidgetWrapper widget={widget} />
        </div>
      ))}
    </div>
  );
}
