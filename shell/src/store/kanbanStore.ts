import { create } from 'zustand';

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  color: string;
  createdAt: number;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
}

export interface KanbanBoard {
  id: string;
  name: string;
  columns: KanbanColumn[];
}

const STORAGE_KEY = 'scalenix-kanban';

function uid(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function defaultBoards(): KanbanBoard[] {
  return [
    {
      id: 'default',
      name: 'Mon tableau',
      columns: [
        {
          id: uid(),
          title: 'A faire',
          cards: [
            { id: uid(), title: 'Deployer le reverse proxy Traefik', description: 'Configurer Traefik v3 avec TLS et les middlewares de securite pour le cluster de production', color: '#4361ee', createdAt: Date.now() },
            { id: uid(), title: 'Migrer la base PostgreSQL vers la v16', description: 'Planifier la migration avec zero downtime et valider la compatibilite des extensions', color: '#8b5cf6', createdAt: Date.now() },
            { id: uid(), title: 'Implementer le widget meteo', description: 'Ajouter un widget meteo sur le bureau avec geolocalisation et previsions a 5 jours', color: '#0ea5e9', createdAt: Date.now() },
            { id: uid(), title: 'Documenter l\'API REST interne', description: 'Generer la documentation OpenAPI 3.0 pour tous les endpoints du backend ScalenixOS', color: '#22c55e', createdAt: Date.now() },
            { id: uid(), title: 'Creer les templates d\'email Zimbra', description: 'Concevoir les templates HTML responsives pour les notifications systeme et les invitations', color: '#f97316', createdAt: Date.now() },
            { id: uid(), title: 'Mettre en place le monitoring Grafana', description: 'Deployer Grafana + Prometheus avec dashboards pour CPU, RAM, disque et reseau', color: '#ec4899', createdAt: Date.now() },
            { id: uid(), title: 'Configurer les backups automatiques', description: 'Mettre en place des sauvegardes incrementales quotidiennes sur S3 avec retention 30 jours', color: '#14b8a6', createdAt: Date.now() },
            { id: uid(), title: 'Ajouter le support multi-langue', description: 'Integrer i18next avec detection automatique de la langue du navigateur (FR, EN, AR)', color: '#6366f1', createdAt: Date.now() },
          ],
        },
        {
          id: uid(),
          title: 'En cours',
          cards: [
            { id: uid(), title: 'Configurer l\'authentification SSO Keycloak', description: 'Finaliser le flux OIDC PKCE avec refresh token silencieux et gestion des roles', color: '#4361ee', createdAt: Date.now() },
            { id: uid(), title: 'Corriger la fuite memoire du service WebDAV', description: 'Le proxy WebDAV consomme 2 Go apres 48h — analyser les connexions non fermees', color: '#ef4444', createdAt: Date.now() },
            { id: uid(), title: 'Optimiser le temps de demarrage du shell', description: 'Reduire le bundle JS de 1.8 Mo a 800 Ko avec code splitting et lazy loading', color: '#f97316', createdAt: Date.now() },
            { id: uid(), title: 'Integrer le gestionnaire de fichiers Nextcloud', description: 'Connecter le File Explorer au backend Nextcloud via WebDAV avec Bearer token', color: '#0ea5e9', createdAt: Date.now() },
            { id: uid(), title: 'Developper le systeme de notifications', description: 'Implementer les notifications push via WebSocket avec file d\'attente persistante', color: '#8b5cf6', createdAt: Date.now() },
          ],
        },
        {
          id: uid(),
          title: 'En revue',
          cards: [
            { id: uid(), title: 'Auditer les logs de securite', description: 'Revue du rapport d\'audit : tentatives de connexion, acces non autorises, anomalies reseau', color: '#ef4444', createdAt: Date.now() },
            { id: uid(), title: 'Tester la compatibilite mobile', description: 'Validation du responsive design sur iOS Safari, Android Chrome et tablettes', color: '#eab308', createdAt: Date.now() },
            { id: uid(), title: 'Valider la politique RGPD', description: 'Verification de la conformite des traitements de donnees personnelles et du consentement', color: '#ec4899', createdAt: Date.now() },
          ],
        },
        {
          id: uid(),
          title: 'Termine',
          cards: [
            { id: uid(), title: 'Deployer le certificat wildcard *.scalenix.fr', description: 'Certificat TLS genere via la CA interne et deploye sur Traefik et tous les services', color: '#22c55e', createdAt: Date.now() },
            { id: uid(), title: 'Conteneuriser le terminal Xpra', description: 'Image Docker Ubuntu + Xpra fonctionnelle avec acces HTML5 et persistance de session', color: '#14b8a6', createdAt: Date.now() },
            { id: uid(), title: 'Configurer oauth2-proxy pour Nextcloud', description: 'Authentification transparente via Keycloak avec audience mapper et extra_hosts', color: '#6366f1', createdAt: Date.now() },
            { id: uid(), title: 'Mettre en place le CI/CD GitLab', description: 'Pipeline multi-stage : lint, tests, build Docker, deploy staging automatique', color: '#4361ee', createdAt: Date.now() },
          ],
        },
      ],
    },
    {
      id: 'sprint-mars',
      name: 'Sprint Mars 2026',
      columns: [
        {
          id: uid(),
          title: 'Backlog',
          cards: [
            { id: uid(), title: 'Refactorer le state management Zustand', description: 'Reorganiser les stores pour separer les concerns : auth, UI, apps, fichiers', color: '#8b5cf6', createdAt: Date.now() },
            { id: uid(), title: 'Ajouter le drag & drop entre fenetres', description: 'Permettre le deplacement de fichiers entre le bureau et le gestionnaire de fichiers', color: '#0ea5e9', createdAt: Date.now() },
            { id: uid(), title: 'Implementer le mode hors-ligne', description: 'Cache local avec Service Worker pour les fichiers recents et les preferences utilisateur', color: '#f97316', createdAt: Date.now() },
            { id: uid(), title: 'Creer le panneau de configuration systeme', description: 'Interface de gestion : theme, fond d\'ecran, langue, notifications, raccourcis clavier', color: '#ec4899', createdAt: Date.now() },
            { id: uid(), title: 'Integrer OnlyOffice pour l\'edition collaborative', description: 'Connecter OnlyOffice Document Server avec co-edition en temps reel via WOPI', color: '#22c55e', createdAt: Date.now() },
            { id: uid(), title: 'Optimiser les requetes WebDAV', description: 'Mettre en cache les listings de repertoires et implementer la pagination cote client', color: '#14b8a6', createdAt: Date.now() },
          ],
        },
        {
          id: uid(),
          title: 'En cours',
          cards: [
            { id: uid(), title: 'Redesigner la barre des taches', description: 'Nouvelle barre des taches avec groupement de fenetres, apercu au survol et zone de notification', color: '#4361ee', createdAt: Date.now() },
            { id: uid(), title: 'Ecrire les tests e2e Playwright', description: 'Couvrir les scenarios critiques : login, ouverture d\'apps, gestion de fichiers, deconnexion', color: '#eab308', createdAt: Date.now() },
            { id: uid(), title: 'Ameliorer les performances du rendu CSS', description: 'Migrer les animations vers GPU avec will-change et reduire les reflows', color: '#ef4444', createdAt: Date.now() },
            { id: uid(), title: 'Configurer le load balancing Traefik', description: 'Repartition de charge round-robin avec health checks sur les services backend', color: '#6366f1', createdAt: Date.now() },
          ],
        },
        {
          id: uid(),
          title: 'Done',
          cards: [
            { id: uid(), title: 'Corriger le rafraichissement du token OIDC', description: 'Le silent refresh echouait apres expiration — corrige avec un fallback redirect', color: '#22c55e', createdAt: Date.now() },
            { id: uid(), title: 'Ajouter le menu contextuel clic droit', description: 'Menu contextuel dynamique sur le bureau et dans le gestionnaire de fichiers', color: '#14b8a6', createdAt: Date.now() },
            { id: uid(), title: 'Deployer Keycloak 24 en production', description: 'Migration depuis KC 22 avec export/import du realm scalenix-os et reconfiguration proxy', color: '#4361ee', createdAt: Date.now() },
          ],
        },
      ],
    },
  ];
}

interface KanbanStore {
  boards: KanbanBoard[];
  activeBoardId: string;
  load: () => void;
  addBoard: (name: string) => void;
  removeBoard: (boardId: string) => void;
  renameBoard: (boardId: string, name: string) => void;
  setActiveBoard: (boardId: string) => void;
  addColumn: (boardId: string, title: string) => void;
  removeColumn: (boardId: string, columnId: string) => void;
  renameColumn: (boardId: string, columnId: string, title: string) => void;
  addCard: (boardId: string, columnId: string, card: Omit<KanbanCard, 'id' | 'createdAt'>) => void;
  removeCard: (boardId: string, columnId: string, cardId: string) => void;
  updateCard: (boardId: string, columnId: string, cardId: string, updates: Partial<Omit<KanbanCard, 'id' | 'createdAt'>>) => void;
  moveCard: (cardId: string, fromColId: string, toColId: string, toIndex: number) => void;
}

function persist(boards: KanbanBoard[], activeBoardId: string) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ boards, activeBoardId }));
  } catch { /* storage full */ }
}

function mapBoard(boards: KanbanBoard[], boardId: string, fn: (b: KanbanBoard) => KanbanBoard): KanbanBoard[] {
  return boards.map((b) => (b.id === boardId ? fn(b) : b));
}

function mapColumn(columns: KanbanColumn[], columnId: string, fn: (c: KanbanColumn) => KanbanColumn): KanbanColumn[] {
  return columns.map((c) => (c.id === columnId ? fn(c) : c));
}

export const useKanbanStore = create<KanbanStore>((set, get) => ({
  boards: defaultBoards(),
  activeBoardId: 'default',

  load: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.boards?.length) {
          set({ boards: data.boards, activeBoardId: data.activeBoardId || data.boards[0].id });
          return;
        }
      }
    } catch { /* corrupt */ }
    const boards = defaultBoards();
    set({ boards, activeBoardId: 'default' });
    persist(boards, 'default');
  },

  addBoard: (name) => {
    const id = uid();
    const newBoard: KanbanBoard = {
      id,
      name,
      columns: [
        { id: uid(), title: 'A faire', cards: [] },
        { id: uid(), title: 'En cours', cards: [] },
        { id: uid(), title: 'Termine', cards: [] },
      ],
    };
    const boards = [...get().boards, newBoard];
    set({ boards, activeBoardId: id });
    persist(boards, id);
  },

  removeBoard: (boardId) => {
    const { boards, activeBoardId } = get();
    if (boards.length <= 1) return;
    const updated = boards.filter((b) => b.id !== boardId);
    const newActive = activeBoardId === boardId ? updated[0].id : activeBoardId;
    set({ boards: updated, activeBoardId: newActive });
    persist(updated, newActive);
  },

  renameBoard: (boardId, name) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({ ...b, name }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  setActiveBoard: (boardId) => {
    set({ activeBoardId: boardId });
    persist(get().boards, boardId);
  },

  addColumn: (boardId, title) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: [...b.columns, { id: uid(), title, cards: [] }],
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  removeColumn: (boardId, columnId) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: b.columns.filter((c) => c.id !== columnId),
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  renameColumn: (boardId, columnId, title) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: mapColumn(b.columns, columnId, (c) => ({ ...c, title })),
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  addCard: (boardId, columnId, card) => {
    const newCard: KanbanCard = { ...card, id: uid(), createdAt: Date.now() };
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: mapColumn(b.columns, columnId, (c) => ({ ...c, cards: [...c.cards, newCard] })),
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  removeCard: (boardId, columnId, cardId) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: mapColumn(b.columns, columnId, (c) => ({
        ...c,
        cards: c.cards.filter((card) => card.id !== cardId),
      })),
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  updateCard: (boardId, columnId, cardId, updates) => {
    const boards = mapBoard(get().boards, boardId, (b) => ({
      ...b,
      columns: mapColumn(b.columns, columnId, (c) => ({
        ...c,
        cards: c.cards.map((card) => (card.id === cardId ? { ...card, ...updates } : card)),
      })),
    }));
    set({ boards });
    persist(boards, get().activeBoardId);
  },

  moveCard: (cardId, fromColId, toColId, toIndex) => {
    const { boards, activeBoardId } = get();
    const board = boards.find((b) => b.id === activeBoardId);
    if (!board) return;

    const fromCol = board.columns.find((c) => c.id === fromColId);
    if (!fromCol) return;

    const cardIndex = fromCol.cards.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return;

    const card = fromCol.cards[cardIndex];

    const updatedBoards = mapBoard(boards, activeBoardId, (b) => {
      let columns = b.columns;
      // Remove from source
      columns = mapColumn(columns, fromColId, (c) => ({
        ...c,
        cards: c.cards.filter((cc) => cc.id !== cardId),
      }));
      // Add to target
      columns = mapColumn(columns, toColId, (c) => {
        const newCards = [...c.cards];
        newCards.splice(toIndex, 0, card);
        return { ...c, cards: newCards };
      });
      return { ...b, columns };
    });

    set({ boards: updatedBoards });
    persist(updatedBoards, activeBoardId);
  },
}));
