import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/appStore';
import { useWindowStore } from '../store/windowStore';
import { useAuth } from '../auth/useAuth';
import { useThemeStore, THEME_PRESETS } from '../store/themeStore';
import { useShortcutStore } from '../store/shortcutStore';
import { useDesktopStore } from '../store/desktopStore';
import { useLockStore } from '../store/lockStore';

interface SpotlightProps {
  open: boolean;
  onClose: () => void;
}

type ResultCategory =
  | 'applications'
  | 'fichiers_recents'
  | 'raccourcis'
  | 'contacts'
  | 'actions';

interface SearchResult {
  id: string;
  label: string;
  icon: string;
  description: string;
  category: ResultCategory;
  hint?: string;
  onSelect: () => void;
}

interface ContactEntry {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  title: string;
  department: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  avatar: string;
}

// Directory contacts — same data as Directory.tsx
const CONTACTS: ContactEntry[] = [
  { id: '1', firstName: 'Malik', lastName: 'Benmekki', email: 'malik@scalenix.fr', department: 'Direction', title: 'CEO & Fondateur', status: 'online', avatar: 'MB' },
  { id: '2', firstName: 'Alice', lastName: 'Dupont', email: 'alice@scalenix.fr', department: 'Developpement', title: 'Lead Developer', status: 'online', avatar: 'AD' },
  { id: '3', firstName: 'Bob', lastName: 'Martin', email: 'bob@scalenix.fr', department: 'Infrastructure', title: 'Administrateur Systeme', status: 'away', avatar: 'BM' },
  { id: '4', firstName: 'Claire', lastName: 'Leroy', email: 'claire@scalenix.fr', department: 'Design', title: 'UX/UI Designer Senior', status: 'online', avatar: 'CL' },
  { id: '5', firstName: 'David', lastName: 'Moreau', email: 'david@scalenix.fr', department: 'Infrastructure', title: 'DevOps Engineer', status: 'busy', avatar: 'DM' },
  { id: '6', firstName: 'Sophie', lastName: 'Bernard', email: 'sophie@scalenix.fr', department: 'Commercial', title: 'Directrice Commerciale', status: 'online', avatar: 'SB' },
  { id: '7', firstName: 'Thomas', lastName: 'Petit', email: 'thomas@scalenix.fr', department: 'Developpement', title: 'Developpeur Backend', status: 'online', avatar: 'TP' },
  { id: '8', firstName: 'Emma', lastName: 'Rousseau', email: 'emma@scalenix.fr', department: 'Developpement', title: 'Developpeur Frontend', status: 'away', avatar: 'ER' },
  { id: '9', firstName: 'Lucas', lastName: 'Garcia', email: 'lucas@scalenix.fr', department: 'Developpement', title: 'Developpeur Full-Stack', status: 'online', avatar: 'LG' },
  { id: '10', firstName: 'Julie', lastName: 'Fournier', email: 'julie@scalenix.fr', department: 'Produit', title: 'Product Owner', status: 'online', avatar: 'JF' },
  { id: '11', firstName: 'Antoine', lastName: 'Durand', email: 'antoine@scalenix.fr', department: 'Securite', title: 'RSSI', status: 'busy', avatar: 'ADu' },
  { id: '12', firstName: 'Camille', lastName: 'Bonnet', email: 'camille@scalenix.fr', department: 'RH', title: 'Responsable RH', status: 'online', avatar: 'CB' },
  { id: '13', firstName: 'Hugo', lastName: 'Mercier', email: 'hugo@scalenix.fr', department: 'Data', title: 'Data Engineer', status: 'online', avatar: 'HM' },
  { id: '14', firstName: 'Lea', lastName: 'Lambert', email: 'lea@scalenix.fr', department: 'Support', title: 'Responsable Support', status: 'online', avatar: 'LL' },
  { id: '15', firstName: 'Nathan', lastName: 'Girard', email: 'nathan@scalenix.fr', department: 'Infrastructure', title: 'Ingenieur Cloud', status: 'away', avatar: 'NG' },
  { id: '16', firstName: 'Manon', lastName: 'Andre', email: 'manon@scalenix.fr', department: 'Design', title: 'UI Designer', status: 'online', avatar: 'MA' },
  { id: '17', firstName: 'Maxime', lastName: 'Lemoine', email: 'maxime@scalenix.fr', department: 'Developpement', title: 'Developpeur Mobile', status: 'offline', avatar: 'ML' },
  { id: '18', firstName: 'Chloe', lastName: 'Roux', email: 'chloe@scalenix.fr', department: 'Commercial', title: 'Chargee de Clientele', status: 'online', avatar: 'CR' },
  { id: '19', firstName: 'Alexandre', lastName: 'Simon', email: 'alexandre@scalenix.fr', department: 'Developpement', title: 'Architecte Logiciel', status: 'online', avatar: 'AS' },
  { id: '20', firstName: 'Ines', lastName: 'Morel', email: 'ines@scalenix.fr', department: 'Data', title: 'Data Scientist', status: 'busy', avatar: 'IM' },
  { id: '21', firstName: 'Paul', lastName: 'Laurent', email: 'paul@scalenix.fr', department: 'Direction', title: 'Directeur Technique (CTO)', status: 'online', avatar: 'PL' },
  { id: '22', firstName: 'Sarah', lastName: 'Michel', email: 'sarah@scalenix.fr', department: 'Produit', title: 'UX Researcher', status: 'away', avatar: 'SM' },
  { id: '23', firstName: 'Romain', lastName: 'Lefebvre', email: 'romain@scalenix.fr', department: 'Securite', title: 'Pentester', status: 'online', avatar: 'RL' },
  { id: '24', firstName: 'Marine', lastName: 'David', email: 'marine@scalenix.fr', department: 'RH', title: 'Chargee de Recrutement', status: 'online', avatar: 'MD' },
  { id: '25', firstName: 'Kevin', lastName: 'Bertrand', email: 'kevin@scalenix.fr', department: 'Support', title: 'Technicien Support N2', status: 'online', avatar: 'KB' },
  { id: '26', firstName: 'Laura', lastName: 'Robert', email: 'laura@scalenix.fr', department: 'Commercial', title: 'Responsable Partenariats', status: 'offline', avatar: 'LR' },
  { id: '27', firstName: 'Julien', lastName: 'Richard', email: 'julien@scalenix.fr', department: 'Infrastructure', title: 'DBA PostgreSQL', status: 'online', avatar: 'JR' },
  { id: '28', firstName: 'Elise', lastName: 'Dubois', email: 'elise@scalenix.fr', department: 'Direction', title: 'Directrice Financiere (CFO)', status: 'online', avatar: 'ED' },
  { id: '29', firstName: 'Theo', lastName: 'Guerin', email: 'theo@scalenix.fr', department: 'Developpement', title: 'QA Engineer', status: 'away', avatar: 'TG' },
  { id: '30', firstName: 'Oceane', lastName: 'Muller', email: 'oceane@scalenix.fr', department: 'Design', title: 'Motion Designer', status: 'online', avatar: 'OM' },
  { id: '31', firstName: 'Quentin', lastName: 'Lefevre', email: 'quentin@scalenix.fr', department: 'Data', title: 'ML Engineer', status: 'online', avatar: 'QL' },
  { id: '32', firstName: 'Charlotte', lastName: 'Martinez', email: 'charlotte@scalenix.fr', department: 'Produit', title: 'Scrum Master', status: 'busy', avatar: 'CM' },
];

const STATUS_COLOR: Record<string, string> = {
  online: '#22c55e',
  away: '#f59e0b',
  busy: '#ef4444',
  offline: '#64748b',
};

const CATEGORY_LABELS: Record<ResultCategory, string> = {
  applications: 'Applications',
  fichiers_recents: 'Raccourcis bureau',
  raccourcis: 'Raccourcis clavier',
  contacts: 'Contacts',
  actions: 'Actions rapides',
};

const CATEGORY_ORDER: ResultCategory[] = [
  'applications',
  'fichiers_recents',
  'contacts',
  'raccourcis',
  'actions',
];

export function Spotlight({ open, onClose }: SpotlightProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const apps = useAppStore((s) => s.apps);
  const { user } = useAuth();
  const windows = useWindowStore((s) => s.windows);
  const openWindow = useWindowStore((s) => s.openWindow);
  const focusWindow = useWindowStore((s) => s.focusWindow);
  const restoreWindow = useWindowStore((s) => s.restoreWindow);
  const colors = useThemeStore((s) => s.colors);
  const setTheme = useThemeStore((s) => s.setTheme);
  const themeId = useThemeStore((s) => s.themeId);
  const shortcuts = useShortcutStore((s) => s.shortcuts);
  const desktopShortcuts = useDesktopStore((s) => s.shortcuts);
  const lockScreen = useLockStore((s) => s.lock);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const buildResults = useCallback((): SearchResult[] => {
    const q = query.toLowerCase().trim();
    const results: SearchResult[] = [];

    // ---- Applications ----
    const visibleApps = apps.filter((app) => {
      if (app.roles && app.roles.length > 0 && !app.roles.some((r) => user?.roles.includes(r))) return false;
      return true;
    });

    for (const app of visibleApps) {
      if (!q || app.label.toLowerCase().includes(q) || app.description.toLowerCase().includes(q) || app.id.includes(q)) {
        results.push({
          id: `app-${app.id}`,
          label: app.label,
          icon: app.icon,
          description: app.description,
          category: 'applications',
          onSelect: () => { openWindow(app); onClose(); },
        });
      }
    }

    // ---- Desktop shortcuts (Fichiers recents / Raccourcis bureau) ----
    for (const sc of desktopShortcuts) {
      if (!q || sc.label.toLowerCase().includes(q)) {
        // Only show desktop shortcuts that are not already shown as apps
        const alreadyShown = results.some((r) => r.id === `app-${sc.appId}`);
        if (!alreadyShown) {
          results.push({
            id: `desktop-${sc.id}`,
            label: sc.label,
            icon: sc.icon,
            description: sc.type === 'file' ? `Fichier: ${sc.fileName ?? sc.label}` : 'Raccourci bureau',
            category: 'fichiers_recents',
            onSelect: () => {
              if (sc.type === 'app' && sc.appId) {
                const app = apps.find((a) => a.id === sc.appId);
                if (app) openWindow(app);
              }
              onClose();
            },
          });
        }
      }
    }

    // ---- Contacts ----
    if (q.length >= 1) {
      for (const contact of CONTACTS) {
        const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
        const searchable = `${fullName} ${contact.email} ${contact.title} ${contact.department}`.toLowerCase();
        if (searchable.includes(q)) {
          results.push({
            id: `contact-${contact.id}`,
            label: `${contact.firstName} ${contact.lastName}`,
            icon: contact.avatar,
            description: `${contact.title} - ${contact.email}`,
            category: 'contacts',
            hint: contact.department,
            onSelect: () => {
              // Open Directory app focused on this contact
              const dirApp = apps.find((a) => a.id === 'directory');
              if (dirApp) openWindow(dirApp);
              onClose();
            },
          });
        }
      }
    }

    // ---- Keyboard shortcuts (Raccourcis clavier) ----
    if (q.length >= 1) {
      for (const sc of shortcuts) {
        const searchable = `${sc.label} ${sc.description} ${sc.keys}`.toLowerCase();
        if (searchable.includes(q)) {
          results.push({
            id: `shortcut-${sc.id}`,
            label: sc.label,
            icon: '\u2328\ufe0f',
            description: sc.description,
            category: 'raccourcis',
            hint: sc.keys,
            onSelect: () => { onClose(); },
          });
        }
      }
    }

    // ---- Actions rapides ----
    const quickActions: { label: string; icon: string; desc: string; keywords: string[]; hint?: string; fn: () => void }[] = [
      {
        label: "Verrouiller l'ecran",
        icon: '\ud83d\udd12',
        desc: "Verrouiller la session",
        keywords: ['lock', 'verrouiller', 'ecran', 'securite'],
        hint: 'Ctrl+Alt+L',
        fn: () => { onClose(); lockScreen(); },
      },
      {
        label: 'Changer de theme',
        icon: '\ud83c\udfa8',
        desc: `Theme actuel: ${THEME_PRESETS.find((p) => p.id === themeId)?.name ?? themeId}`,
        keywords: ['theme', 'apparence', 'dark', 'light', 'couleur', 'sombre', 'clair'],
        fn: () => {
          // Cycle to next theme
          const currentIndex = THEME_PRESETS.findIndex((p) => p.id === themeId);
          const nextIndex = (currentIndex + 1) % THEME_PRESETS.length;
          setTheme(THEME_PRESETS[nextIndex].id);
          onClose();
        },
      },
      {
        label: 'Nouveau fichier texte',
        icon: '\ud83d\udcc4',
        desc: 'Creer un nouveau document',
        keywords: ['nouveau', 'fichier', 'texte', 'document', 'creer', 'new'],
        fn: () => {
          const editorApp = apps.find((a) => a.id === 'onlyoffice');
          if (editorApp) openWindow(editorApp);
          onClose();
        },
      },
      {
        label: 'Ouvrir les parametres',
        icon: '\u2699\ufe0f',
        desc: 'Themes et personnalisation',
        keywords: ['settings', 'parametres', 'preferences', 'config', 'reglages'],
        fn: () => {
          const settingsApp = apps.find((a) => a.id === 'settings');
          if (settingsApp) openWindow(settingsApp);
          onClose();
        },
      },
      {
        label: 'Plein ecran',
        icon: '\u26f6',
        desc: 'Basculer le mode plein ecran',
        keywords: ['fullscreen', 'plein', 'ecran', 'full'],
        hint: 'F11',
        fn: () => {
          onClose();
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        },
      },
      {
        label: 'Deconnexion',
        icon: '\ud83d\udeaa',
        desc: 'Se deconnecter de la session',
        keywords: ['logout', 'deconnexion', 'quitter', 'sortir'],
        fn: () => { onClose(); },
      },
      {
        label: 'Actualiser',
        icon: '\ud83d\udd04',
        desc: 'Recharger la page',
        keywords: ['refresh', 'actualiser', 'reload', 'recharger'],
        hint: 'Ctrl+R',
        fn: () => { onClose(); window.location.reload(); },
      },
    ];

    for (const action of quickActions) {
      if (!q || action.label.toLowerCase().includes(q) || action.keywords.some((k) => k.includes(q))) {
        results.push({
          id: `action-${action.label}`,
          label: action.label,
          icon: action.icon,
          description: action.desc,
          category: 'actions',
          hint: action.hint,
          onSelect: action.fn,
        });
      }
    }

    // ---- Open windows (shown when searching) ----
    if (q) {
      for (const win of windows) {
        if (win.title.toLowerCase().includes(q)) {
          const alreadyShown = results.some((r) => r.id === `app-${win.appId}`);
          if (!alreadyShown) {
            results.push({
              id: `win-${win.id}`,
              label: win.title,
              icon: win.icon,
              description: win.status === 'minimized' ? 'Fenetre minimisee' : 'Fenetre ouverte',
              category: 'applications',
              onSelect: () => {
                if (win.status === 'minimized') restoreWindow(win.id);
                focusWindow(win.id);
                onClose();
              },
            });
          }
        }
      }
    }

    return results;
  }, [query, apps, windows, user, openWindow, focusWindow, restoreWindow, onClose, desktopShortcuts, shortcuts, lockScreen, themeId, setTheme]);

  const results = buildResults();

  // Group results by category in defined order, limiting per category
  const grouped = useMemo(() => {
    const q = query.toLowerCase().trim();
    const maxPerCategory = q ? 5 : 4;
    const sections: { category: ResultCategory; label: string; items: SearchResult[] }[] = [];

    for (const cat of CATEGORY_ORDER) {
      const items = results.filter((r) => r.category === cat).slice(0, maxPerCategory);
      if (items.length > 0) {
        sections.push({ category: cat, label: CATEGORY_LABELS[cat], items });
      }
    }
    return sections;
  }, [results, query]);

  // Flat list for keyboard navigation
  const flatResults = useMemo(() => grouped.flatMap((s) => s.items), [grouped]);

  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${selectedIdx}"]`);
    if (el) el.scrollIntoView({ block: 'nearest' });
  }, [selectedIdx]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && flatResults[selectedIdx]) {
      e.preventDefault();
      flatResults[selectedIdx].onSelect();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!open) return null;

  let globalIdx = -1;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-start justify-center pt-[12vh]"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[600px] rounded-2xl shadow-2xl overflow-hidden"
        style={{
          backgroundColor: colors.surface,
          border: `1px solid ${colors.border}`,
          boxShadow: `0 25px 60px rgba(0,0,0,0.4), 0 0 0 1px ${colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ color: colors.textSecondary, flexShrink: 0 }}>
            <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2" />
            <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher apps, fichiers, contacts, raccourcis..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: colors.textPrimary }}
          />
          <kbd
            className="rounded px-1.5 py-0.5 text-[10px] font-mono shrink-0"
            style={{ backgroundColor: colors.bg, color: colors.textSecondary, border: `1px solid ${colors.border}` }}
          >
            ESC
          </kbd>
        </div>

        {/* Results grouped by category */}
        <div ref={listRef} className="max-h-[420px] overflow-auto" style={{ scrollbarWidth: 'thin' }}>
          {grouped.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="text-2xl mb-2 opacity-40">
                {query ? '\ud83d\udd0d' : '\u2328\ufe0f'}
              </div>
              <div className="text-sm" style={{ color: colors.textSecondary }}>
                {query ? `Aucun resultat pour "${query}"` : 'Commencez a taper pour rechercher...'}
              </div>
            </div>
          ) : (
            grouped.map((section) => (
              <div key={section.category}>
                {/* Section header */}
                <div
                  className="sticky top-0 flex items-center gap-2 px-5 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{
                    color: colors.textSecondary,
                    backgroundColor: colors.surface,
                    borderBottom: `1px solid ${colors.border}40`,
                  }}
                >
                  {section.label}
                  <span
                    className="rounded-full px-1.5 py-0 text-[9px] font-medium"
                    style={{ backgroundColor: `${colors.accent}15`, color: colors.accent }}
                  >
                    {section.items.length}
                  </span>
                </div>

                {/* Section items */}
                {section.items.map((r) => {
                  globalIdx++;
                  const idx = globalIdx;
                  const isSelected = idx === selectedIdx;
                  const isContact = r.category === 'contacts';
                  const isShortcut = r.category === 'raccourcis';

                  return (
                    <button
                      key={r.id}
                      data-idx={idx}
                      onClick={r.onSelect}
                      onMouseEnter={() => setSelectedIdx(idx)}
                      className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors"
                      style={{
                        backgroundColor: isSelected ? `${colors.accent}12` : 'transparent',
                      }}
                    >
                      {/* Icon / Avatar */}
                      {isContact ? (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: `${colors.accent}25`, color: colors.accent }}
                        >
                          {r.icon.slice(0, 2)}
                        </div>
                      ) : (
                        <span className="text-lg w-8 text-center shrink-0">{r.icon}</span>
                      )}

                      {/* Label + description */}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate" style={{ color: colors.textPrimary }}>
                          {r.label}
                          {isContact && (
                            <span
                              className="ml-2 inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: STATUS_COLOR[(CONTACTS.find((c) => `contact-${c.id}` === r.id)?.status) ?? 'offline'],
                              }}
                            />
                          )}
                        </div>
                        <div className="text-[11px] truncate" style={{ color: colors.textSecondary }}>
                          {r.description}
                        </div>
                      </div>

                      {/* Right-side hint (keyboard shortcut or badge) */}
                      {r.hint ? (
                        <kbd
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-mono"
                          style={{
                            backgroundColor: colors.bg,
                            color: colors.textSecondary,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          {r.hint}
                        </kbd>
                      ) : isShortcut ? null : (
                        <span
                          className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${colors.accent}15`,
                            color: colors.accent,
                          }}
                        >
                          {CATEGORY_LABELS[r.category]}
                        </span>
                      )}

                      {/* Selection indicator */}
                      {isSelected && (
                        <span className="text-[11px] shrink-0" style={{ color: colors.textSecondary }}>
                          {'\u23ce'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-5 py-2 text-[10px]"
          style={{ borderTop: `1px solid ${colors.border}`, color: colors.textSecondary }}
        >
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded px-1 py-0.5 font-mono" style={{ backgroundColor: `${colors.bg}`, border: `1px solid ${colors.border}` }}>{'\u2191\u2193'}</kbd>
              {' '}naviguer
            </span>
            <span>
              <kbd className="rounded px-1 py-0.5 font-mono" style={{ backgroundColor: `${colors.bg}`, border: `1px solid ${colors.border}` }}>{'\u23ce'}</kbd>
              {' '}ouvrir
            </span>
            <span>
              <kbd className="rounded px-1 py-0.5 font-mono" style={{ backgroundColor: `${colors.bg}`, border: `1px solid ${colors.border}` }}>esc</kbd>
              {' '}fermer
            </span>
          </div>
          <span style={{ color: colors.accent }}>
            {flatResults.length} resultat{flatResults.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
