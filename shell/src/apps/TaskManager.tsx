import { useState, useEffect, useCallback } from 'react';
import { useWindowStore } from '../store/windowStore';
import { useThemeStore } from '../store/themeStore';
import { useWorkspaceStore } from '../store/workspaceStore';

interface ProcessRow {
  windowId: string;
  appId: string;
  title: string;
  icon: string;
  status: string;
  workspace: string;
  memory: number;
  cpu: number;
}

function randomMemory() {
  return Math.floor(Math.random() * 180) + 20;
}

function randomCpu() {
  return Math.round(Math.random() * 150) / 10;
}

function statusLabel(win: { status: string; pip?: boolean }): string {
  if (win.pip) return 'pip';
  return win.status;
}

export function TaskManager() {
  const colors = useThemeStore((s) => s.colors);
  const windows = useWindowStore((s) => s.windows);
  const closeWindow = useWindowStore((s) => s.closeWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const buildRows = useCallback((): ProcessRow[] => {
    return windows.map((w) => {
      const ws = workspaces.find((ws) => ws.id === w.workspaceId);
      return {
        windowId: w.id,
        appId: w.appId,
        title: w.title,
        icon: w.icon,
        status: statusLabel(w),
        workspace: ws?.name ?? `Bureau ${w.workspaceId ?? 1}`,
        memory: randomMemory(),
        cpu: randomCpu(),
      };
    });
  }, [windows, workspaces]);

  const [rows, setRows] = useState<ProcessRow[]>(() => buildRows());

  // Auto-refresh every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRows(buildRows());
    }, 2000);
    return () => clearInterval(interval);
  }, [buildRows]);

  // Also refresh when windows list changes
  useEffect(() => {
    setRows(buildRows());
  }, [windows.length, buildRows]);

  const handleFocus = (windowId: string, status: string) => {
    if (status === 'minimized') {
      restoreWindow(windowId);
    }
    focusWindow(windowId);
  };

  const handleCloseAll = () => {
    // Close all windows except the task manager itself
    windows.forEach((w) => {
      if (w.appId !== 'task-manager') {
        closeWindow(w.id);
      }
    });
  };

  const handleRefresh = () => {
    setRows(buildRows());
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return '#28c840';
      case 'maximized': return '#4361ee';
      case 'minimized': return '#febc2e';
      case 'pip': return '#a855f7';
      default: return colors.textSecondary;
    }
  };

  return (
    <div className="flex h-full flex-col" style={{ background: colors.bg, color: colors.textPrimary }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: colors.border, background: colors.surface }}
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold">
            {rows.length} processus actif{rows.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="rounded px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: colors.surfaceAlt, color: colors.textSecondary }}
          >
            Actualiser
          </button>
          <button
            onClick={handleCloseAll}
            className="rounded px-2 py-1 text-xs font-medium transition-colors hover:opacity-80"
            style={{ background: '#ff5f57', color: '#fff' }}
          >
            Fermer tout
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: colors.surfaceAlt, color: colors.textSecondary }}>
              <th className="sticky top-0 px-3 py-2 text-left font-medium" style={{ background: colors.surfaceAlt }}>Application</th>
              <th className="sticky top-0 px-3 py-2 text-left font-medium" style={{ background: colors.surfaceAlt }}>Statut</th>
              <th className="sticky top-0 px-3 py-2 text-left font-medium" style={{ background: colors.surfaceAlt }}>Bureau</th>
              <th className="sticky top-0 px-3 py-2 text-right font-medium" style={{ background: colors.surfaceAlt }}>Memoire</th>
              <th className="sticky top-0 px-3 py-2 text-right font-medium" style={{ background: colors.surfaceAlt }}>CPU</th>
              <th className="sticky top-0 px-3 py-2 text-center font-medium" style={{ background: colors.surfaceAlt }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center" style={{ color: colors.textSecondary }}>
                  Aucun processus en cours
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row.windowId}
                className="border-b transition-colors hover:opacity-90"
                style={{ borderColor: colors.border }}
                onMouseEnter={(e) => (e.currentTarget.style.background = colors.surfaceAlt)}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{row.icon}</span>
                    <span className="truncate font-medium" style={{ maxWidth: 180 }}>{row.title}</span>
                  </div>
                </td>
                <td className="px-3 py-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{ background: `${statusColor(row.status)}20`, color: statusColor(row.status) }}
                  >
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: statusColor(row.status) }} />
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2" style={{ color: colors.textSecondary }}>
                  {row.workspace}
                </td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: colors.textSecondary }}>
                  {row.memory} Mo
                </td>
                <td className="px-3 py-2 text-right tabular-nums" style={{ color: row.cpu > 10 ? '#ff5f57' : colors.textSecondary }}>
                  {row.cpu.toFixed(1)}%
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleFocus(row.windowId, row.status)}
                      className="rounded p-1 transition-colors hover:opacity-80"
                      style={{ color: colors.accent }}
                      title="Mettre au premier plan"
                    >
                      {'\ud83d\udc41'}
                    </button>
                    <button
                      onClick={() => closeWindow(row.windowId)}
                      className="rounded p-1 transition-colors hover:opacity-80"
                      style={{ color: '#febc2e' }}
                      title="Fermer"
                    >
                      {'\u2715'}
                    </button>
                    <button
                      onClick={() => closeWindow(row.windowId)}
                      className="rounded p-1 transition-colors hover:opacity-80"
                      style={{ color: '#ff5f57' }}
                      title="Forcer la fermeture"
                    >
                      {'\ud83d\udc80'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
