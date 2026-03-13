import { useState, useRef, useCallback, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useNotifStore } from '../store/notifStore';

interface Tab {
  id: string;
  title: string;
  url: string;
  loading: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface Bookmark {
  title: string;
  url: string;
  icon: string;
}

const STORAGE_KEY = 'scalenix-browser';

const DEFAULT_BOOKMARKS: Bookmark[] = [
  { title: 'Google', url: 'https://www.google.com/search?igu=1', icon: 'G' },
  { title: 'Wikipedia', url: 'https://fr.wikipedia.org/', icon: 'W' },
  { title: 'GitHub', url: 'https://github.com/', icon: 'GH' },
  { title: 'MDN', url: 'https://developer.mozilla.org/fr/', icon: 'M' },
  { title: 'Stack Overflow', url: 'https://stackoverflow.com/', icon: 'SO' },
];

const HOME_URL = 'about:blank';
const SEARCH_ENGINE = 'https://www.google.com/search?igu=1&q=';

function loadBookmarks(): Bookmark[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (Array.isArray(data.bookmarks)) return data.bookmarks;
    }
  } catch { /* corrupt */ }
  return DEFAULT_BOOKMARKS;
}

function saveBookmarks(bookmarks: Bookmark[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarks }));
  } catch { /* quota */ }
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed || trimmed === 'about:blank') return HOME_URL;
  // If it looks like a URL
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed)) return `https://${trimmed}`;
  // Otherwise treat as search query
  return `${SEARCH_ENGINE}${encodeURIComponent(trimmed)}`;
}

function getFaviconLetter(url: string): string {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return host.charAt(0).toUpperCase();
  } catch {
    return '?';
  }
}

export function Browser() {
  const colors = useThemeStore((s) => s.colors);
  const push = useNotifStore((s) => s.push);
  const [tabs, setTabs] = useState<Tab[]>([
    { id: uid(), title: 'Nouvel onglet', url: HOME_URL, loading: false, canGoBack: false, canGoForward: false },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [addressInput, setAddressInput] = useState('');
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(loadBookmarks);
  const [showBookmarkBar, setShowBookmarkBar] = useState(true);
  const iframeRefs = useRef<Record<string, HTMLIFrameElement | null>>({});

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  // Sync address bar with active tab
  useEffect(() => {
    setAddressInput(activeTab.url === HOME_URL ? '' : activeTab.url);
  }, [activeTab.url, activeTab.id]);

  const updateTab = useCallback((tabId: string, patch: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === tabId ? { ...t, ...patch } : t)));
  }, []);

  const navigate = useCallback((url: string, tabId?: string) => {
    const tid = tabId || activeTabId;
    const resolved = normalizeUrl(url);
    updateTab(tid, { url: resolved, loading: true, title: 'Chargement...' });
    setAddressInput(resolved === HOME_URL ? '' : resolved);
  }, [activeTabId, updateTab]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(addressInput);
  };

  const handleIframeLoad = useCallback((tabId: string) => {
    const iframe = iframeRefs.current[tabId];
    let title = 'Page';
    try {
      title = iframe?.contentDocument?.title || 'Page';
    } catch {
      // Cross-origin — extract from URL
      const tab = tabs.find((t) => t.id === tabId);
      if (tab) {
        try {
          const host = new URL(tab.url).hostname;
          title = host;
        } catch {
          title = 'Page';
        }
      }
    }
    updateTab(tabId, { loading: false, title });
  }, [tabs, updateTab]);

  const addTab = () => {
    const id = uid();
    setTabs((prev) => [...prev, { id, title: 'Nouvel onglet', url: HOME_URL, loading: false, canGoBack: false, canGoForward: false }]);
    setActiveTabId(id);
    setAddressInput('');
  };

  const closeTab = (tabId: string) => {
    setTabs((prev) => {
      const next = prev.filter((t) => t.id !== tabId);
      if (next.length === 0) {
        const id = uid();
        setActiveTabId(id);
        return [{ id, title: 'Nouvel onglet', url: HOME_URL, loading: false, canGoBack: false, canGoForward: false }];
      }
      if (activeTabId === tabId) {
        const idx = prev.findIndex((t) => t.id === tabId);
        const newActive = next[Math.min(idx, next.length - 1)];
        setActiveTabId(newActive.id);
      }
      return next;
    });
  };

  const refresh = () => {
    const iframe = iframeRefs.current[activeTabId];
    if (iframe) {
      updateTab(activeTabId, { loading: true });
      iframe.src = activeTab.url;
    }
  };

  const goHome = () => {
    navigate(HOME_URL);
  };

  const addBookmark = () => {
    if (activeTab.url === HOME_URL) return;
    const exists = bookmarks.some((b) => b.url === activeTab.url);
    if (exists) {
      push({ type: 'info', title: 'Favori deja enregistre' });
      return;
    }
    const next = [...bookmarks, { title: activeTab.title, url: activeTab.url, icon: getFaviconLetter(activeTab.url) }];
    setBookmarks(next);
    saveBookmarks(next);
    push({ type: 'success', title: 'Favori ajoute', message: activeTab.title });
  };

  const removeBookmark = (url: string) => {
    const next = bookmarks.filter((b) => b.url !== url);
    setBookmarks(next);
    saveBookmarks(next);
  };

  // Open a URL in the browser (exposed for external use via window message)
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'SCALENIX_BROWSER_OPEN' && typeof e.data.url === 'string') {
        navigate(e.data.url);
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [navigate]);

  return (
    <div className="flex h-full w-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Tab bar */}
      <div
        className="flex items-center gap-0.5 px-1 pt-1 pb-0"
        style={{ backgroundColor: colors.surfaceAlt, borderBottom: `1px solid ${colors.border}` }}
      >
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`group flex max-w-[200px] min-w-[120px] items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs cursor-pointer transition-colors ${
              tab.id === activeTabId ? '' : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: tab.id === activeTabId ? colors.surface : 'transparent',
              borderLeft: tab.id === activeTabId ? `1px solid ${colors.border}` : '1px solid transparent',
              borderRight: tab.id === activeTabId ? `1px solid ${colors.border}` : '1px solid transparent',
              borderTop: tab.id === activeTabId ? `2px solid ${colors.accent}` : '2px solid transparent',
            }}
            onClick={() => setActiveTabId(tab.id)}
          >
            {/* Favicon */}
            <span
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded text-[9px] font-bold"
              style={{ backgroundColor: colors.accent + '22', color: colors.accent }}
            >
              {tab.loading ? (
                <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
              ) : (
                getFaviconLetter(tab.url)
              )}
            </span>
            <span className="flex-1 truncate">{tab.title}</span>
            <button
              className="ml-1 hidden h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] opacity-60 hover:opacity-100 hover:bg-white/10 group-hover:flex"
              onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
            >
              {'\u2715'}
            </button>
          </div>
        ))}
        <button
          className="flex h-6 w-6 items-center justify-center rounded text-sm opacity-60 hover:opacity-100 hover:bg-white/10"
          onClick={addTab}
          title="Nouvel onglet"
        >
          +
        </button>
      </div>

      {/* Navigation bar */}
      <div
        className="flex items-center gap-1.5 px-2 py-1.5"
        style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}` }}
      >
        {/* Nav buttons */}
        <div className="flex items-center gap-0.5">
          <NavButton icon={'\u25C0'} title="Retour" onClick={() => { iframeRefs.current[activeTabId]?.contentWindow?.history.back(); }} colors={colors} />
          <NavButton icon={'\u25B6'} title="Avancer" onClick={() => { iframeRefs.current[activeTabId]?.contentWindow?.history.forward(); }} colors={colors} />
          <NavButton
            icon={activeTab.loading ? '\u2715' : '\u27F3'}
            title={activeTab.loading ? 'Arreter' : 'Actualiser'}
            onClick={refresh}
            colors={colors}
          />
          <NavButton icon={'\u2302'} title="Accueil" onClick={goHome} colors={colors} />
        </div>

        {/* Address bar */}
        <form onSubmit={handleAddressSubmit} className="flex-1">
          <div
            className="flex items-center rounded-lg px-3 py-1.5 transition-colors"
            style={{ backgroundColor: colors.bg, border: `1px solid ${colors.border}` }}
          >
            <span className="mr-2 text-[10px] opacity-40">{activeTab.url.startsWith('https') ? '\uD83D\uDD12' : '\uD83C\uDF10'}</span>
            <input
              type="text"
              className="flex-1 bg-transparent text-xs outline-none placeholder:opacity-40"
              style={{ color: colors.textPrimary }}
              placeholder="Rechercher ou saisir une adresse..."
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              onFocus={(e) => e.target.select()}
            />
          </div>
        </form>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5">
          <NavButton
            icon={'\u2606'}
            title="Ajouter aux favoris"
            onClick={addBookmark}
            colors={colors}
            active={bookmarks.some((b) => b.url === activeTab.url)}
          />
          <NavButton
            icon={showBookmarkBar ? '\u25B4' : '\u25BE'}
            title={showBookmarkBar ? 'Masquer les favoris' : 'Afficher les favoris'}
            onClick={() => setShowBookmarkBar(!showBookmarkBar)}
            colors={colors}
          />
        </div>
      </div>

      {/* Bookmark bar */}
      {showBookmarkBar && (
        <div
          className="flex items-center gap-1 overflow-x-auto px-2 py-1"
          style={{ backgroundColor: colors.surface, borderBottom: `1px solid ${colors.border}`, scrollbarWidth: 'none' }}
        >
          {bookmarks.map((bk) => (
            <button
              key={bk.url}
              className="group flex shrink-0 items-center gap-1 rounded px-2 py-0.5 text-[11px] transition-colors hover:bg-white/10"
              onClick={() => navigate(bk.url)}
              onContextMenu={(e) => {
                e.preventDefault();
                removeBookmark(bk.url);
                push({ type: 'info', title: 'Favori supprime', message: bk.title });
              }}
              title={bk.url}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded text-[8px] font-bold"
                style={{ backgroundColor: colors.accent + '22', color: colors.accent }}
              >
                {bk.icon}
              </span>
              <span className="max-w-[100px] truncate">{bk.title}</span>
            </button>
          ))}
          {bookmarks.length === 0 && (
            <span className="text-[11px] opacity-40">Clic droit pour supprimer un favori</span>
          )}
        </div>
      )}

      {/* Content area */}
      <div className="relative flex-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? 'block' : 'none' }}
          >
            {tab.url === HOME_URL ? (
              <NewTabPage
                colors={colors}
                bookmarks={bookmarks}
                onNavigate={(url) => navigate(url, tab.id)}
              />
            ) : (
              <iframe
                ref={(el) => { iframeRefs.current[tab.id] = el; }}
                src={tab.url}
                className="h-full w-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
                allow="fullscreen; camera; microphone; display-capture"
                allowFullScreen
                onLoad={() => handleIframeLoad(tab.id)}
                title={tab.title}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function NavButton({ icon, title, onClick, colors, active }: {
  icon: string;
  title: string;
  onClick: () => void;
  colors: any;
  active?: boolean;
}) {
  return (
    <button
      className="flex h-7 w-7 items-center justify-center rounded-md text-xs transition-colors hover:bg-white/10"
      style={{ color: active ? colors.accent : colors.textSecondary }}
      title={title}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}

function NewTabPage({ colors, bookmarks, onNavigate }: {
  colors: any;
  bookmarks: Bookmark[];
  onNavigate: (url: string) => void;
}) {
  const [search, setSearch] = useState('');

  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center"
      style={{ backgroundColor: colors.bg }}
    >
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
          ScalenixOS
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textSecondary }}>
          Navigateur Web
        </p>
      </div>

      {/* Search bar */}
      <form
        className="w-full max-w-[520px] px-4"
        onSubmit={(e) => { e.preventDefault(); onNavigate(search); }}
      >
        <div
          className="flex items-center rounded-2xl px-5 py-3 shadow-lg transition-colors"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <span className="mr-3 text-lg opacity-40">{'\uD83D\uDD0D'}</span>
          <input
            type="text"
            className="flex-1 bg-transparent text-sm outline-none placeholder:opacity-40"
            style={{ color: colors.textPrimary }}
            placeholder="Rechercher sur Google ou saisir une URL..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
      </form>

      {/* Quick links */}
      {bookmarks.length > 0 && (
        <div className="mt-8 grid grid-cols-5 gap-4 px-4">
          {bookmarks.slice(0, 10).map((bk) => (
            <button
              key={bk.url}
              className="flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-white/5"
              onClick={() => onNavigate(bk.url)}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-sm font-bold"
                style={{ backgroundColor: colors.accent + '22', color: colors.accent }}
              >
                {bk.icon}
              </div>
              <span className="max-w-[80px] truncate text-[11px]" style={{ color: colors.textSecondary }}>
                {bk.title}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
