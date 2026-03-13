import { create } from 'zustand';

export interface RssFeed {
  id: string;
  title: string;
  url: string;
  icon?: string;
}

export interface RssArticle {
  id: string;
  feedId: string;
  title: string;
  link: string;
  summary: string;
  date: string;
  read: boolean;
}

interface RssStore {
  feeds: RssFeed[];
  articles: RssArticle[];
  activeFeedId: string | null;
  loading: boolean;
  addFeed: (feed: RssFeed) => void;
  removeFeed: (feedId: string) => void;
  markRead: (articleId: string) => void;
  markAllRead: (feedId: string | null) => void;
  setActiveFeed: (feedId: string | null) => void;
  setArticles: (articles: RssArticle[]) => void;
}

const STORAGE_KEY = 'scalenix-rss-feeds';

const DEFAULT_FEEDS: RssFeed[] = [
  { id: 'scalenix-blog', title: 'Scalenix Blog', url: 'https://blog.scalenix.fr/rss', icon: 'S' },
  { id: 'tech-news', title: 'Tech News', url: 'https://technews.fr/rss', icon: 'T' },
  { id: 'linux-actu', title: 'Linux Actualites', url: 'https://linuxactu.fr/feed', icon: 'L' },
];

const DEFAULT_ARTICLES: RssArticle[] = [
  // Scalenix Blog
  {
    id: 'sb-1', feedId: 'scalenix-blog',
    title: 'Scalenix OS : notre vision du bureau cloud souverain',
    link: 'https://blog.scalenix.fr/vision-bureau-cloud',
    summary: '<p>Chez Scalenix, nous croyons que le poste de travail numerique doit etre <strong>souverain, securise et accessible</strong>. Notre bureau web repose entierement sur des logiciels libres : Keycloak pour l\'authentification, Nextcloud pour le stockage, et une interface React moderne. Decouvrez comment nous construisons un environnement de travail complet directement dans le navigateur, sans compromis sur la vie privee.</p>',
    date: '2026-03-10T09:00:00Z', read: false,
  },
  {
    id: 'sb-2', feedId: 'scalenix-blog',
    title: 'Integration OnlyOffice : edition collaborative dans le navigateur',
    link: 'https://blog.scalenix.fr/onlyoffice-integration',
    summary: '<p>L\'edition de documents, tableurs et presentations est desormais possible directement depuis Scalenix OS grace a l\'integration d\'<strong>OnlyOffice</strong>. Les fichiers sont stockes sur Nextcloud et ouverts en un clic. Le mode collaboratif temps reel permet a plusieurs utilisateurs de travailler simultanement sur le meme document.</p>',
    date: '2026-03-08T14:30:00Z', read: false,
  },
  {
    id: 'sb-3', feedId: 'scalenix-blog',
    title: 'Securite Zero Trust avec Keycloak et OAuth2 Proxy',
    link: 'https://blog.scalenix.fr/zero-trust-keycloak',
    summary: '<p>La securite est au coeur de Scalenix OS. Chaque application est protegee par un flux <strong>OIDC PKCE</strong> via Keycloak 24. Nous utilisons oauth2-proxy devant les services sensibles et des politiques RBAC granulaires. Cet article detaille notre architecture de securite et les bonnes pratiques mises en oeuvre.</p>',
    date: '2026-03-05T11:00:00Z', read: false,
  },
  {
    id: 'sb-4', feedId: 'scalenix-blog',
    title: 'Nouveau systeme de themes et personnalisation',
    link: 'https://blog.scalenix.fr/themes-personnalisation',
    summary: '<p>Scalenix OS propose desormais <strong>7 themes</strong> preconfigures (Midnight, Ocean, Aurora, Forest, Sunset, Light, Rose) avec la possibilite de personnaliser la couleur d\'accentuation et le fond d\'ecran. Le systeme de theming repose sur Zustand et des variables CSS appliquees dynamiquement.</p>',
    date: '2026-03-02T16:00:00Z', read: false,
  },
  {
    id: 'sb-5', feedId: 'scalenix-blog',
    title: 'Roadmap 2026 : IA, WebRTC et applications mobiles',
    link: 'https://blog.scalenix.fr/roadmap-2026',
    summary: '<p>Decouvrez les grandes lignes de notre feuille de route pour 2026 : integration d\'un <strong>assistant IA local</strong> base sur Mistral, visioconference WebRTC via LiveKit, et une version mobile progressive (PWA). Nous prevoyons egalement le support des espaces de travail partages et une marketplace d\'applications tierces.</p>',
    date: '2026-02-28T10:00:00Z', read: false,
  },

  // Tech News
  {
    id: 'tn-1', feedId: 'tech-news',
    title: 'L\'Union europeenne adopte le Cyber Resilience Act',
    link: 'https://technews.fr/cyber-resilience-act-2026',
    summary: '<p>Le <strong>Cyber Resilience Act</strong> entre en vigueur ce mois-ci, imposant de nouvelles obligations de securite pour tous les produits numeriques vendus dans l\'UE. Les editeurs de logiciels devront fournir des mises a jour de securite pendant au moins 5 ans et signaler les vulnerabilites dans les 24 heures. Les projets open source a but non lucratif beneficient d\'exemptions.</p>',
    date: '2026-03-11T08:00:00Z', read: false,
  },
  {
    id: 'tn-2', feedId: 'tech-news',
    title: 'Mistral AI lance Mistral Large 3 avec 405 milliards de parametres',
    link: 'https://technews.fr/mistral-large-3',
    summary: '<p>La licorne francaise Mistral AI devoile <strong>Mistral Large 3</strong>, son modele le plus puissant a ce jour. Avec 405 milliards de parametres et un contexte de 256k tokens, il rivalise avec GPT-5 sur les benchmarks majeurs. Le modele est disponible en API et sous licence Apache 2.0 pour la version 8B.</p>',
    date: '2026-03-09T12:00:00Z', read: false,
  },
  {
    id: 'tn-3', feedId: 'tech-news',
    title: 'Firefox 135 integre un traducteur hors-ligne base sur Bergamot',
    link: 'https://technews.fr/firefox-135-traducteur',
    summary: '<p>Mozilla livre <strong>Firefox 135</strong> avec un traducteur integre fonctionnant entierement hors ligne. Base sur le projet Bergamot, il supporte 15 langues dont le francais, l\'allemand et l\'espagnol. Les donnees ne quittent jamais l\'appareil, garantissant la confidentialite des contenus traduits.</p>',
    date: '2026-03-07T15:30:00Z', read: false,
  },
  {
    id: 'tn-4', feedId: 'tech-news',
    title: 'La CNIL inflige 120 millions d\'euros d\'amende a un geant du cloud americain',
    link: 'https://technews.fr/cnil-amende-cloud',
    summary: '<p>La CNIL a annonce une <strong>amende record de 120 millions d\'euros</strong> a l\'encontre d\'un hyperscaler americain pour transferts illegaux de donnees personnelles vers les Etats-Unis. La decision souligne l\'importance du RGPD et renforce l\'interet pour les solutions cloud souveraines europeennes.</p>',
    date: '2026-03-04T09:00:00Z', read: false,
  },
  {
    id: 'tn-5', feedId: 'tech-news',
    title: 'WebAssembly 3.0 : les threads et le GC arrivent dans tous les navigateurs',
    link: 'https://technews.fr/webassembly-3',
    summary: '<p>La specification <strong>WebAssembly 3.0</strong> est desormais supportee par Chrome, Firefox et Safari. Les nouvelles fonctionnalites incluent les threads partages, le ramasse-miettes (GC) integre et les references de types. Ces avancees permettent de porter des applications complexes comme Blender ou AutoCAD directement dans le navigateur.</p>',
    date: '2026-03-01T14:00:00Z', read: false,
  },

  // Linux Actualites
  {
    id: 'la-1', feedId: 'linux-actu',
    title: 'Linux 6.14 : nouveau pilote GPU Intel Battlemage et optimisations Rust',
    link: 'https://linuxactu.fr/linux-6-14',
    summary: '<p>Le noyau <strong>Linux 6.14</strong> apporte le support complet des GPU Intel Battlemage (Xe2), de nouvelles optimisations du planificateur EEVDF, et 15 000 lignes de code Rust supplementaires dans les sous-systemes reseau et systemes de fichiers. Le support initial de RISC-V pour les serveurs est egalement ameliore.</p>',
    date: '2026-03-11T10:00:00Z', read: false,
  },
  {
    id: 'la-2', feedId: 'linux-actu',
    title: 'Ubuntu 26.04 LTS "Noble Numbat" : la beta est disponible',
    link: 'https://linuxactu.fr/ubuntu-26-04-beta',
    summary: '<p>Canonical publie la beta d\'<strong>Ubuntu 26.04 LTS</strong> avec GNOME 48, le nouveau centre d\'applications Flutter, et un installateur repense. Le noyau 6.14 est inclus avec le support experimental de bcachefs. Le passage a Wayland par defaut est desormais complet, y compris pour les sessions Nvidia.</p>',
    date: '2026-03-09T07:30:00Z', read: false,
  },
  {
    id: 'la-3', feedId: 'linux-actu',
    title: 'NixOS 25.11 simplifie la gestion des conteneurs et des machines virtuelles',
    link: 'https://linuxactu.fr/nixos-25-11',
    summary: '<p><strong>NixOS 25.11</strong> introduit un nouveau module de gestion des conteneurs OCI et des VM microvm. La configuration declarative permet de definir des conteneurs Podman et des machines virtuelles directement dans les fichiers Nix, avec isolation reseau automatique et snapshots reproductibles.</p>',
    date: '2026-03-06T13:00:00Z', read: false,
  },
  {
    id: 'la-4', feedId: 'linux-actu',
    title: 'Fedora Workstation 42 adopte Wayland natif pour toutes les applications',
    link: 'https://linuxactu.fr/fedora-42-wayland',
    summary: '<p><strong>Fedora 42</strong> supprime definitivement le support X11 de son edition Workstation. Toutes les applications, y compris les jeux Steam et les logiciels Electron, fonctionnent desormais nativement sous Wayland grace a XWayland ameliore et aux nouvelles API de capture d\'ecran du portail freedesktop.</p>',
    date: '2026-03-03T11:30:00Z', read: false,
  },
  {
    id: 'la-5', feedId: 'linux-actu',
    title: 'Systemd 257 : supervision des services avec eBPF et journald ameliore',
    link: 'https://linuxactu.fr/systemd-257',
    summary: '<p><strong>Systemd 257</strong> integre une supervision avancee des services grace a <strong>eBPF</strong> : suivi de la consommation memoire par cgroup, detection automatique des fuites, et alertes temps reel. Le journal (journald) supporte desormais la compression zstd et l\'export natif au format OpenTelemetry.</p>',
    date: '2026-02-27T09:00:00Z', read: false,
  },
];

function loadFeedsFromStorage(): RssFeed[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* corrupt */ }
  return DEFAULT_FEEDS;
}

function persistFeeds(feeds: RssFeed[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(feeds));
  } catch { /* quota */ }
}

export const useRssStore = create<RssStore>((set, get) => ({
  feeds: loadFeedsFromStorage(),
  articles: [...DEFAULT_ARTICLES],
  activeFeedId: null,
  loading: false,

  addFeed: (feed) => {
    const feeds = [...get().feeds, feed];
    persistFeeds(feeds);
    set({ feeds });
  },

  removeFeed: (feedId) => {
    const feeds = get().feeds.filter((f) => f.id !== feedId);
    const articles = get().articles.filter((a) => a.feedId !== feedId);
    persistFeeds(feeds);
    set({
      feeds,
      articles,
      activeFeedId: get().activeFeedId === feedId ? null : get().activeFeedId,
    });
  },

  markRead: (articleId) => {
    set({
      articles: get().articles.map((a) =>
        a.id === articleId ? { ...a, read: true } : a,
      ),
    });
  },

  markAllRead: (feedId) => {
    set({
      articles: get().articles.map((a) =>
        feedId === null || a.feedId === feedId ? { ...a, read: true } : a,
      ),
    });
  },

  setActiveFeed: (feedId) => set({ activeFeedId: feedId }),

  setArticles: (articles) => set({ articles }),
}));
