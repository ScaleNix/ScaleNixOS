import { useThemeStore } from '../store/themeStore';

export function Wallpaper() {
  const colors = useThemeStore((s) => s.colors);
  const wallpaper = useThemeStore((s) => s.wallpaper);
  const customWallpaper = useThemeStore((s) => s.customWallpaper);

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* Base background */}
      <div className="absolute inset-0" style={{ backgroundColor: colors.bg }} />

      {/* Custom wallpaper image */}
      {customWallpaper && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${customWallpaper})` }}
        />
      )}

      {/* Dot grid */}
      {!customWallpaper && (
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `radial-gradient(circle, ${colors.textPrimary} 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />
      )}

      {/* Gradient accent */}
      {!customWallpaper && wallpaper.type === 'gradient' && (
        <div
          className="absolute inset-0"
          style={{ background: wallpaper.value }}
        />
      )}
    </div>
  );
}
