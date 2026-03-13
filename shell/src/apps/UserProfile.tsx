import { useRef, useEffect } from 'react';
import { useAuth } from '../auth/useAuth';
import { useThemeStore } from '../store/themeStore';
import { useProfileStore } from '../store/profileStore';
import { usePresenceStore, type PresenceStatus } from '../store/presenceStore';
import { useNotifStore } from '../store/notifStore';

const AVATAR_COLORS = [
  '#8b5cf6', '#4361ee', '#0ea5e9', '#14b8a6', '#22c55e',
  '#eab308', '#f97316', '#ef4444', '#ec4899', '#6366f1',
];

const STATUS_PRESETS = [
  'Disponible',
  'En reunion',
  'En vacances',
  'Ne pas deranger',
  'En deplacement',
  'Occupe',
];

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: '#22c55e',
  away: '#eab308',
  busy: '#ef4444',
  offline: '#9ca3af',
};

const STATUS_LABELS: Record<PresenceStatus, string> = {
  online: 'En ligne',
  away: 'Absent',
  busy: 'Occupe',
  offline: 'Hors ligne',
};

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase())
    .slice(0, 2)
    .join('');
}

export function UserProfile() {
  const { user, logout } = useAuth();
  const colors = useThemeStore((s) => s.colors);
  const push = useNotifStore((s) => s.push);
  const {
    avatar, statusMessage, displayName, avatarColor,
    setAvatar, setStatusMessage, setDisplayName, setAvatarColor,
  } = useProfileStore();
  const presenceStatus = usePresenceStore((s) => s.status);
  const setPresenceStatus = usePresenceStore((s) => s.setStatus);
  const fileRef = useRef<HTMLInputElement>(null);

  // Initialize display name from Keycloak on first load
  useEffect(() => {
    if (!displayName && user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name, displayName, setDisplayName]);

  const effectiveName = displayName || user?.name || user?.preferred_username || '';
  const initials = getInitials(effectiveName);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      push({ type: 'error', title: 'Format non supporte', message: 'Utilisez une image (JPG, PNG, WebP)' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      push({ type: 'error', title: 'Fichier trop volumineux', message: 'Max 5 Mo' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setAvatar(reader.result as string);
      push({ type: 'success', title: 'Avatar mis a jour' });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary }}>
      {/* Header / Profile card */}
      <section
        className="rounded-xl p-6 mb-6"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative shrink-0">
            {avatar ? (
              <img
                src={avatar}
                alt="Avatar"
                className="h-20 w-20 rounded-full object-cover"
                style={{ border: `3px solid ${colors.accent}` }}
              />
            ) : (
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                style={{ backgroundColor: avatarColor, border: `3px solid ${colors.accent}` }}
              >
                {initials}
              </div>
            )}
            {/* Presence dot */}
            <span
              className="absolute bottom-0.5 right-0.5 h-4 w-4 rounded-full border-2"
              style={{
                backgroundColor: STATUS_COLORS[presenceStatus],
                borderColor: colors.surface,
                boxShadow: `0 0 4px ${STATUS_COLORS[presenceStatus]}`,
              }}
            />
          </div>

          {/* Name and info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate">{effectiveName}</h1>
            <p className="text-sm truncate" style={{ color: colors.textSecondary }}>
              {user?.email || ''}
            </p>
            <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              @{user?.preferred_username || ''}
            </p>
            {/* Role badges */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(user?.roles || [])
                .filter((r) => !r.startsWith('default-roles') && r !== 'offline_access' && r !== 'uma_authorization')
                .map((role) => (
                  <span
                    key={role}
                    className="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                    style={{
                      backgroundColor: `${colors.accent}20`,
                      color: colors.accent,
                      border: `1px solid ${colors.accent}40`,
                    }}
                  >
                    {role}
                  </span>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Presence status */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Statut de presence</h2>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="flex gap-2">
            {(Object.keys(STATUS_LABELS) as PresenceStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => setPresenceStatus(status)}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{
                  backgroundColor: presenceStatus === status ? `${STATUS_COLORS[status]}20` : 'transparent',
                  color: presenceStatus === status ? STATUS_COLORS[status] : colors.textSecondary,
                  border: `1px solid ${presenceStatus === status ? STATUS_COLORS[status] + '60' : colors.border}`,
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[status] }}
                />
                {STATUS_LABELS[status]}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Status message */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Message de statut</h2>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <input
            type="text"
            value={statusMessage}
            onChange={(e) => setStatusMessage(e.target.value)}
            placeholder="Ex: En reunion, En vacances..."
            maxLength={100}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
          <div className="flex flex-wrap gap-1.5 mt-3">
            {STATUS_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => setStatusMessage(preset)}
                className="rounded-md px-2 py-1 text-[11px] transition-colors"
                style={{
                  backgroundColor: statusMessage === preset ? `${colors.accent}20` : colors.bg,
                  color: statusMessage === preset ? colors.accent : colors.textSecondary,
                  border: `1px solid ${statusMessage === preset ? colors.accent + '40' : colors.border}`,
                }}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Display name */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Nom d'affichage</h2>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.name || 'Votre nom'}
            maxLength={50}
            className="w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
            }}
          />
          <p className="mt-2 text-[11px]" style={{ color: colors.textSecondary }}>
            Ce nom sera affiche dans la barre des taches et les applications.
          </p>
        </div>
      </section>

      {/* Avatar section */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Avatar</h2>
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
                style={{ backgroundColor: colors.accent }}
              >
                Choisir une image
              </button>
              {avatar && (
                <button
                  onClick={() => {
                    setAvatar(null);
                    push({ type: 'info', title: 'Avatar supprime' });
                  }}
                  className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                  style={{ backgroundColor: colors.border, color: colors.textSecondary }}
                >
                  Supprimer
                </button>
              )}
            </div>
            <span className="text-[11px]" style={{ color: colors.textSecondary }}>
              JPG, PNG ou WebP (max 5 Mo)
            </span>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />

          {/* Avatar color picker (for initials mode) */}
          {!avatar && (
            <div>
              <p className="text-xs font-medium mb-2" style={{ color: colors.textSecondary }}>
                Couleur de l'avatar
              </p>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAvatarColor(c)}
                    className="relative h-8 w-8 rounded-full transition-transform hover:scale-110"
                    style={{
                      backgroundColor: c,
                      border: avatarColor === c ? '3px solid white' : '2px solid transparent',
                      boxShadow: avatarColor === c ? `0 0 0 2px ${c}` : undefined,
                    }}
                  >
                    {avatarColor === c && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                        {initials}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Account info (read-only) */}
      <section className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Informations du compte</h2>
        <div
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <InfoRow label="Nom complet" value={user?.name || '-'} colors={colors} />
          <InfoRow label="Identifiant" value={user?.preferred_username || '-'} colors={colors} />
          <InfoRow label="E-mail" value={user?.email || '-'} colors={colors} />
          <InfoRow
            label="Roles"
            value={
              (user?.roles || [])
                .filter((r) => !r.startsWith('default-roles') && r !== 'offline_access' && r !== 'uma_authorization')
                .join(', ') || '-'
            }
            colors={colors}
          />
        </div>
      </section>

      {/* Logout */}
      <section>
        <button
          onClick={logout}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: '#ef4444' }}
        >
          Se deconnecter
        </button>
      </section>
    </div>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: any }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>{label}</span>
      <span className="text-xs" style={{ color: colors.textPrimary }}>{value}</span>
    </div>
  );
}
