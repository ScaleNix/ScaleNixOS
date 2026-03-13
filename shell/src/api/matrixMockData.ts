/**
 * Mock data for Matrix chat widget.
 * Used as fallback when Synapse API is unavailable or rate-limited.
 * Provides realistic French enterprise chat data.
 */

export interface MockRoom {
  id: string;
  name: string;
  lastMessage: string;
  lastSender: string;
  lastTs: number;
  unread: number;
  members: number;
  avatar: string;
}

export interface MockMessage {
  id: string;
  sender: string;
  senderName: string;
  body: string;
  timestamp: number;
}

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 3600_000;

export const MOCK_ROOMS: MockRoom[] = [
  {
    id: '!general:scalenix.fr',
    name: '#general',
    lastMessage: 'La nouvelle version du bureau est vraiment top, bravo a tous !',
    lastSender: 'claire',
    lastTs: NOW - 3 * MIN,
    unread: 4,
    members: 28,
    avatar: '#',
  },
  {
    id: '!dev:scalenix.fr',
    name: '#dev',
    lastMessage: 'J\'ai merge la PR pour le fix CORS, quelqu\'un peut review ?',
    lastSender: 'alice',
    lastTs: NOW - 8 * MIN,
    unread: 7,
    members: 14,
    avatar: '#',
  },
  {
    id: '!infrastructure:scalenix.fr',
    name: '#infrastructure',
    lastMessage: 'Migration PostgreSQL 16 planifiee pour dimanche 22h. Downtime estime : 15min.',
    lastSender: 'david',
    lastTs: NOW - 22 * MIN,
    unread: 2,
    members: 8,
    avatar: '#',
  },
  {
    id: '!design:scalenix.fr',
    name: '#design',
    lastMessage: 'Les maquettes Figma du nouveau dashboard sont partagees dans le channel.',
    lastSender: 'claire',
    lastTs: NOW - 45 * MIN,
    unread: 0,
    members: 6,
    avatar: '#',
  },
  {
    id: '!support:scalenix.fr',
    name: '#support',
    lastMessage: 'Ticket #847 resolu — le client a confirme que ca fonctionne maintenant.',
    lastSender: 'bob',
    lastTs: NOW - 1.5 * HOUR,
    unread: 1,
    members: 10,
    avatar: '#',
  },
  {
    id: '!securite:scalenix.fr',
    name: '#securite',
    lastMessage: 'Scan Trivy termine : 0 CVE critiques sur les images de prod.',
    lastSender: 'david',
    lastTs: NOW - 2 * HOUR,
    unread: 0,
    members: 5,
    avatar: '#',
  },
  {
    id: '!dm-alice:scalenix.fr',
    name: 'Alice Dupont',
    lastMessage: 'Tu as 5 min pour un point rapide sur l\'API Gateway ?',
    lastSender: 'alice',
    lastTs: NOW - 12 * MIN,
    unread: 1,
    members: 2,
    avatar: 'A',
  },
  {
    id: '!dm-bob:scalenix.fr',
    name: 'Bob Martin',
    lastMessage: 'C\'est bon, le VPN est repare. C\'etait bien le certificat expire.',
    lastSender: 'bob',
    lastTs: NOW - 35 * MIN,
    unread: 0,
    members: 2,
    avatar: 'B',
  },
  {
    id: '!dm-david:scalenix.fr',
    name: 'David Moreau',
    lastMessage: 'Le cluster K8s de staging est pret, tu veux qu\'on fasse la demo demain ?',
    lastSender: 'david',
    lastTs: NOW - 1 * HOUR,
    unread: 2,
    members: 2,
    avatar: 'D',
  },
  {
    id: '!projet-scalenixos:scalenix.fr',
    name: '#projet-scalenixos',
    lastMessage: 'Sprint 42 termine avec 23/25 stories. Retro demain a 16h.',
    lastSender: 'malik',
    lastTs: NOW - 3 * HOUR,
    unread: 0,
    members: 12,
    avatar: '#',
  },
  {
    id: '!dm-claire:scalenix.fr',
    name: 'Claire Leroy',
    lastMessage: 'J\'ai mis a jour les guidelines d\'accessibilite, tu peux valider ?',
    lastSender: 'claire',
    lastTs: NOW - 4 * HOUR,
    unread: 0,
    members: 2,
    avatar: 'C',
  },
];

export const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  '!general:scalenix.fr': [
    { id: 'g1', sender: '@malik:scalenix.fr', senderName: 'Malik', body: 'Bonjour a tous ! Petite annonce : la v2 de ScalenixOS sera presentee au client Ministere jeudi.', timestamp: NOW - 4 * HOUR },
    { id: 'g2', sender: '@alice:scalenix.fr', senderName: 'Alice', body: 'Super ! Il reste des points a finaliser sur l\'auth ?', timestamp: NOW - 3.5 * HOUR },
    { id: 'g3', sender: '@david:scalenix.fr', senderName: 'David', body: 'Cote infra c\'est pret, les certificats sont renouveles.', timestamp: NOW - 3 * HOUR },
    { id: 'g4', sender: '@bob:scalenix.fr', senderName: 'Bob', body: 'Le monitoring Grafana est operationnel aussi.', timestamp: NOW - 2 * HOUR },
    { id: 'g5', sender: '@sophie:scalenix.fr', senderName: 'Sophie', body: 'J\'ai prepare les visuels pour la presentation, ils sont dans le drive.', timestamp: NOW - 1 * HOUR },
    { id: 'g6', sender: '@thomas:scalenix.fr', senderName: 'Thomas', body: 'Quelqu\'un peut me donner acces au repo de la doc utilisateur ?', timestamp: NOW - 30 * MIN },
    { id: 'g7', sender: '@claire:scalenix.fr', senderName: 'Claire', body: 'La nouvelle version du bureau est vraiment top, bravo a tous !', timestamp: NOW - 3 * MIN },
  ],
  '!dev:scalenix.fr': [
    { id: 'd1', sender: '@alice:scalenix.fr', senderName: 'Alice', body: 'J\'ai pousse le refacto du WebDAV client, ca simplifie pas mal l\'error handling.', timestamp: NOW - 2 * HOUR },
    { id: 'd2', sender: '@malik:scalenix.fr', senderName: 'Malik', body: 'Nickel, je review ca cet aprem.', timestamp: NOW - 1.5 * HOUR },
    { id: 'd3', sender: '@lucas:scalenix.fr', senderName: 'Lucas', body: 'Attention, le build CI est casse sur la branche feature/widgets, je regarde.', timestamp: NOW - 1 * HOUR },
    { id: 'd4', sender: '@emma:scalenix.fr', senderName: 'Emma', body: 'C\'est corrige, il manquait un import dans WidgetLayer.tsx', timestamp: NOW - 45 * MIN },
    { id: 'd5', sender: '@alice:scalenix.fr', senderName: 'Alice', body: 'J\'ai merge la PR pour le fix CORS, quelqu\'un peut review ?', timestamp: NOW - 8 * MIN },
  ],
  '!infrastructure:scalenix.fr': [
    { id: 'i1', sender: '@david:scalenix.fr', senderName: 'David', body: 'Les metriques du cluster K8s sont bonnes : CPU 34%, RAM 58% en moyenne.', timestamp: NOW - 3 * HOUR },
    { id: 'i2', sender: '@bob:scalenix.fr', senderName: 'Bob', body: 'J\'ai configure les alertes PagerDuty pour les pods critiques.', timestamp: NOW - 2 * HOUR },
    { id: 'i3', sender: '@david:scalenix.fr', senderName: 'David', body: 'Migration PostgreSQL 16 planifiee pour dimanche 22h. Downtime estime : 15min.', timestamp: NOW - 22 * MIN },
  ],
};

export function getMockRooms(): MockRoom[] {
  return MOCK_ROOMS;
}

export function getMockMessages(roomId: string): MockMessage[] {
  return MOCK_MESSAGES[roomId] || [];
}

export function getMockTotalUnread(): number {
  return MOCK_ROOMS.reduce((sum, r) => sum + r.unread, 0);
}
