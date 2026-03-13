import { useEffect, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { useNotifStore, type NotifCategory } from '../store/notifStore';

interface SimulatedNotif {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  category: NotifCategory;
  appId: string;
}

const SIMULATED_NOTIFICATIONS: SimulatedNotif[] = [
  // Mail
  {
    type: 'info',
    title: 'Nouveau mail de Alice Dupont',
    message: 'Re: Reunion de projet demain a 10h',
    category: 'mail',
    appId: 'zimbra-mail',
  },
  {
    type: 'info',
    title: 'Nouveau mail de Bob Martin',
    message: 'Document de specification en piece jointe',
    category: 'mail',
    appId: 'zimbra-mail',
  },
  {
    type: 'info',
    title: 'Nouveau mail de Claire Leroy',
    message: 'Validation du budget Q2 requise',
    category: 'mail',
    appId: 'zimbra-mail',
  },
  // Chat
  {
    type: 'info',
    title: 'Message de David Moreau',
    message: 'Est-ce que tu as vu le dernier commit ?',
    category: 'chat',
    appId: 'element-chat',
  },
  {
    type: 'info',
    title: '#general - Alice Dupont',
    message: 'Le deploiement de vendredi est confirme',
    category: 'chat',
    appId: 'element-chat',
  },
  {
    type: 'info',
    title: 'Message de Claire Leroy',
    message: 'Merci pour le retour sur le design !',
    category: 'chat',
    appId: 'element-chat',
  },
  // File
  {
    type: 'info',
    title: 'Fichier partage avec vous',
    message: 'Bob Martin a partage "Rapport-Q1.pdf"',
    category: 'file',
    appId: 'file-explorer',
  },
  {
    type: 'info',
    title: 'Fichier modifie',
    message: 'Alice Dupont a modifie "Specs-v2.docx"',
    category: 'file',
    appId: 'file-explorer',
  },
  {
    type: 'success',
    title: 'Synchronisation terminee',
    message: '12 fichiers synchronises avec succes',
    category: 'file',
    appId: 'file-explorer',
  },
  // Calendar
  {
    type: 'warning',
    title: 'Rappel : Reunion dans 15 min',
    message: 'Stand-up equipe dev - Salle virtuelle A',
    category: 'calendar',
    appId: 'zimbra-calendar',
  },
  {
    type: 'info',
    title: 'Nouvel evenement',
    message: 'Claire Leroy vous a invite a "Review Design"',
    category: 'calendar',
    appId: 'zimbra-calendar',
  },
  {
    type: 'warning',
    title: 'Rappel : Deadline demain',
    message: 'Livraison du module authentification',
    category: 'calendar',
    appId: 'zimbra-calendar',
  },
  // System
  {
    type: 'info',
    title: 'Mise a jour disponible',
    message: 'ScalenixOS v2.4.1 est disponible',
    category: 'system',
    appId: 'settings',
  },
  {
    type: 'success',
    title: 'Sauvegarde terminee',
    message: 'Vos donnees ont ete sauvegardees avec succes',
    category: 'system',
    appId: 'settings',
  },
];

const POLL_INTERVAL = 60_000; // 60 seconds

/**
 * Periodically generates simulated notifications for demo purposes.
 * In production, this would connect to a WebSocket or poll real APIs.
 */
export function useNotificationPoller() {
  const { token } = useAuth();
  const push = useNotifStore((s) => s.push);
  const lastIndex = useRef(-1);

  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      // Pick a random notification (avoid repeating the last one)
      let idx: number;
      do {
        idx = Math.floor(Math.random() * SIMULATED_NOTIFICATIONS.length);
      } while (idx === lastIndex.current && SIMULATED_NOTIFICATIONS.length > 1);
      lastIndex.current = idx;

      const simulated = SIMULATED_NOTIFICATIONS[idx];
      push({
        type: simulated.type,
        title: simulated.title,
        message: simulated.message,
        category: simulated.category,
        appId: simulated.appId,
      });
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [token, push]);
}
