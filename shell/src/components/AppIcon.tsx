import type { AppManifest } from '../types/app.types';

interface AppIconProps {
  app: AppManifest;
  size?: number;
  onClick?: () => void;
  showLabel?: boolean;
}

export function AppIcon({ app, size = 48, onClick, showLabel = false }: AppIconProps) {
  const isEmoji = !app.icon.startsWith('http');

  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-1.5 transition-transform duration-200 hover:-translate-y-1.5 hover:scale-112"
      title={app.description}
    >
      <div
        className="flex items-center justify-center rounded-xl shadow-lg transition-shadow duration-200 group-hover:shadow-xl"
        style={{
          width: size,
          height: size,
          background: `linear-gradient(135deg, ${app.color}33, ${app.color}11)`,
          border: `1px solid ${app.color}44`,
        }}
      >
        {isEmoji ? (
          <span style={{ fontSize: size * 0.5 }}>{app.icon}</span>
        ) : (
          <img src={app.icon} alt={app.label} style={{ width: size * 0.6, height: size * 0.6 }} />
        )}
      </div>
      {showLabel && (
        <span className="max-w-[64px] truncate text-[11px] text-[#e2e8f0]">{app.label}</span>
      )}
    </button>
  );
}
