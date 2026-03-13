import { useRef, useState } from 'react';
import { useThemeStore, THEME_PRESETS, COMMUNITY_THEMES, type ThemeColors, type AutoThemeMode } from '../store/themeStore';
import { useNotifStore } from '../store/notifStore';

const ACCENT_COLORS = [
  '#4361ee', '#0ea5e9', '#8b5cf6', '#22c55e', '#f97316',
  '#ec4899', '#ef4444', '#14b8a6', '#eab308', '#6366f1',
];

const THEME_COLOR_KEYS: (keyof ThemeColors)[] = [
  'bg', 'surface', 'surfaceAlt', 'border', 'textPrimary', 'textSecondary', 'accent',
];

function isValidThemeColors(obj: unknown): obj is ThemeColors {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return THEME_COLOR_KEYS.every(
    (k) => typeof o[k] === 'string' && /^#[0-9a-fA-F]{3,8}$/.test(o[k] as string),
  );
}

export function Settings() {
  const { themeId, colors, customWallpaper, setTheme, setCustomWallpaper, setAccentColor, applyCustomColors, autoTheme, scheduleLight, scheduleDark, setAutoTheme, setSchedule } = useThemeStore();
  const push = useNotifStore((s) => s.push);
  const fileRef = useRef<HTMLInputElement>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const handleWallpaperUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      push({ type: 'error', title: 'Format non supporte', message: 'Utilisez une image (JPG, PNG, WebP)' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      push({ type: 'error', title: 'Fichier trop volumineux', message: 'Max 10 Mo' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCustomWallpaper(reader.result as string);
      push({ type: 'success', title: 'Fond d\'ecran applique' });
    };
    reader.readAsDataURL(file);
  };

  const handleExportTheme = () => {
    const themeData = { name: THEME_PRESETS.find((p) => p.id === themeId)?.name ?? themeId, colors };
    const blob = new Blob([JSON.stringify(themeData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `theme-${themeData.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    push({ type: 'success', title: 'Theme exporte', message: `${themeData.name}.json telecharge` });
  };

  const handleImportTheme = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) {
      push({ type: 'error', title: 'Format invalide', message: 'Utilisez un fichier .json' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (!data.name || typeof data.name !== 'string') {
          push({ type: 'error', title: 'Theme invalide', message: 'Le champ "name" est requis' });
          return;
        }
        if (!isValidThemeColors(data.colors)) {
          push({ type: 'error', title: 'Theme invalide', message: 'Les couleurs sont invalides ou incompletes' });
          return;
        }
        applyCustomColors(data.name, data.colors);
        push({ type: 'success', title: 'Theme importe', message: `"${data.name}" applique` });
      } catch {
        push({ type: 'error', title: 'Erreur de lecture', message: 'Le fichier JSON est invalide' });
      }
    };
    reader.readAsText(file);
    // Reset so re-importing the same file triggers onChange
    e.target.value = '';
  };

  return (
    <div className="h-full overflow-auto p-6" style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary }}>
      <h1 className="text-lg font-bold mb-6">Preferences</h1>

      {/* Theme selection */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Theme</h2>
        <div className="grid grid-cols-4 gap-3">
          {THEME_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className="group relative rounded-xl p-3 text-left transition-all"
              style={{
                backgroundColor: preset.colors.surface,
                border: `2px solid ${themeId === preset.id ? preset.colors.accent : preset.colors.border}`,
              }}
            >
              {/* Mini preview */}
              <div
                className="mb-2 h-12 w-full rounded-lg"
                style={{
                  backgroundColor: preset.colors.bg,
                  backgroundImage: preset.wallpaper.type === 'gradient' ? preset.wallpaper.value : undefined,
                }}
              >
                {/* Mini dots */}
                <div className="flex gap-1 p-2">
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#ff5f57' }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#febc2e' }} />
                  <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: '#28c840' }} />
                </div>
              </div>
              <span className="text-xs font-medium" style={{ color: preset.colors.textPrimary }}>
                {preset.name}
              </span>
              {themeId === preset.id && (
                <div
                  className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px]"
                  style={{ backgroundColor: preset.colors.accent }}
                >
                  {'\u2713'}
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Auto theme switching */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Apparence automatique</h2>
        <div className="rounded-lg p-4 space-y-4" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <div className="flex gap-2">
            {([
              { value: 'off' as AutoThemeMode, label: 'Desactive' },
              { value: 'system' as AutoThemeMode, label: 'Suivre le systeme' },
              { value: 'schedule' as AutoThemeMode, label: 'Horaire' },
            ]).map((opt) => (
              <button
                key={opt.value}
                onClick={() => setAutoTheme(opt.value)}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                style={{
                  backgroundColor: autoTheme === opt.value ? colors.accent : colors.border,
                  color: autoTheme === opt.value ? '#ffffff' : colors.textPrimary,
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
          {autoTheme === 'system' && (
            <p className="text-[11px]" style={{ color: colors.textSecondary }}>
              Le theme bascule automatiquement entre Light et Midnight selon les preferences de votre navigateur / OS.
            </p>
          )}
          {autoTheme === 'schedule' && (
            <div className="space-y-3">
              <p className="text-[11px]" style={{ color: colors.textSecondary }}>
                Le theme bascule entre Light et Midnight aux heures definies.
              </p>
              <div className="flex gap-4 items-center">
                <label className="flex items-center gap-2 text-xs">
                  <span style={{ color: colors.textSecondary }}>Mode clair</span>
                  <input
                    type="time"
                    value={scheduleLight}
                    onChange={(e) => setSchedule(e.target.value, scheduleDark)}
                    className="rounded-md px-2 py-1 text-xs outline-none"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <span style={{ color: colors.textSecondary }}>Mode sombre</span>
                  <input
                    type="time"
                    value={scheduleDark}
                    onChange={(e) => setSchedule(scheduleLight, e.target.value)}
                    className="rounded-md px-2 py-1 text-xs outline-none"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}`, color: colors.textPrimary }}
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Community themes – Feature #24 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Themes communautaires</h2>
        <div className="grid grid-cols-5 gap-3">
          {COMMUNITY_THEMES.map((ct) => {
            const isActive = themeId === `custom-${ct.name.toLowerCase().replace(/\s+/g, '-')}`;
            return (
              <div
                key={ct.name}
                className="relative rounded-xl p-3 transition-all"
                style={{
                  backgroundColor: ct.colors.surface,
                  border: `2px solid ${isActive ? ct.colors.accent : ct.colors.border}`,
                }}
              >
                {/* Color preview dots */}
                <div className="flex gap-1.5 mb-2 justify-center">
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: ct.colors.bg, border: `1px solid ${ct.colors.border}` }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: ct.colors.surface, border: `1px solid ${ct.colors.border}` }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: ct.colors.accent }} />
                  <div className="h-4 w-4 rounded-full" style={{ backgroundColor: ct.colors.textPrimary }} />
                </div>
                <p className="text-xs font-medium text-center mb-2" style={{ color: ct.colors.textPrimary }}>
                  {ct.name}
                </p>
                <button
                  onClick={() => applyCustomColors(ct.name, ct.colors)}
                  className="w-full rounded-lg px-2 py-1 text-[11px] font-medium text-white transition-colors"
                  style={{ backgroundColor: ct.colors.accent }}
                >
                  {isActive ? 'Actif' : 'Appliquer'}
                </button>
                {isActive && (
                  <div
                    className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full text-white text-[10px]"
                    style={{ backgroundColor: ct.colors.accent }}
                  >
                    {'\u2713'}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Import / Export – Feature #24 */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Importer / Exporter</h2>
        <div className="flex gap-3">
          <button
            onClick={handleExportTheme}
            className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
            style={{ backgroundColor: colors.accent }}
          >
            Exporter le theme
          </button>
          <button
            onClick={() => importRef.current?.click()}
            className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{ backgroundColor: colors.border, color: colors.textPrimary }}
          >
            Importer un theme
          </button>
        </div>
        <p className="mt-2 text-[11px]" style={{ color: colors.textSecondary }}>
          Exportez votre theme actuel en JSON ou importez un fichier .json pour appliquer un theme personnalise.
        </p>
        <input
          ref={importRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportTheme}
        />
      </section>

      {/* Accent color */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Couleur d'accent</h2>
        <div className="flex gap-2 flex-wrap">
          {ACCENT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setAccentColor(c)}
              className="h-8 w-8 rounded-full transition-transform hover:scale-110"
              style={{
                backgroundColor: c,
                border: colors.accent === c ? '3px solid white' : '2px solid transparent',
                boxShadow: colors.accent === c ? `0 0 0 2px ${c}` : undefined,
              }}
            />
          ))}
        </div>
      </section>

      {/* Wallpaper */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>Fond d'ecran</h2>

        <div className="flex gap-3 items-start">
          {/* Current preview */}
          <div
            className="h-24 w-40 rounded-lg border overflow-hidden shrink-0"
            style={{ borderColor: colors.border }}
          >
            {customWallpaper ? (
              <img src={customWallpaper} alt="Wallpaper" className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  backgroundColor: colors.bg,
                  backgroundImage: `radial-gradient(circle, ${colors.textPrimary}22 1px, transparent 1px)`,
                  backgroundSize: '8px 8px',
                }}
              />
            )}
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-lg px-4 py-2 text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: colors.accent }}
            >
              Choisir une image
            </button>
            {customWallpaper && (
              <button
                onClick={() => {
                  setCustomWallpaper(null);
                  push({ type: 'info', title: 'Fond d\'ecran par defaut restaure' });
                }}
                className="rounded-lg px-4 py-2 text-xs font-medium transition-colors"
                style={{ backgroundColor: colors.border, color: colors.textSecondary }}
              >
                Restaurer le defaut
              </button>
            )}
            <span className="text-[11px]" style={{ color: colors.textSecondary }}>
              JPG, PNG ou WebP (max 10 Mo)
            </span>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleWallpaperUpload}
        />
      </section>

      {/* Grist Integration */}
      <GristSettings colors={colors} push={push} />

      {/* Info */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>A propos</h2>
        <div className="rounded-lg p-4 text-xs space-y-1" style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}>
          <p><strong>ScalenixOS</strong> v1.0</p>
          <p style={{ color: colors.textSecondary }}>Systeme d'exploitation cloud base sur NixOS</p>
          <p style={{ color: colors.textSecondary }}>Theme actif : {THEME_PRESETS.find((p) => p.id === themeId)?.name ?? COMMUNITY_THEMES.find((ct) => themeId === `custom-${ct.name.toLowerCase().replace(/\s+/g, '-')}`)?.name ?? themeId}</p>
        </div>
      </section>
    </div>
  );
}

function GristSettings({ colors, push }: { colors: any; push: (n: any) => void }) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('scalenix-grist-api-key') || '');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'ok' | 'error'>('idle');

  const handleSave = () => {
    localStorage.setItem('scalenix-grist-api-key', apiKey.trim());
    push({ type: 'success', title: 'Cle API Grist enregistree' });
  };

  const handleTest = async () => {
    setTesting(true);
    setStatus('idle');
    try {
      const res = await fetch('/grist-api/orgs', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setStatus('ok');
        push({ type: 'success', title: `Connexion Grist OK (${data.length} organisation${data.length > 1 ? 's' : ''})` });
      } else {
        throw new Error('Reponse inattendue');
      }
    } catch {
      setStatus('error');
      push({ type: 'error', title: 'Echec connexion Grist', message: 'Verifiez votre cle API' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-sm font-semibold mb-3" style={{ color: colors.textSecondary }}>
        Integration Grist
      </h2>
      <div
        className="rounded-lg p-4 space-y-3"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <p className="text-xs" style={{ color: colors.textSecondary }}>
          Connectez votre compte Grist pour importer des fichiers CSV/Excel depuis Nextcloud directement dans Grist.
          Recuperez votre cle API dans Grist &gt; Profil &gt; Parametres.
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Cle API Grist..."
            className="flex-1 rounded-md px-3 py-1.5 text-xs outline-none"
            style={{
              backgroundColor: colors.bg,
              border: `1px solid ${status === 'ok' ? '#22c55e' : status === 'error' ? '#ef4444' : colors.border}`,
              color: colors.textPrimary,
            }}
          />
          <button
            onClick={handleTest}
            disabled={testing || !apiKey.trim()}
            className="rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40"
            style={{ backgroundColor: colors.border, color: colors.textPrimary }}
          >
            {testing ? '...' : 'Tester'}
          </button>
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:opacity-40"
            style={{ backgroundColor: colors.accent }}
          >
            Enregistrer
          </button>
        </div>
        {status === 'ok' && (
          <p className="text-[11px] font-medium" style={{ color: '#22c55e' }}>
            Connexion reussie — l'option "Ouvrir dans Grist" apparaitra dans l'explorateur de fichiers
          </p>
        )}
      </div>
    </section>
  );
}
