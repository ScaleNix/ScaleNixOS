import { useState } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useNotifStore } from '../store/notifStore';
import { useAuth } from '../auth/useAuth';

interface QuickComposeProps {
  onClose: () => void;
}

export function QuickCompose({ onClose }: QuickComposeProps) {
  const colors = useThemeStore((s) => s.colors);
  const push = useNotifStore((s) => s.push);
  const { user } = useAuth();

  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  const fromLabel = user?.email ?? user?.preferred_username ?? 'utilisateur';

  const handleSend = () => {
    if (!to.trim()) return;
    setSending(true);
    // Simulate sending delay
    setTimeout(() => {
      push({
        type: 'success',
        title: 'Message envoy\u00e9',
        message: `E-mail envoy\u00e9 \u00e0 ${to}`,
        appId: 'zimbra-mail',
      });
      setSending(false);
      onClose();
    }, 600);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
    borderColor: colors.border,
    borderWidth: 1,
    borderStyle: 'solid',
  };

  return (
    <div
      className="fixed bottom-16 right-4 z-[9998] flex flex-col rounded-xl shadow-2xl border"
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        width: 380,
        maxHeight: 480,
      }}
      data-testid="quick-compose"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 rounded-t-xl"
        style={{ backgroundColor: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}
      >
        <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          Nouveau message
        </span>
        <button
          onClick={onClose}
          className="text-lg leading-none hover:opacity-70 transition-opacity"
          style={{ color: colors.textSecondary }}
          aria-label="Fermer"
        >
          &times;
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-2 p-3 flex-1 overflow-auto">
        {/* From (read-only) */}
        <div className="flex items-center gap-2 text-xs" style={{ color: colors.textSecondary }}>
          <span className="font-medium w-20">De :</span>
          <span style={{ color: colors.textPrimary }}>{fromLabel}</span>
        </div>

        {/* To */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-20 flex-shrink-0" style={{ color: colors.textSecondary }}>
            Destinataire :
          </label>
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="email@exemple.fr"
            className="flex-1 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': colors.accent } as React.CSSProperties}
          />
        </div>

        {/* Subject */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium w-20 flex-shrink-0" style={{ color: colors.textSecondary }}>
            Objet :
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Objet du message"
            className="flex-1 rounded-md px-2 py-1.5 text-sm outline-none focus:ring-1"
            style={{ ...inputStyle, '--tw-ring-color': colors.accent } as React.CSSProperties}
          />
        </div>

        {/* Body */}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Votre message..."
          rows={6}
          className="w-full rounded-md px-2 py-1.5 text-sm outline-none resize-none focus:ring-1"
          style={{ ...inputStyle, '--tw-ring-color': colors.accent } as React.CSSProperties}
        />
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-end gap-2 px-3 py-2.5 rounded-b-xl"
        style={{ borderTop: `1px solid ${colors.border}` }}
      >
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-md text-sm transition-colors hover:brightness-110"
          style={{ color: colors.textSecondary, backgroundColor: colors.surfaceAlt }}
        >
          Annuler
        </button>
        <button
          onClick={handleSend}
          disabled={!to.trim() || sending}
          className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors hover:brightness-110 disabled:opacity-50"
          style={{ backgroundColor: colors.accent, color: '#fff' }}
        >
          {sending ? 'Envoi...' : 'Envoyer'}
        </button>
      </div>
    </div>
  );
}
