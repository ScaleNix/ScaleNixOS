import { useNotifStore, type Notification as NotifType } from '../store/notifStore';

const typeStyles: Record<NotifType['type'], string> = {
  info: 'border-[#4361ee] bg-[#4361ee]/10',
  success: 'border-[#28c840] bg-[#28c840]/10',
  warning: 'border-[#febc2e] bg-[#febc2e]/10',
  error: 'border-[#ff5f57] bg-[#ff5f57]/10',
};

function NotifItem({ notif }: { notif: NotifType }) {
  const dismiss = useNotifStore((s) => s.dismiss);

  return (
    <div
      className={`animate-slide-in-right w-80 rounded-lg border-l-[3px] p-3 shadow-lg backdrop-blur-md ${typeStyles[notif.type]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-[#e2e8f0]">{notif.title}</p>
          {notif.message && (
            <p className="mt-0.5 text-xs text-[#64748b]">{notif.message}</p>
          )}
        </div>
        <button
          onClick={() => dismiss(notif.id)}
          className="shrink-0 text-[#64748b] transition-colors hover:text-[#e2e8f0]"
        >
          x
        </button>
      </div>
    </div>
  );
}

export function NotificationContainer() {
  const notifications = useNotifStore((s) => s.notifications);

  return (
    <div className="fixed top-[44px] right-4 z-[99999] flex flex-col gap-2">
      {notifications.map((n) => (
        <NotifItem key={n.id} notif={n} />
      ))}
    </div>
  );
}
