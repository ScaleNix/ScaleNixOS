import { useState, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useAppPrefsStore } from '../store/appPrefsStore';
import { useThemeStore } from '../store/themeStore';
import type { AppManifest } from '../types/app.types';

const CATEGORIES = [
  { key: 'all', label: 'Tous', icon: '\u2b50' },
  { key: 'communication', label: 'Communication', icon: '\ud83d\udcac' },
  { key: 'productivity', label: 'Productivite', icon: '\ud83d\udcbc' },
  { key: 'multimedia', label: 'Multimedia', icon: '\ud83c\udfac' },
  { key: 'tools', label: 'Outils', icon: '\ud83d\udee0\ufe0f' },
  { key: 'system', label: 'Systeme', icon: '\u2699\ufe0f' },
] as const;

const CATEGORY_LABELS: Record<string, string> = {
  communication: 'Communication',
  productivity: 'Productivite',
  multimedia: 'Multimedia',
  tools: 'Outils',
  system: 'Systeme',
};

const TYPE_LABELS: Record<string, string> = {
  iframe: 'Application web',
  xpra: 'Application Linux',
  native: 'Application integree',
};

export function AppStore() {
  const apps = useAppStore((s) => s.apps);
  const colors = useThemeStore((s) => s.colors);
  const { disabledApps, toggleApp } = useAppPrefsStore();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<AppManifest | null>(null);

  const filteredApps = useMemo(() => {
    return apps.filter((app) => {
      // Don't show the app-store itself
      if (app.id === 'app-store') return false;
      if (category !== 'all' && app.category !== category) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          app.label.toLowerCase().includes(q) ||
          app.description.toLowerCase().includes(q) ||
          app.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [apps, search, category]);

  const enabledCount = apps.filter((a) => a.id !== 'app-store' && !disabledApps.includes(a.id)).length;
  const totalCount = apps.filter((a) => a.id !== 'app-store').length;

  return (
    <div className="flex h-full" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Sidebar */}
      <div
        className="flex w-[200px] shrink-0 flex-col"
        style={{ backgroundColor: `${colors.surface}cc`, borderRight: `1px solid ${colors.border}60` }}
      >
        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: `1px solid ${colors.border}40` }}>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{'\ud83d\udecd\ufe0f'}</span>
            <div>
              <div className="text-sm font-bold">App Store</div>
              <div className="text-[10px]" style={{ color: colors.textSecondary }}>
                {enabledCount}/{totalCount} actives
              </div>
            </div>
          </div>
        </div>

        {/* Category nav */}
        <div className="flex flex-col gap-0.5 px-2 py-2 flex-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => { setCategory(cat.key); setSelectedApp(null); }}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium transition-all"
              style={{
                backgroundColor: category === cat.key ? `${colors.accent}20` : 'transparent',
                color: category === cat.key ? colors.accent : colors.textSecondary,
              }}
            >
              <span className="text-sm">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Stats footer */}
        <div className="px-4 py-3 text-[10px]" style={{ borderTop: `1px solid ${colors.border}40`, color: colors.textSecondary }}>
          {disabledApps.length > 0 && (
            <div>{disabledApps.length} application{disabledApps.length > 1 ? 's' : ''} masquee{disabledApps.length > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Search bar */}
        <div
          className="flex items-center gap-3 px-5 py-3"
          style={{ borderBottom: `1px solid ${colors.border}40` }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: colors.textSecondary }} className="shrink-0">
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelectedApp(null); }}
            placeholder="Rechercher une application..."
            className="flex-1 bg-transparent text-xs outline-none"
            style={{ color: colors.textPrimary }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="text-xs hover:opacity-70"
              style={{ color: colors.textSecondary }}
            >
              {'\u2715'}
            </button>
          )}
        </div>

        <div className="flex flex-1 min-h-0">
          {/* App grid */}
          <div
            className="flex-1 overflow-y-auto p-4"
            style={{ scrollbarWidth: 'thin' }}
          >
            {filteredApps.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs" style={{ color: colors.textSecondary }}>
                Aucune application trouvee
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3" style={{ gridTemplateColumns: selectedApp ? '1fr' : 'repeat(2, 1fr)' }}>
                {filteredApps.map((app) => {
                  const disabled = disabledApps.includes(app.id);
                  return (
                    <AppCard
                      key={app.id}
                      app={app}
                      disabled={disabled}
                      selected={selectedApp?.id === app.id}
                      colors={colors}
                      onToggle={() => toggleApp(app.id)}
                      onSelect={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selectedApp && (
            <DetailPanel
              app={selectedApp}
              disabled={disabledApps.includes(selectedApp.id)}
              colors={colors}
              onToggle={() => toggleApp(selectedApp.id)}
              onClose={() => setSelectedApp(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ── App Card ── */

interface AppCardProps {
  app: AppManifest;
  disabled: boolean;
  selected: boolean;
  colors: Record<string, string>;
  onToggle: () => void;
  onSelect: () => void;
}

function AppCard({ app, disabled, selected, colors, onToggle, onSelect }: AppCardProps) {
  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3.5 py-3 transition-all cursor-pointer"
      style={{
        backgroundColor: selected ? `${colors.accent}15` : `${colors.surface}80`,
        border: `1px solid ${selected ? colors.accent + '40' : colors.border}40`,
        opacity: disabled ? 0.5 : 1,
      }}
      onClick={onSelect}
    >
      {/* Icon */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
        style={{
          background: `linear-gradient(135deg, ${app.color}30, ${app.color}10)`,
          border: `1px solid ${app.color}30`,
        }}
      >
        {app.icon.startsWith('http') ? (
          <img src={app.icon} alt="" className="h-5 w-5" />
        ) : (
          <span className="text-xl">{app.icon}</span>
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-xs font-semibold" style={{ color: colors.textPrimary }}>
            {app.label}
          </span>
          {app.category && (
            <span
              className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium"
              style={{
                backgroundColor: `${app.color}20`,
                color: app.color,
              }}
            >
              {CATEGORY_LABELS[app.category] ?? app.category}
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[10px]" style={{ color: colors.textSecondary }}>
          {app.description}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className="shrink-0 relative w-9 h-5 rounded-full transition-colors"
        style={{
          backgroundColor: disabled ? `${colors.border}80` : colors.accent,
        }}
        title={disabled ? 'Activer' : 'Desactiver'}
      >
        <div
          className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
          style={{ left: disabled ? 2 : 18 }}
        />
      </button>
    </div>
  );
}

/* ── Detail Panel ── */

interface DetailPanelProps {
  app: AppManifest;
  disabled: boolean;
  colors: Record<string, string>;
  onToggle: () => void;
  onClose: () => void;
}

function DetailPanel({ app, disabled, colors, onToggle, onClose }: DetailPanelProps) {
  const permissions: string[] = [];
  if (app.type === 'iframe' || app.type === 'xpra') permissions.push('Acces reseau');
  if (app.keycloak_client) permissions.push('Authentification SSO');
  if (app.roles && app.roles.length > 0) permissions.push(`Roles: ${app.roles.join(', ')}`);
  if (app.sandboxPolicy) {
    if (app.sandboxPolicy.includes('allow-popups')) permissions.push('Popups');
    if (app.sandboxPolicy.includes('allow-downloads')) permissions.push('Telechargements');
    if (app.sandboxPolicy.includes('allow-modals')) permissions.push('Modales');
  }

  return (
    <div
      className="w-[260px] shrink-0 overflow-y-auto p-5"
      style={{
        borderLeft: `1px solid ${colors.border}40`,
        backgroundColor: `${colors.surface}60`,
        scrollbarWidth: 'thin',
      }}
    >
      {/* Close */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onClose}
          className="rounded-md p-1 text-xs transition-colors hover:bg-white/10"
          style={{ color: colors.textSecondary }}
        >
          {'\u2715'}
        </button>
      </div>

      {/* Icon + name */}
      <div className="flex flex-col items-center text-center mb-5">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl mb-3"
          style={{
            background: `linear-gradient(135deg, ${app.color}40, ${app.color}15)`,
            border: `1px solid ${app.color}30`,
          }}
        >
          {app.icon.startsWith('http') ? (
            <img src={app.icon} alt="" className="h-8 w-8" />
          ) : (
            <span className="text-3xl">{app.icon}</span>
          )}
        </div>
        <div className="text-sm font-bold" style={{ color: colors.textPrimary }}>{app.label}</div>
        <div className="text-[10px] mt-1" style={{ color: colors.textSecondary }}>
          {app.description}
        </div>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="w-full rounded-lg py-2 text-xs font-semibold transition-colors mb-5"
        style={{
          backgroundColor: disabled ? colors.accent : `${colors.border}60`,
          color: disabled ? '#fff' : colors.textSecondary,
        }}
      >
        {disabled ? 'Activer' : 'Desactiver'}
      </button>

      {/* Details */}
      <div className="space-y-4">
        {/* Type */}
        <DetailRow label="Type" value={TYPE_LABELS[app.type] ?? app.type} colors={colors} />

        {/* Category */}
        <DetailRow label="Categorie" colors={colors}>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{ backgroundColor: `${app.color}20`, color: app.color }}
          >
            {CATEGORY_LABELS[app.category] ?? app.category}
          </span>
        </DetailRow>

        {/* Size */}
        <DetailRow
          label="Taille par defaut"
          value={`${app.defaultSize.w} x ${app.defaultSize.h}`}
          colors={colors}
        />

        {/* Permissions */}
        {permissions.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold mb-1.5" style={{ color: colors.textSecondary }}>
              Permissions
            </div>
            <div className="flex flex-wrap gap-1.5">
              {permissions.map((p) => (
                <span
                  key={p}
                  className="rounded-md px-2 py-0.5 text-[10px]"
                  style={{ backgroundColor: `${colors.border}40`, color: colors.textSecondary }}
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Detail Row helper ── */

interface DetailRowProps {
  label: string;
  value?: string;
  colors: Record<string, string>;
  children?: React.ReactNode;
}

function DetailRow({ label, value, colors, children }: DetailRowProps) {
  return (
    <div>
      <div className="text-[10px] font-semibold mb-0.5" style={{ color: colors.textSecondary }}>
        {label}
      </div>
      {children ?? (
        <div className="text-xs" style={{ color: colors.textPrimary }}>
          {value}
        </div>
      )}
    </div>
  );
}
