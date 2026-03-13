import { useEffect, useState, useCallback } from 'react';
import { useThemeStore } from '../../store/themeStore';
import { useAuth } from '../../auth/useAuth';
import { WebDAVClient, fileIcon, formatSize, type WebDAVItem } from '../../apps/webdav';
import { useAppStore } from '../../store/appStore';
import { useWindowStore } from '../../store/windowStore';

interface StorageInfo {
  used: number;
  total: number;
}

export function NextcloudWidget() {
  const colors = useThemeStore((s) => s.colors);
  const { token, user } = useAuth();
  const [recentFiles, setRecentFiles] = useState<WebDAVItem[]>([]);
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!token || !user?.preferred_username) return;
    try {
      setError(null);
      const client = new WebDAVClient(user.preferred_username, token);

      // List root to get recent files
      const items = await client.list('/');

      // Sort by lastModified descending, take top 8
      const sorted = items
        .sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime())
        .slice(0, 8);
      setRecentFiles(sorted);

      // Try to get storage info via Nextcloud OCS API
      try {
        const res = await fetch('/nextcloud-api/ocs/v1.php/cloud/users/' + user.preferred_username, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'OCS-APIRequest': 'true',
          },
        });
        if (res.ok) {
          const data = await res.json();
          const quota = data.ocs?.data?.quota;
          if (quota) {
            setStorage({ used: quota.used || 0, total: quota.total || quota.quota || 0 });
          }
        }
      } catch { /* OCS API might not be proxied */ }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [token, user?.preferred_username]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 2 * 60_000); // Refresh every 2 min
    return () => clearInterval(id);
  }, [fetchData]);

  const openFiles = () => {
    const app = useAppStore.getState().getAppById('nextcloud-files');
    if (app) useWindowStore.getState().openWindow(app);
  };

  const formatStorageSize = (bytes: number) => {
    if (bytes <= 0) return '0';
    const units = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 3600000) return `${Math.max(1, Math.floor(diff / 60000))}min`;
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
        style={{ background: '#0082c922' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">📁</span>
          <span className="text-xs font-semibold">Fichiers</span>
        </div>
        <div className="flex gap-1">
          <button onClick={fetchData} className="rounded p-0.5 text-xs hover:bg-white/10" title="Rafraichir">🔄</button>
          <button onClick={openFiles} className="rounded p-0.5 text-xs hover:bg-white/10" title="Ouvrir">↗</button>
        </div>
      </div>

      {/* Storage bar */}
      {storage && storage.total > 0 && (
        <div className="px-3 pt-2">
          <div className="flex items-center justify-between text-[10px]" style={{ color: colors.textSecondary }}>
            <span>{formatStorageSize(storage.used)} utilises</span>
            <span>{formatStorageSize(storage.total)}</span>
          </div>
          <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full" style={{ background: `${colors.border}` }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (storage.used / storage.total) * 100)}%`,
                background: (storage.used / storage.total) > 0.9 ? '#ef4444' : colors.accent,
              }}
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {loading && (
          <div className="flex h-full items-center justify-center text-xs" style={{ color: colors.textSecondary }}>
            Chargement...
          </div>
        )}
        {error && (
          <div className="flex h-full flex-col items-center justify-center gap-1 px-3 text-center text-xs">
            <span style={{ color: '#ef4444' }}>Connexion echouee</span>
            <button onClick={fetchData} className="mt-1 rounded px-2 py-0.5 text-[10px]" style={{ background: colors.accent, color: '#fff' }}>
              Reessayer
            </button>
          </div>
        )}
        {!loading && !error && recentFiles.map((f) => (
          <div
            key={f.path}
            className="flex items-center gap-2 border-b px-3 py-1.5 hover:bg-white/5 cursor-pointer"
            style={{ borderColor: `${colors.border}66` }}
            onClick={openFiles}
          >
            <span className="text-sm">{fileIcon(f)}</span>
            <div className="flex-1 min-w-0">
              <div className="truncate text-[11px]">{f.name}</div>
              <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                {f.isDirectory ? 'Dossier' : formatSize(f.size)} · {timeAgo(f.lastModified)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
