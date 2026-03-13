import { useState, useMemo } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useRssStore, type RssFeed, type RssArticle } from '../store/rssStore';

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/* ── Add Feed Dialog ─────────────────────────────────────── */

function AddFeedDialog({ onClose, onAdd }: {
  onClose: () => void;
  onAdd: (title: string, url: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && url.trim()) {
      onAdd(title.trim(), url.trim());
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-96 rounded-xl p-5 shadow-2xl flex flex-col gap-4"
        style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <h3 className="text-base font-semibold" style={{ color: colors.textPrimary }}>
          Ajouter un flux RSS
        </h3>

        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: colors.textSecondary }}>Nom du flux</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mon flux"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: colors.surfaceAlt,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
            autoFocus
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs" style={{ color: colors.textSecondary }}>URL du flux</span>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/rss"
            className="rounded-lg px-3 py-2 text-sm outline-none"
            style={{
              backgroundColor: colors.surfaceAlt,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
          />
        </label>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-4 py-1.5 text-sm transition-colors hover:brightness-110"
            style={{ backgroundColor: colors.surfaceAlt, color: colors.textSecondary }}
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!title.trim() || !url.trim()}
            className="rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors hover:brightness-110 disabled:opacity-40"
            style={{ backgroundColor: colors.accent }}
          >
            Ajouter
          </button>
        </div>
      </form>
    </div>
  );
}

/* ── Sidebar ─────────────────────────────────────────────── */

function Sidebar({ feeds, activeFeedId, unreadCounts, onSelect, onAddClick, onRemove }: {
  feeds: RssFeed[];
  activeFeedId: string | null;
  unreadCounts: Record<string, number>;
  onSelect: (id: string | null) => void;
  onAddClick: () => void;
  onRemove: (id: string) => void;
}) {
  const colors = useThemeStore((s) => s.colors);
  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  return (
    <div
      className="flex h-full w-56 shrink-0 flex-col"
      style={{ backgroundColor: colors.surfaceAlt, borderRight: `1px solid ${colors.border}` }}
    >
      <div className="p-3 pb-1">
        <h2 className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>Flux RSS</h2>
      </div>

      <div className="flex-1 overflow-auto px-2">
        {/* All articles */}
        <button
          onClick={() => onSelect(null)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
          style={{
            backgroundColor: activeFeedId === null ? `${colors.accent}22` : 'transparent',
            color: activeFeedId === null ? colors.accent : colors.textPrimary,
          }}
        >
          <span className="text-base">*</span>
          <span className="flex-1 truncate">Tous les articles</span>
          {totalUnread > 0 && (
            <span
              className="min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
              style={{ backgroundColor: colors.accent }}
            >
              {totalUnread}
            </span>
          )}
        </button>

        {/* Individual feeds */}
        {feeds.map((feed) => (
          <div key={feed.id} className="group relative">
            <button
              onClick={() => onSelect(feed.id)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors"
              style={{
                backgroundColor: activeFeedId === feed.id ? `${colors.accent}22` : 'transparent',
                color: activeFeedId === feed.id ? colors.accent : colors.textPrimary,
              }}
            >
              <span
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white"
                style={{ backgroundColor: colors.accent }}
              >
                {feed.icon || feed.title.charAt(0)}
              </span>
              <span className="flex-1 truncate">{feed.title}</span>
              {(unreadCounts[feed.id] ?? 0) > 0 && (
                <span
                  className="min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-bold text-white"
                  style={{ backgroundColor: colors.accent }}
                >
                  {unreadCounts[feed.id]}
                </span>
              )}
            </button>
            {/* Remove button on hover */}
            <button
              onClick={(e) => { e.stopPropagation(); onRemove(feed.id); }}
              className="absolute right-1 top-1/2 -translate-y-1/2 hidden rounded p-0.5 text-xs opacity-60 hover:opacity-100 group-hover:block"
              style={{ color: colors.textSecondary }}
              title="Supprimer ce flux"
            >
              x
            </button>
          </div>
        ))}
      </div>

      <div className="p-2">
        <button
          onClick={onAddClick}
          className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-medium transition-colors hover:brightness-110"
          style={{ backgroundColor: `${colors.accent}18`, color: colors.accent }}
        >
          + Ajouter flux
        </button>
      </div>
    </div>
  );
}

/* ── Article List ────────────────────────────────────────── */

function ArticleList({ articles, feeds, selectedId, onSelect, onMarkAllRead, activeFeedId }: {
  articles: RssArticle[];
  feeds: RssFeed[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMarkAllRead: () => void;
  activeFeedId: string | null;
}) {
  const colors = useThemeStore((s) => s.colors);
  const feedMap = useMemo(() => {
    const m: Record<string, RssFeed> = {};
    feeds.forEach((f) => { m[f.id] = f; });
    return m;
  }, [feeds]);

  const title = activeFeedId === null
    ? 'Tous les articles'
    : feedMap[activeFeedId]?.title ?? 'Articles';

  if (articles.length === 0) {
    return (
      <div
        className="flex h-full w-72 shrink-0 flex-col items-center justify-center"
        style={{ borderRight: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
      >
        <span className="text-2xl mb-2">O</span>
        <span className="text-sm" style={{ color: colors.textSecondary }}>Aucun article</span>
      </div>
    );
  }

  return (
    <div
      className="flex h-full w-72 shrink-0 flex-col"
      style={{ borderRight: `1px solid ${colors.border}`, backgroundColor: colors.surface }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <span className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{title}</span>
        <button
          onClick={onMarkAllRead}
          className="shrink-0 rounded px-2 py-0.5 text-[11px] transition-colors hover:brightness-110"
          style={{ color: colors.accent, backgroundColor: `${colors.accent}15` }}
          title="Tout marquer comme lu"
        >
          Tout marquer comme lu
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto">
        {articles.map((article) => {
          const isSelected = article.id === selectedId;
          return (
            <button
              key={article.id}
              onClick={() => onSelect(article.id)}
              className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left transition-colors"
              style={{
                backgroundColor: isSelected ? `${colors.accent}18` : 'transparent',
                borderBottom: `1px solid ${colors.border}`,
              }}
            >
              <span
                className={`text-sm leading-tight truncate ${!article.read ? 'font-semibold' : 'font-normal'}`}
                style={{ color: !article.read ? colors.textPrimary : colors.textSecondary }}
              >
                {!article.read && (
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle"
                    style={{ backgroundColor: colors.accent }}
                  />
                )}
                {article.title}
              </span>
              <div className="flex items-center gap-2 text-[11px]" style={{ color: colors.textSecondary }}>
                <span className="truncate">{feedMap[article.feedId]?.title}</span>
                <span>-</span>
                <span className="shrink-0">{formatDate(article.date)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Article Preview ─────────────────────────────────────── */

function ArticlePreview({ article, feedTitle }: {
  article: RssArticle | null;
  feedTitle: string;
}) {
  const colors = useThemeStore((s) => s.colors);

  if (!article) {
    return (
      <div
        className="flex flex-1 flex-col items-center justify-center"
        style={{ backgroundColor: colors.bg }}
      >
        <span className="text-4xl mb-3 opacity-30">RSS</span>
        <span className="text-sm" style={{ color: colors.textSecondary }}>
          Selectionnez un article pour le lire
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto" style={{ backgroundColor: colors.bg }}>
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <h1 className="text-lg font-bold leading-snug mb-2" style={{ color: colors.textPrimary }}>
          {article.title}
        </h1>
        <div className="flex items-center gap-3 text-xs" style={{ color: colors.textSecondary }}>
          <span className="font-medium" style={{ color: colors.accent }}>{feedTitle}</span>
          <span>{formatDate(article.date)}</span>
          {article.link && (
            <a
              href={article.link}
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:brightness-110"
              style={{ color: colors.accent }}
            >
              Ouvrir dans le navigateur
            </a>
          )}
        </div>
      </div>

      <div
        className="flex-1 px-6 py-4 text-sm leading-relaxed"
        style={{ color: colors.textPrimary }}
        dangerouslySetInnerHTML={{ __html: article.summary }}
      />
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────── */

export function RssReader() {
  const colors = useThemeStore((s) => s.colors);
  const {
    feeds, articles, activeFeedId,
    addFeed, removeFeed, markRead, markAllRead, setActiveFeed,
  } = useRssStore();
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Filtered and sorted articles
  const visibleArticles = useMemo(() => {
    const filtered = activeFeedId === null
      ? articles
      : articles.filter((a) => a.feedId === activeFeedId);
    return [...filtered].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [articles, activeFeedId]);

  // Unread counts per feed
  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    articles.forEach((a) => {
      if (!a.read) counts[a.feedId] = (counts[a.feedId] ?? 0) + 1;
    });
    return counts;
  }, [articles]);

  const selectedArticle = visibleArticles.find((a) => a.id === selectedArticleId) ?? null;
  const feedMap = useMemo(() => {
    const m: Record<string, RssFeed> = {};
    feeds.forEach((f) => { m[f.id] = f; });
    return m;
  }, [feeds]);

  const handleSelectArticle = (id: string) => {
    setSelectedArticleId(id);
    markRead(id);
  };

  const handleMarkAllRead = () => {
    markAllRead(activeFeedId);
  };

  const handleAddFeed = (title: string, url: string) => {
    const id = 'feed-' + Date.now();
    addFeed({ id, title, url, icon: title.charAt(0).toUpperCase() });
  };

  return (
    <div className="flex h-full" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      <Sidebar
        feeds={feeds}
        activeFeedId={activeFeedId}
        unreadCounts={unreadCounts}
        onSelect={setActiveFeed}
        onAddClick={() => setShowAddDialog(true)}
        onRemove={removeFeed}
      />

      <ArticleList
        articles={visibleArticles}
        feeds={feeds}
        selectedId={selectedArticleId}
        onSelect={handleSelectArticle}
        onMarkAllRead={handleMarkAllRead}
        activeFeedId={activeFeedId}
      />

      <ArticlePreview
        article={selectedArticle}
        feedTitle={selectedArticle ? (feedMap[selectedArticle.feedId]?.title ?? '') : ''}
      />

      {showAddDialog && (
        <AddFeedDialog
          onClose={() => setShowAddDialog(false)}
          onAdd={handleAddFeed}
        />
      )}
    </div>
  );
}
