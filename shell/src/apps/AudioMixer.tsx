import { useAudioStore, playSound, type SoundType } from '../store/audioStore';
import { useThemeStore } from '../store/themeStore';

const SOUND_TYPES: { type: SoundType; label: string; desc: string }[] = [
  { type: 'notification', label: 'Notification', desc: 'Ding court' },
  { type: 'error',        label: 'Erreur',       desc: 'Deux bips graves' },
  { type: 'success',      label: 'Succes',       desc: 'Deux tons ascendants' },
  { type: 'click',        label: 'Clic',         desc: 'Clic court' },
];

export function AudioMixer() {
  const colors = useThemeStore((s) => s.colors);
  const { volume, muted, notificationSound, setVolume, toggleMute, setNotificationSound } =
    useAudioStore();

  return (
    <div
      className="flex h-full flex-col overflow-auto"
      style={{ backgroundColor: colors.bg, color: colors.textPrimary }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-lg font-semibold">Audio</h2>
        <p className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
          Controle du volume et des sons systeme
        </p>
      </div>

      {/* Volume section */}
      <div className="px-5 py-3">
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Volume principal</span>
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ backgroundColor: colors.border, color: colors.textSecondary }}
            >
              {muted ? 'MUTE' : `${volume}%`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleMute}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-lg transition-all hover:brightness-110 active:scale-95 shrink-0"
              style={{
                backgroundColor: muted ? `${colors.accent}33` : colors.accent,
                color: muted ? colors.accent : '#fff',
              }}
              title={muted ? 'Reactiver le son' : 'Couper le son'}
            >
              {muted ? '\uD83D\uDD07' : volume > 50 ? '\uD83D\uDD0A' : volume > 0 ? '\uD83D\uDD09' : '\uD83D\uDD08'}
            </button>

            <input
              type="range"
              min={0}
              max={100}
              value={muted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, ${colors.accent} ${muted ? 0 : volume}%, ${colors.border} ${muted ? 0 : volume}%)`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Notification sounds toggle */}
      <div className="px-5 py-2">
        <div
          className="rounded-xl p-4 flex items-center justify-between"
          style={{ backgroundColor: colors.surfaceAlt }}
        >
          <div>
            <div className="text-sm font-medium">Sons de notification</div>
            <div className="text-xs mt-0.5" style={{ color: colors.textSecondary }}>
              Jouer un son lors des notifications
            </div>
          </div>
          <button
            onClick={() => setNotificationSound(!notificationSound)}
            className="relative w-11 h-6 rounded-full transition-colors shrink-0"
            style={{
              backgroundColor: notificationSound ? colors.accent : colors.border,
            }}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform"
              style={{
                transform: notificationSound ? 'translateX(20px)' : 'translateX(0)',
              }}
            />
          </button>
        </div>
      </div>

      {/* Sound preview */}
      <div className="px-5 py-3 flex-1">
        <div className="text-sm font-medium mb-2">Apercu des sons</div>
        <div className="space-y-2">
          {SOUND_TYPES.map(({ type, label, desc }) => (
            <div
              key={type}
              className="rounded-xl p-3 flex items-center justify-between"
              style={{ backgroundColor: colors.surfaceAlt }}
            >
              <div>
                <div className="text-sm">{label}</div>
                <div className="text-[11px]" style={{ color: colors.textSecondary }}>
                  {desc}
                </div>
              </div>
              <button
                onClick={() => playSound(type)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:brightness-110 active:scale-95"
                style={{
                  backgroundColor: `${colors.accent}22`,
                  color: colors.accent,
                }}
              >
                {'\u25B6'} Tester
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
