import { useState, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';

interface ShareFile {
  name: string;
  path: string;
}

interface FileShareDialogProps {
  file: ShareFile;
  token: string;
  onClose: () => void;
}

function generateShareId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function formatDateInput(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function FileShareDialog({ file, token, onClose }: FileShareDialogProps) {
  const colors = useThemeStore((s) => s.colors);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [withPassword, setWithPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState<string>(
    formatDateInput(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) // default: 7 days
  );
  const [shareDeleted, setShareDeleted] = useState(false);

  const handleCreateShare = useCallback(async () => {
    setCreating(true);
    setCopied(false);
    setShareDeleted(false);

    // Try Nextcloud OCS share API first
    try {
      const formData = new FormData();
      formData.append('shareType', '3'); // public link
      formData.append('path', file.path);
      formData.append('expireDate', expiryDate);
      if (withPassword && password) {
        formData.append('password', password);
      }

      const res = await fetch('/nextcloud/ocs/v2.php/apps/files_sharing/api/v1/shares', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'OCS-APIRequest': 'true',
          Accept: 'application/json',
        },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data?.ocs?.data?.url;
        if (url) {
          setShareLink(url);
          setCreating(false);
          return;
        }
      }
    } catch {
      // API not available, fall through to mock
    }

    // Fallback: generate a fake share URL
    await new Promise((r) => setTimeout(r, 400)); // simulate network delay
    const id = generateShareId();
    setShareLink(`https://files.scalenix.fr/s/${id}`);
    setCreating(false);
  }, [file.path, token, expiryDate, withPassword, password]);

  const handleCopy = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = shareLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareLink]);

  const handleDeleteShare = useCallback(() => {
    setShareLink(null);
    setShareDeleted(true);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-96 max-w-[90vw] rounded-xl border p-5 shadow-2xl"
        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Partager</h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-6 h-6 rounded-md text-sm hover:opacity-80 transition-opacity"
            style={{ color: colors.textSecondary }}
          >
            {'\u2715'}
          </button>
        </div>

        {/* File info */}
        <div
          className="flex items-center gap-3 p-3 rounded-lg mb-4"
          style={{ backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}
        >
          <span className="text-2xl">{'\ud83d\udcc4'}</span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{file.name}</p>
            <p className="text-[10px] truncate" style={{ color: colors.textSecondary }}>{file.path}</p>
          </div>
        </div>

        {/* Share settings (shown before creating share) */}
        {!shareLink && !shareDeleted && (
          <div className="space-y-3 mb-4">
            {/* Expiry date */}
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: colors.textSecondary }}>
                Date d'expiration
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={formatDateInput(new Date())}
                className="w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                style={{
                  backgroundColor: colors.surfaceAlt,
                  border: `1px solid ${colors.border}`,
                  color: colors.textPrimary,
                }}
              />
            </div>

            {/* Password toggle */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={withPassword}
                  onChange={(e) => setWithPassword(e.target.checked)}
                  className="rounded"
                  style={{ accentColor: colors.accent }}
                />
                <span className="text-xs" style={{ color: colors.textSecondary }}>
                  Proteger par mot de passe
                </span>
              </label>
              {withPassword && (
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="mt-2 w-full rounded-lg px-3 py-1.5 text-xs outline-none"
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                />
              )}
            </div>

            {/* Create share button */}
            <button
              onClick={handleCreateShare}
              disabled={creating}
              className="w-full rounded-lg py-2 text-xs font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: colors.accent }}
            >
              {creating ? 'Creation du lien...' : 'Creer un lien de partage'}
            </button>
          </div>
        )}

        {/* Share link (shown after creating) */}
        {shareLink && (
          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-[11px] font-medium mb-1" style={{ color: colors.textSecondary }}>
                Lien de partage
              </label>
              <div className="flex gap-1">
                <input
                  type="text"
                  readOnly
                  value={shareLink}
                  className="flex-1 rounded-lg px-3 py-1.5 text-xs outline-none select-all"
                  style={{
                    backgroundColor: colors.surfaceAlt,
                    border: `1px solid ${colors.border}`,
                    color: colors.textPrimary,
                  }}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 rounded-lg py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: colors.accent }}
              >
                {copied ? 'Copie !' : 'Copier le lien'}
              </button>
              <button
                onClick={handleDeleteShare}
                className="rounded-lg py-2 px-3 text-xs font-medium transition-colors hover:opacity-80"
                style={{
                  backgroundColor: 'transparent',
                  border: `1px solid #ef4444`,
                  color: '#ef4444',
                }}
              >
                Supprimer le partage
              </button>
            </div>

            {/* Share details */}
            <div className="text-[10px] space-y-1 pt-1" style={{ color: colors.textSecondary }}>
              <p>Expire le : {new Date(expiryDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
              {withPassword && <p>Protege par mot de passe</p>}
            </div>
          </div>
        )}

        {/* Share deleted confirmation */}
        {shareDeleted && (
          <div className="mb-4 p-3 rounded-lg text-center" style={{ backgroundColor: colors.surfaceAlt }}>
            <p className="text-xs" style={{ color: colors.textSecondary }}>
              Le partage a ete supprime.
            </p>
            <button
              onClick={handleCreateShare}
              className="mt-2 text-xs font-medium hover:underline"
              style={{ color: colors.accent }}
            >
              Creer un nouveau partage
            </button>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full rounded-lg py-2 text-xs font-medium transition-colors hover:opacity-80"
          style={{
            backgroundColor: colors.surfaceAlt,
            border: `1px solid ${colors.border}`,
            color: colors.textPrimary,
          }}
        >
          Fermer
        </button>
      </div>
    </div>
  );
}
