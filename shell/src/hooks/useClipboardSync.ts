import { useEffect } from 'react';
import { useClipboardHistoryStore } from '../store/clipboardHistoryStore';

/**
 * Synchronises clipboard content between iframes (Xpra, OnlyOffice, etc.)
 * and the shell's clipboard history.
 *
 * - Listens for `{ type: 'SCALENIX_CLIPBOARD', text }` messages from iframes
 *   and adds them to the clipboard history store.
 * - On native copy events, broadcasts the copied text to all iframes.
 */
export function useClipboardSync() {
  const addEntry = useClipboardHistoryStore((s) => s.addEntry);
  const broadcastClipboard = useClipboardHistoryStore((s) => s.broadcastClipboard);

  // Receive clipboard data from iframes
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (
        e.data &&
        typeof e.data === 'object' &&
        e.data.type === 'SCALENIX_CLIPBOARD' &&
        typeof e.data.text === 'string'
      ) {
        addEntry(e.data.text);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [addEntry]);

  // Broadcast native copy events to iframes
  useEffect(() => {
    const handleCopy = () => {
      navigator.clipboard.readText?.().then((text) => {
        if (text) broadcastClipboard(text);
      }).catch(() => {});
    };
    document.addEventListener('copy', handleCopy);
    return () => document.removeEventListener('copy', handleCopy);
  }, [broadcastClipboard]);
}
