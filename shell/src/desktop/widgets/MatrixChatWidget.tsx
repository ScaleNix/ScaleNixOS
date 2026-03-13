import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../auth/useAuth';
import { useAppStore } from '../../store/appStore';
import { useWindowStore } from '../../store/windowStore';
import { getMockRooms, getMockTotalUnread, type MockRoom } from '../../api/matrixMockData';

interface RoomSummary {
  id: string;
  name: string;
  lastMessage: string;
  lastTs: number;
  unread: number;
  avatar: string;
  members: number;
}

function mockToSummary(m: MockRoom): RoomSummary {
  return { id: m.id, name: m.name, lastMessage: m.lastMessage, lastTs: m.lastTs, unread: m.unread, avatar: m.avatar, members: m.members };
}

export function MatrixChatWidget() {
  const colors = useThemeStore((s) => s.colors);
  const { user } = useAuth();
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalUnread, setTotalUnread] = useState(0);
  const [isMock, setIsMock] = useState(false);

  const fetchChat = useCallback(async () => {
    if (!user?.preferred_username) return;
    // Widget shows mock/preview data — full Matrix Chat app handles real auth
    const mockRooms = getMockRooms();
    setRooms(mockRooms.map(mockToSummary));
    setTotalUnread(getMockTotalUnread());
    setIsMock(true);
    setLoading(false);
  }, [user?.preferred_username]);

  useEffect(() => {
    fetchChat();
    const id = setInterval(fetchChat, 30_000);
    return () => clearInterval(id);
  }, [fetchChat]);

  const openChat = () => {
    const app = useAppStore.getState().getAppById('matrix-chat');
    if (app) useWindowStore.getState().openWindow(app);
  };

  const timeAgo = (ts: number) => {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'maintenant';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return `${Math.floor(diff / 86400000)}j`;
  };

  return (
    <div
      className="flex h-full w-full flex-col rounded-xl backdrop-blur-md select-none"
      style={{ background: `${colors.surface}cc`, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
    >
      <div
        className="flex items-center justify-between rounded-t-xl px-3 py-2"
        style={{ background: '#0dbd8b22' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">💬</span>
          <span className="text-xs font-semibold">Chat</span>
          {totalUnread > 0 && (
            <span className="rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: '#ef4444' }}>
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {isMock && <span className="text-[9px] px-1 rounded bg-white/10" style={{ color: colors.textSecondary }}>demo</span>}
          <button onClick={fetchChat} className="rounded p-0.5 text-xs hover:bg-white/10" title="Rafraichir">🔄</button>
          <button onClick={openChat} className="rounded p-0.5 text-xs hover:bg-white/10" title="Ouvrir">↗</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Connexion...
          </div>
        )}
        {!loading && rooms.length === 0 && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Aucun salon
          </div>
        )}
        {!loading && rooms.map((room) => (
          <div
            key={room.id}
            className="flex gap-2 border-b px-3 py-2 hover:bg-white/5 cursor-pointer"
            style={{ borderColor: `${colors.border}66` }}
            onClick={openChat}
          >
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: room.unread > 0 ? `${colors.accent}44` : `${colors.border}66`, color: room.unread > 0 ? colors.accent : colors.textSecondary }}
            >
              {room.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className={`truncate text-[11px] ${room.unread > 0 ? 'font-semibold' : ''}`}>
                  {room.name}
                </span>
                <span className="shrink-0 text-[10px]" style={{ color: colors.textSecondary }}>
                  {timeAgo(room.lastTs)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="truncate text-[10px]" style={{ color: colors.textSecondary }}>
                  {room.lastMessage}
                </span>
                {room.unread > 0 && (
                  <span className="shrink-0 rounded-full px-1 py-0.5 text-[9px] font-bold text-white" style={{ background: '#0dbd8b' }}>
                    {room.unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
