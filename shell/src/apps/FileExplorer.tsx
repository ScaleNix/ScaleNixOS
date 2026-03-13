import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth/useAuth';
import { useContextMenu, type MenuItem } from '../components/ContextMenu';
import { useWindowStore } from '../store/windowStore';
import { useAppStore } from '../store/appStore';
import { useClipboardStore } from '../store/clipboardStore';
import { useDesktopStore } from '../store/desktopStore';
import { useNotifStore } from '../store/notifStore';
import { useThemeStore } from '../store/themeStore';
import { WebDAVClient, fileIcon, formatSize, formatDate, isOnlyOfficeCompatible, getOnlyOfficeUrl, getViewableFileType, type WebDAVItem } from './webdav';
import { getTemplateBlob } from './docTemplates';
import { importCsvToGrist } from '../api/gristClient';

const FAVORITES_STORAGE_KEY = 'scalenix-file-favorites';
const DEFAULT_FAVORITES = ['/Documents/', '/Images/', '/Projets/'];

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupt */ }
  return DEFAULT_FAVORITES;
}

function saveFavorites(favs: string[]) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));
  } catch { /* */ }
}


type ViewMode = 'grid' | 'list';

/** MIME type for internal drag-and-drop between explorer windows */
const DRAG_MIME = 'application/x-scalenix-files';

export function FileExplorer() {
  const { user, token } = useAuth();
  const { show: showCtx } = useContextMenu();
  const openEditorWindow = useWindowStore((s) => s.openEditorWindow);
  const openFileViewer = useWindowStore((s) => s.openFileViewer);
  const push = useNotifStore((s) => s.push);
  const colors = useThemeStore((s) => s.colors);
  const [currentPath, setCurrentPath] = useState('/');
  const [items, setItems] = useState<WebDAVItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [history, setHistory] = useState<string[]>(['/']);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'date'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [propsItem, setPropsItem] = useState<WebDAVItem | null>(null);
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const clientRef = useRef<WebDAVClient | null>(null);

  const username = user?.preferred_username ?? '';

  useEffect(() => {
    if (username && token) {
      clientRef.current = new WebDAVClient(username, token);
    }
  }, [username, token]);

  const fetchItems = useCallback(async (path: string) => {
    const client = clientRef.current;
    if (!client) return;
    setLoading(true);
    setError(null);
    setSelected(new Set());
    setRenaming(null);
    try {
      const result = await client.list(path);
      setItems(result);
    } catch (e: any) {
      setError(e.message ?? 'Erreur de chargement');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (clientRef.current) fetchItems(currentPath);
  }, [currentPath, fetchItems, username, token]);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setHistory((h) => [...h.slice(0, historyIdx + 1), path]);
    setHistoryIdx((i) => i + 1);
  }, [historyIdx]);

  const goBack = () => {
    if (historyIdx > 0) {
      setHistoryIdx((i) => i - 1);
      setCurrentPath(history[historyIdx - 1]);
    }
  };

  const goForward = () => {
    if (historyIdx < history.length - 1) {
      setHistoryIdx((i) => i + 1);
      setCurrentPath(history[historyIdx + 1]);
    }
  };

  const goUp = () => {
    if (currentPath === '/') return;
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    navigateTo('/' + parts.join('/') + (parts.length ? '/' : ''));
  };

  const openInOnlyOffice = (item: WebDAVItem) => {
    if (!item.fileId) return;
    const ncUrl = import.meta.env.VITE_NEXTCLOUD_URL ?? '';
    const url = `${ncUrl}/index.php/apps/onlyoffice/${item.fileId}`;
    openEditorWindow(item.name, '\ud83d\udcdd', url, { w: 1280, h: 800 });
  };

  const handleOpenInGrist = async (item: WebDAVItem) => {
    const client = clientRef.current;
    if (!client || !token) return;

    const ext = item.name.split('.').pop()?.toLowerCase();

    // For CSV files: import into Grist as a new document
    if (ext === 'csv' || ext === 'tsv') {
      try {
        push({ type: 'info', title: `Import de "${item.name}" dans Grist...` });
        const fileUrl = client.downloadUrl(currentPath + item.name);
        const res = await fetch(fileUrl, { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csvContent = await res.text();

        const GRIST_KEY = localStorage.getItem('scalenix-grist-api-key') || '';
        if (!GRIST_KEY) {
          // Open Grist directly — user needs to set up API key
          const gristApp = useAppStore.getState().getAppById('grist');
          if (gristApp) useWindowStore.getState().openWindow(gristApp);
          push({ type: 'warning', title: 'Cle API Grist requise', message: 'Ouvrez Grist, allez dans Profil > Cle API et copiez-la dans Preferences > Grist' });
          return;
        }

        const docName = item.name.replace(/\.(csv|tsv)$/i, '');
        const docId = await importCsvToGrist(GRIST_KEY, 3, docName, csvContent);
        // Open the new doc in Grist iframe
        const gristUrl = `${import.meta.env.VITE_GRIST_URL || 'https://grist.scalenix.fr'}/o/scalenix/doc/${docId}`;
        openEditorWindow(`${docName} — Grist`, '\ud83d\udcca', gristUrl, { w: 1280, h: 800 });
        push({ type: 'success', title: `"${item.name}" importe dans Grist` });
      } catch (err: any) {
        push({ type: 'error', title: 'Erreur import Grist', message: err.message });
      }
      return;
    }

    // For Excel files: open Grist with the file (Grist can import xlsx natively via UI)
    const gristApp = useAppStore.getState().getAppById('grist');
    if (gristApp) useWindowStore.getState().openWindow(gristApp);
    push({ type: 'info', title: 'Ouvrez Grist et importez le fichier', message: `Glissez "${item.name}" dans Grist ou utilisez Importer` });
  };


  const handleOpen = (item: WebDAVItem) => {
    if (item.isDirectory) {
      navigateTo(currentPath + item.name + '/');
      return;
    }

    const viewableType = getViewableFileType(item.name);
    if (viewableType) {
      const client = clientRef.current;
      if (!client) return;
      const fileUrl = client.downloadUrl(currentPath + item.name);
      const viewableSiblings = items
        .filter((i) => !i.isDirectory && getViewableFileType(i.name) !== null)
        .map((i) => ({
          url: client.downloadUrl(currentPath + i.name),
          name: i.name,
          type: getViewableFileType(i.name)!,
        }));
      openFileViewer(item.name, fileUrl, viewableType, viewableSiblings.length > 1 ? viewableSiblings : undefined);
      return;
    }

    if (isOnlyOfficeCompatible(item.name) && item.fileId) {
      openInOnlyOffice(item);
      return;
    }

    // Download
    const client = clientRef.current;
    if (!client) return;
    const url = client.downloadUrl(currentPath + item.name);
    const a = document.createElement('a');
    a.href = url;
    a.download = item.name;
    a.click();
  };

  // ── File operations ──
  const handleNewFolder = async () => {
    const name = prompt('Nom du dossier :');
    if (!name || !clientRef.current) return;
    try {
      await clientRef.current.createFolder(currentPath + name);
      push({ type: 'success', title: `Dossier "${name}" cree` });
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleNewFile = async (ext: string, defaultName: string) => {
    const name = prompt('Nom du fichier :', defaultName);
    if (!name || !clientRef.current) return;
    try {
      const finalName = name.includes('.') ? name : `${name}.${ext}`;
      const blob = getTemplateBlob(finalName);
      await clientRef.current.uploadBlob(currentPath, blob, finalName);
      push({ type: 'success', title: `Fichier "${name}" cree` });
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleDelete = async (itemPaths: string[]) => {
    if (!clientRef.current || itemPaths.length === 0) return;
    const msg = itemPaths.length === 1
      ? `Supprimer "${itemPaths[0].split('/').filter(Boolean).pop()}" ?`
      : `Supprimer ${itemPaths.length} elements ?`;
    if (!confirm(msg)) return;
    try {
      for (const p of itemPaths) {
        await clientRef.current.delete(p);
      }
      push({ type: 'success', title: `${itemPaths.length} element(s) supprime(s)` });
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    if (!clientRef.current || !newName) return;
    const dir = oldPath.substring(0, oldPath.lastIndexOf('/') + 1);
    try {
      await clientRef.current.move(oldPath, dir + newName);
      setRenaming(null);
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleDuplicate = async (item: WebDAVItem) => {
    if (!clientRef.current) return;
    const src = currentPath + item.name + (item.isDirectory ? '/' : '');
    const ext = item.name.includes('.') ? '.' + item.name.split('.').pop() : '';
    const base = item.name.replace(/\.[^.]+$/, '');
    const dest = currentPath + base + ' (copie)' + ext;
    try {
      await clientRef.current.copy(src, dest);
      push({ type: 'success', title: `"${item.name}" duplique` });
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  const handleUpload = async (files: FileList | null) => {
    if (!files || !clientRef.current) return;
    try {
      for (let i = 0; i < files.length; i++) {
        await clientRef.current.upload(currentPath, files[i]);
      }
      push({ type: 'success', title: `${files.length} fichier(s) importe(s)` });
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  // ── Favorites ──
  const addFavorite = (path: string) => {
    setFavorites((prev) => {
      if (prev.includes(path)) return prev;
      const next = [...prev, path];
      saveFavorites(next);
      return next;
    });
  };

  const removeFavorite = (path: string) => {
    setFavorites((prev) => {
      const next = prev.filter((p) => p !== path);
      saveFavorites(next);
      return next;
    });
  };

  const isFavorite = (path: string) => favorites.includes(path);

  // ── Clipboard (Copy / Cut / Paste) ──
  const handleCopy = () => {
    const client = clientRef.current;
    if (!client) return;
    const clipItems = [...selected].map((path) => {
      const item = items.find((i) => currentPath + i.name + (i.isDirectory ? '/' : '') === path);
      return {
        name: item?.name ?? path.split('/').filter(Boolean).pop() ?? '',
        path,
        isDirectory: item?.isDirectory ?? path.endsWith('/'),
        downloadUrl: client.downloadUrl(path),
        contentType: item?.contentType ?? '',
        size: item?.size ?? 0,
      };
    });
    useClipboardStore.getState().setClipboard(clipItems, 'copy');
    push({ type: 'info', title: `${clipItems.length} element(s) copie(s)` });
  };

  const handleCut = () => {
    const client = clientRef.current;
    if (!client) return;
    const clipItems = [...selected].map((path) => {
      const item = items.find((i) => currentPath + i.name + (i.isDirectory ? '/' : '') === path);
      return {
        name: item?.name ?? path.split('/').filter(Boolean).pop() ?? '',
        path,
        isDirectory: item?.isDirectory ?? path.endsWith('/'),
        downloadUrl: client.downloadUrl(path),
        contentType: item?.contentType ?? '',
        size: item?.size ?? 0,
      };
    });
    useClipboardStore.getState().setClipboard(clipItems, 'cut');
    push({ type: 'info', title: `${clipItems.length} element(s) coupe(s)` });
  };

  const handlePaste = async () => {
    const client = clientRef.current;
    if (!client) return;
    const { items: clipItems, mode } = useClipboardStore.getState();
    if (clipItems.length === 0 || !mode) return;

    try {
      for (const ci of clipItems) {
        const dest = currentPath + ci.name;
        if (mode === 'copy') {
          await client.copy(ci.path, dest);
        } else {
          await client.move(ci.path, dest);
        }
      }
      push({ type: 'success', title: `${clipItems.length} element(s) ${mode === 'copy' ? 'colle(s)' : 'deplace(s)'}` });
      if (mode === 'cut') useClipboardStore.getState().clear();
      fetchItems(currentPath);
    } catch (e: any) {
      push({ type: 'error', title: 'Erreur', message: e.message });
    }
  };

  // ── Drag & Drop (internal + external) ──
  const handleDragStartItem = (e: React.DragEvent, item: WebDAVItem) => {
    const itemPath = currentPath + item.name + (item.isDirectory ? '/' : '');

    // Set internal drag data
    const dragData = {
      sourcePath: currentPath,
      items: selected.has(itemPath)
        ? [...selected].map((p) => ({
            path: p,
            name: p.split('/').filter(Boolean).pop() ?? '',
            isDirectory: p.endsWith('/'),
          }))
        : [{ path: itemPath, name: item.name, isDirectory: item.isDirectory }],
    };
    e.dataTransfer.setData(DRAG_MIME, JSON.stringify(dragData));
    e.dataTransfer.setData('text/plain', item.name);
    e.dataTransfer.effectAllowed = 'copyMove';

    // For drops on iframes: fetch the file as blob and set as file
    if (!item.isDirectory && clientRef.current && token) {
      const url = clientRef.current.downloadUrl(currentPath + item.name);
      // Store file info for Window.tsx drop handler
      e.dataTransfer.setData('application/x-scalenix-file-url', url);
      e.dataTransfer.setData('application/x-scalenix-file-name', item.name);
      e.dataTransfer.setData('application/x-scalenix-file-type', item.contentType);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    // Check for internal drag data first
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (raw) {
      const data = JSON.parse(raw) as { sourcePath: string; items: { path: string; name: string; isDirectory: boolean }[] };
      // Don't drop on itself
      if (data.sourcePath === currentPath) return;
      const client = clientRef.current;
      if (!client) return;
      try {
        for (const item of data.items) {
          const dest = currentPath + item.name;
          await client.move(item.path, dest);
        }
        push({ type: 'success', title: `${data.items.length} element(s) deplace(s)` });
        fetchItems(currentPath);
      } catch (e: any) {
        push({ type: 'error', title: 'Erreur', message: e.message });
      }
      return;
    }

    // External files from OS
    handleUpload(e.dataTransfer.files);
  };

  const handleDropOnFolder = async (e: React.DragEvent, folder: WebDAVItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (raw) {
      const data = JSON.parse(raw) as { sourcePath: string; items: { path: string; name: string; isDirectory: boolean }[] };
      const client = clientRef.current;
      if (!client) return;
      const targetDir = currentPath + folder.name + '/';
      try {
        for (const item of data.items) {
          const dest = targetDir + item.name;
          await client.move(item.path, dest);
        }
        push({ type: 'success', title: `Deplace dans "${folder.name}"` });
        fetchItems(currentPath);
      } catch (e: any) {
        push({ type: 'error', title: 'Erreur', message: e.message });
      }
      return;
    }

    // External files dropped on folder
    if (e.dataTransfer.files.length > 0 && clientRef.current) {
      const targetDir = currentPath + folder.name + '/';
      try {
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const res = await fetch(`${clientRef.current['baseUrl']}${targetDir}${file.name}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': file.type || 'application/octet-stream' },
            body: file,
          });
          if (!res.ok) throw new Error(`PUT failed: ${res.status}`);
        }
        push({ type: 'success', title: `Importe dans "${folder.name}"` });
        fetchItems(currentPath);
      } catch (e: any) {
        push({ type: 'error', title: 'Erreur', message: e.message });
      }
    }
  };

  const handleSelect = (item: WebDAVItem, e: React.MouseEvent) => {
    const path = currentPath + item.name + (item.isDirectory ? '/' : '');
    if (e.metaKey || e.ctrlKey) {
      setSelected((s) => {
        const next = new Set(s);
        next.has(path) ? next.delete(path) : next.add(path);
        return next;
      });
    } else if (e.shiftKey) {
      // Range select
      const allPaths = sortedItems.map((i) => currentPath + i.name + (i.isDirectory ? '/' : ''));
      const lastIdx = allPaths.findIndex((p) => selected.has(p));
      const curIdx = allPaths.indexOf(path);
      if (lastIdx >= 0) {
        const [start, end] = [Math.min(lastIdx, curIdx), Math.max(lastIdx, curIdx)];
        setSelected(new Set(allPaths.slice(start, end + 1)));
      } else {
        setSelected(new Set([path]));
      }
    } else {
      setSelected(new Set([path]));
    }
  };

  // ── Context Menus ──
  const iconForType = (t: string | null) =>
    t === 'image' ? '\ud83d\uddbc\ufe0f' : t === 'video' ? '\ud83c\udfac' : t === 'audio' ? '\ud83c\udfb5' : '\ud83d\udcc4';

  const handleItemContextMenu = (e: React.MouseEvent, item: WebDAVItem) => {
    e.preventDefault();
    const itemPath = currentPath + item.name + (item.isDirectory ? '/' : '');
    if (!selected.has(itemPath)) setSelected(new Set([itemPath]));

    const clipState = useClipboardStore.getState();
    const menuItems: MenuItem[] = [];

    // ── Open ──
    menuItems.push({ label: 'Ouvrir', icon: '\ud83d\udcc2', onClick: () => handleOpen(item) });

    // ── Favorite toggle for folders ──
    if (item.isDirectory) {
      const folderPath = currentPath + item.name + '/';
      if (isFavorite(folderPath)) {
        menuItems.push({ label: 'Retirer des favoris', icon: '\u2606', onClick: () => removeFavorite(folderPath) });
      } else {
        menuItems.push({ label: 'Ajouter aux favoris', icon: '\u2605', onClick: () => addFavorite(folderPath) });
      }
    }

    if (!item.isDirectory && isOnlyOfficeCompatible(item.name) && item.fileId) {
      menuItems.push({ label: 'Ouvrir dans OnlyOffice', icon: '\ud83d\udcdd', onClick: () => openInOnlyOffice(item) });
    }

    // Open CSV/XLSX in Grist
    if (!item.isDirectory && /\.(csv|tsv|xlsx?)$/i.test(item.name)) {
      menuItems.push({
        label: 'Ouvrir dans Grist',
        icon: '\ud83d\udcca',
        onClick: () => handleOpenInGrist(item),
      });
    }

    const viewType = getViewableFileType(item.name);
    if (!item.isDirectory && viewType) {
      menuItems.push({
        label: 'Ouvrir dans la visionneuse',
        icon: iconForType(viewType),
        onClick: () => handleOpen(item),
      });
    }

    menuItems.push({ separator: true, label: '' });

    // ── Cut / Copy / Paste ──
    menuItems.push(
      {
        label: 'Copier',
        icon: '\ud83d\udccb',
        shortcut: '\u2318C',
        onClick: () => {
          if (!selected.has(itemPath)) setSelected(new Set([itemPath]));
          setTimeout(handleCopy, 0);
        },
      },
      {
        label: 'Couper',
        icon: '\u2702\ufe0f',
        shortcut: '\u2318X',
        onClick: () => {
          if (!selected.has(itemPath)) setSelected(new Set([itemPath]));
          setTimeout(handleCut, 0);
        },
      },
    );

    if (clipState.items.length > 0 && item.isDirectory) {
      menuItems.push({
        label: `Coller ici (${clipState.items.length})`,
        icon: '\ud83d\udccb',
        shortcut: '\u2318V',
        onClick: async () => {
          const client = clientRef.current;
          if (!client) return;
          const targetDir = currentPath + item.name + '/';
          try {
            for (const ci of clipState.items) {
              const dest = targetDir + ci.name;
              if (clipState.mode === 'copy') await client.copy(ci.path, dest);
              else await client.move(ci.path, dest);
            }
            push({ type: 'success', title: `Colle dans "${item.name}"` });
            if (clipState.mode === 'cut') useClipboardStore.getState().clear();
            fetchItems(currentPath);
          } catch (err: any) {
            push({ type: 'error', title: 'Erreur', message: err.message });
          }
        },
      });
    }

    menuItems.push({ separator: true, label: '' });

    // ── File actions ──
    if (!item.isDirectory) {
      menuItems.push({
        label: 'Telecharger',
        icon: '\u2b07\ufe0f',
        onClick: () => {
          const client = clientRef.current;
          if (!client) return;
          const url = client.downloadUrl(currentPath + item.name);
          const a = document.createElement('a');
          a.href = url;
          a.download = item.name;
          a.click();
        },
      });
    }

    menuItems.push({
      label: 'Dupliquer',
      icon: '\ud83d\udcc4',
      onClick: () => handleDuplicate(item),
    });

    // ── Desktop shortcuts ──
    if (!item.isDirectory) {
      menuItems.push({
        label: 'Ajouter au bureau',
        icon: '\ud83d\udccc',
        onClick: () => {
          const client = clientRef.current;
          if (!client) return;
          const vt = getViewableFileType(item.name);
          useDesktopStore.getState().addShortcut({
            label: item.name,
            icon: iconForType(vt),
            type: 'file',
            filePath: client.downloadUrl(currentPath + item.name),
            fileName: item.name,
            fileType: vt ?? undefined,
          });
          push({ type: 'success', title: 'Raccourci ajoute au bureau' });
        },
      });
    }

    menuItems.push({ separator: true, label: '' });

    // ── Rename ──
    menuItems.push({
      label: 'Renommer',
      icon: '\u270f\ufe0f',
      shortcut: 'F2',
      onClick: () => {
        setRenaming(itemPath);
        setRenameValue(item.name);
      },
    });

    // ── Properties ──
    menuItems.push({
      label: 'Proprietes',
      icon: '\u2139\ufe0f',
      onClick: () => setPropsItem(item),
    });

    menuItems.push({ separator: true, label: '' });

    // ── Delete ──
    menuItems.push({
      label: selected.size > 1 ? `Supprimer (${selected.size})` : 'Supprimer',
      icon: '\ud83d\uddd1\ufe0f',
      danger: true,
      shortcut: 'Suppr',
      onClick: () => handleDelete(selected.size > 1 ? [...selected] : [itemPath]),
    });

    showCtx(e.clientX, e.clientY, menuItems);
  };

  const handleBgContextMenu = (e: React.MouseEvent) => {
    if (e.target !== e.currentTarget) return;
    e.preventDefault();
    const clipState = useClipboardStore.getState();

    showCtx(e.clientX, e.clientY, [
      { label: 'Nouveau dossier', icon: '\ud83d\udcc1', onClick: handleNewFolder },
      { separator: true, label: '' },
      { label: 'Nouveau document texte', icon: '\ud83d\udcc3', onClick: () => handleNewFile('txt', 'Sans titre.txt') },
      { label: 'Nouveau document Word', icon: '\ud83d\udcdd', onClick: () => handleNewFile('docx', 'Document.docx') },
      { label: 'Nouveau tableur', icon: '\ud83d\udcca', onClick: () => handleNewFile('xlsx', 'Classeur.xlsx') },
      { label: 'Nouveau Markdown', icon: '\ud83d\udcdd', onClick: () => handleNewFile('md', 'Notes.md') },
      { separator: true, label: '' },
      {
        label: clipState.items.length > 0 ? `Coller (${clipState.items.length})` : 'Coller',
        icon: '\ud83d\udccb',
        shortcut: '\u2318V',
        disabled: clipState.items.length === 0,
        onClick: handlePaste,
      },
      { separator: true, label: '' },
      { label: 'Importer un fichier', icon: '\u2b06\ufe0f', onClick: () => fileInputRef.current?.click() },
      { separator: true, label: '' },
      {
        label: 'Tout selectionner',
        icon: '\u2610',
        shortcut: '\u2318A',
        onClick: () => {
          setSelected(new Set(items.map((i) => currentPath + i.name + (i.isDirectory ? '/' : ''))));
        },
      },
      { label: 'Actualiser', icon: '\ud83d\udd04', shortcut: 'F5', onClick: () => fetchItems(currentPath) },
    ]);
  };

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle when this component's window is active
      if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSelected(new Set(items.map((i) => currentPath + i.name + (i.isDirectory ? '/' : ''))));
      }
      if (e.key === 'c' && (e.metaKey || e.ctrlKey) && selected.size > 0) {
        handleCopy();
      }
      if (e.key === 'x' && (e.metaKey || e.ctrlKey) && selected.size > 0) {
        handleCut();
      }
      if (e.key === 'v' && (e.metaKey || e.ctrlKey)) {
        handlePaste();
      }
      if (e.key === 'Delete' && selected.size > 0) {
        handleDelete([...selected]);
      }
      if (e.key === 'F2' && selected.size === 1) {
        const path = [...selected][0];
        const name = path.split('/').filter(Boolean).pop() ?? '';
        setRenaming(path);
        setRenameValue(name);
      }
      if (e.key === 'F5') {
        e.preventDefault();
        fetchItems(currentPath);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, currentPath, selected]);

  const filteredItems = searchQuery
    ? items.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : items;

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    const dir = sortAsc ? 1 : -1;
    switch (sortBy) {
      case 'size': return (a.size - b.size) * dir;
      case 'date': return (new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime()) * dir;
      default: return a.name.localeCompare(b.name) * dir;
    }
  });

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  const toggleSort = (col: 'name' | 'size' | 'date') => {
    if (sortBy === col) setSortAsc((v) => !v);
    else { setSortBy(col); setSortAsc(true); }
  };

  // ── Render helpers ──
  const highlightMatch = (name: string) => {
    if (!searchQuery) return name;
    const idx = name.toLowerCase().indexOf(searchQuery.toLowerCase());
    if (idx < 0) return name;
    return (
      <>
        {name.slice(0, idx)}
        <mark style={{ background: `${colors.accent}40`, color: colors.textPrimary, borderRadius: '2px', padding: '0 1px' }}>
          {name.slice(idx, idx + searchQuery.length)}
        </mark>
        {name.slice(idx + searchQuery.length)}
      </>
    );
  };

  const renderGridItem = (item: WebDAVItem) => {
    const path = currentPath + item.name + (item.isDirectory ? '/' : '');
    const isSelected = selected.has(path);
    const isRenaming = renaming === path;
    return (
      <div
        key={item.name}
        className="group flex flex-col items-center gap-1 rounded-lg p-2 transition-colors cursor-default"
        style={{
          background: isSelected ? `${colors.accent}33` : undefined,
          boxShadow: isSelected ? `inset 0 0 0 1px ${colors.accent}66` : undefined,
        }}
        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${colors.border}80`; }}
        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        draggable={!isRenaming}
        onDragStart={(e) => handleDragStartItem(e, item)}
        onDragOver={item.isDirectory ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
        onDrop={item.isDirectory ? (e) => handleDropOnFolder(e, item) : undefined}
        onClick={(e) => handleSelect(item, e)}
        onDoubleClick={() => handleOpen(item)}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        <span className="text-3xl drop-shadow transition-transform group-hover:scale-110">
          {fileIcon(item)}
        </span>
        {isRenaming ? (
          <input
            ref={renameInputRef}
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => handleRename(path, renameValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleRename(path, renameValue);
              if (e.key === 'Escape') setRenaming(null);
            }}
            className="w-full rounded px-1 py-0.5 text-center text-[11px] outline-none ring-1"
            style={{ background: colors.border, color: colors.textPrimary, ['--tw-ring-color' as string]: colors.accent }}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="w-full truncate text-center text-[11px] font-medium">{highlightMatch(item.name)}</span>
        )}
      </div>
    );
  };

  const renderListItem = (item: WebDAVItem) => {
    const path = currentPath + item.name + (item.isDirectory ? '/' : '');
    const isSelected = selected.has(path);
    const isRenaming = renaming === path;
    return (
      <div
        key={item.name}
        className="flex cursor-default items-center gap-2 rounded-md px-2 py-1 transition-colors"
        style={{ background: isSelected ? `${colors.accent}33` : undefined }}
        onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = `${colors.border}80`; }}
        onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        draggable={!isRenaming}
        onDragStart={(e) => handleDragStartItem(e, item)}
        onDragOver={item.isDirectory ? (e) => { e.preventDefault(); e.stopPropagation(); } : undefined}
        onDrop={item.isDirectory ? (e) => handleDropOnFolder(e, item) : undefined}
        onClick={(e) => handleSelect(item, e)}
        onDoubleClick={() => handleOpen(item)}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        <span className="text-base">{fileIcon(item)}</span>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={() => handleRename(path, renameValue)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(path, renameValue);
                if (e.key === 'Escape') setRenaming(null);
              }}
              className="w-full rounded px-1 py-0.5 text-xs outline-none ring-1"
              style={{ background: colors.border, color: colors.textPrimary, ['--tw-ring-color' as string]: colors.accent }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="truncate text-xs">{highlightMatch(item.name)}</span>
          )}
        </div>
        <span className="w-24 text-right text-[11px]" style={{ color: colors.textSecondary }}>
          {item.isDirectory ? '--' : formatSize(item.size)}
        </span>
        <span className="w-40 text-right text-[11px]" style={{ color: colors.textSecondary }}>{formatDate(item.lastModified)}</span>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col" style={{ background: colors.surfaceAlt, color: colors.textPrimary }}>
      {/* Toolbar */}
      <div className="flex h-10 shrink-0 items-center gap-1 border-b px-2" style={{ borderColor: colors.border, background: colors.surface }}>
        {/* Sidebar toggle */}
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="toolbar-btn"
          title={sidebarOpen ? 'Masquer les favoris' : 'Afficher les favoris'}
          style={{ color: sidebarOpen ? colors.accent : undefined }}
        >
          {'\u2630'}
        </button>

        <div className="mx-1 h-5 w-px" style={{ background: colors.border }} />

        <button onClick={goBack} disabled={historyIdx <= 0} className="toolbar-btn" title="Precedent">{'\u25c0'}</button>
        <button onClick={goForward} disabled={historyIdx >= history.length - 1} className="toolbar-btn" title="Suivant">{'\u25b6'}</button>
        <button onClick={goUp} disabled={currentPath === '/'} className="toolbar-btn" title="Dossier parent">{'\u2b06'}</button>

        <div className="mx-1 h-5 w-px" style={{ background: colors.border }} />

        {/* Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-hidden">
          <button onClick={() => navigateTo('/')} className="shrink-0 rounded px-1.5 py-0.5 text-xs hover:opacity-80" style={{ color: colors.textPrimary }}>
            {'\ud83c\udfe0'}
          </button>
          {breadcrumbs.map((seg, i) => (
            <span key={i} className="flex shrink-0 items-center gap-0.5">
              <span className="text-xs" style={{ color: colors.textSecondary }}>/</span>
              <button
                onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/') + '/')}
                className="truncate rounded px-1.5 py-0.5 text-xs hover:opacity-80"
              >
                {seg}
              </button>
            </span>
          ))}
        </div>

        <div className="mx-1 h-5 w-px" style={{ background: colors.border }} />

        {/* Search bar */}
        <div className="relative flex items-center">
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-6 w-40 rounded-md border px-2 pr-6 text-[11px] outline-none focus:ring-1"
            style={{
              background: colors.surfaceAlt,
              borderColor: colors.border,
              color: colors.textPrimary,
              ...(searchQuery ? { ringColor: colors.accent } : {}),
            }}
            onFocus={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.accent; }}
            onBlur={(e) => { (e.target as HTMLInputElement).style.borderColor = colors.border; }}
          />
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] hover:opacity-80"
              style={{ color: colors.textSecondary }}
              title="Effacer la recherche"
            >
              {'\u2715'}
            </button>
          ) : (
            <span className="absolute right-1.5 text-[11px] pointer-events-none" style={{ color: colors.textSecondary }}>
              {'\ud83d\udd0d'}
            </span>
          )}
        </div>

        <div className="mx-1 h-5 w-px" style={{ background: colors.border }} />

        <button onClick={() => setViewMode('grid')} className="toolbar-btn" style={viewMode === 'grid' ? { background: colors.border } : {}} title="Grille">{'\u25a6'}</button>
        <button onClick={() => setViewMode('list')} className="toolbar-btn" style={viewMode === 'list' ? { background: colors.border } : {}} title="Liste">{'\u2630'}</button>

        <div className="mx-1 h-5 w-px" style={{ background: colors.border }} />

        <button onClick={handleNewFolder} className="toolbar-btn" title="Nouveau dossier">{'\ud83d\udcc1\u207a'}</button>
        <button onClick={() => fileInputRef.current?.click()} className="toolbar-btn" title="Importer">{'\u2b06\ufe0f'}</button>
        <button
          onClick={() => { if (selected.size > 0) handleDelete([...selected]); }}
          disabled={selected.size === 0}
          className="toolbar-btn"
          title="Supprimer"
        >
          {'\ud83d\uddd1\ufe0f'}
        </button>
      </div>

      {/* Main area: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Favorites sidebar */}
        {sidebarOpen && (
          <div
            className="flex w-48 shrink-0 flex-col border-r overflow-y-auto"
            style={{ background: colors.surface, borderColor: colors.border }}
          >
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                Favoris
              </span>
            </div>
            <div className="flex flex-col gap-0.5 px-1 pb-2">
              {favorites.map((favPath) => {
                const favName = favPath.split('/').filter(Boolean).pop() ?? favPath;
                const isActive = currentPath === favPath;
                return (
                  <div
                    key={favPath}
                    className="group flex items-center gap-1.5 rounded-md px-2 py-1 cursor-pointer transition-colors"
                    style={{
                      background: isActive ? `${colors.accent}20` : undefined,
                      color: isActive ? colors.accent : colors.textPrimary,
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = `${colors.border}80`; }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                    onClick={() => navigateTo(favPath)}
                  >
                    <span className="text-sm">{'\ud83d\udcc1'}</span>
                    <span className="flex-1 truncate text-xs font-medium">{favName}</span>
                    <button
                      className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-[10px] hover:opacity-80"
                      style={{ color: colors.textSecondary }}
                      title="Retirer des favoris"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFavorite(favPath);
                      }}
                    >
                      {'\u2715'}
                    </button>
                  </div>
                );
              })}
              {favorites.length === 0 && (
                <span className="px-2 text-[11px] italic" style={{ color: colors.textSecondary }}>
                  Aucun favori
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content area */}
        <div
          className={`relative flex-1 overflow-auto p-2 ${dragOver ? 'ring-2 ring-inset' : ''}`}
          style={dragOver ? { ['--tw-ring-color' as string]: colors.accent } : {}}
          onContextMenu={handleBgContextMenu}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={(e) => { if (e.target === e.currentTarget) setSelected(new Set()); }}
        >
          {/* Search results count */}
          {searchQuery && !loading && (
            <div className="mb-2 flex items-center gap-2 text-[11px]" style={{ color: colors.textSecondary }}>
              <span>{filteredItems.length} resultat{filteredItems.length !== 1 ? 's' : ''}</span>
              <span>pour &laquo; {searchQuery} &raquo;</span>
            </div>
          )}

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: colors.accent, borderTopColor: 'transparent' }} />
            </div>
          ) : error ? (
            <div className="flex h-full flex-col items-center justify-center gap-3">
              <span className="text-3xl">{'\u26a0\ufe0f'}</span>
              <span className="text-sm" style={{ color: colors.textSecondary }}>{error}</span>
              <button
                onClick={() => fetchItems(currentPath)}
                className="rounded-lg px-4 py-1.5 text-xs font-medium text-white hover:opacity-90"
                style={{ background: colors.accent }}
              >
                Reessayer
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: colors.textSecondary }}>
              <span className="text-4xl">{'\ud83d\udcc2'}</span>
              <span className="text-sm">Dossier vide</span>
              <span className="text-xs">Deposez des fichiers ici ou cliquez sur Importer</span>
            </div>
          ) : searchQuery && filteredItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2" style={{ color: colors.textSecondary }}>
              <span className="text-3xl">{'\ud83d\udd0d'}</span>
              <span className="text-sm">Aucun resultat pour &laquo; {searchQuery} &raquo;</span>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(96px,1fr))] gap-1">
              {sortedItems.map(renderGridItem)}
            </div>
          ) : (
            <div className="flex flex-col">
              <div className="flex items-center border-b px-2 py-1 text-[11px] font-semibold uppercase tracking-wider" style={{ borderColor: colors.border, color: colors.textSecondary }}>
                <button className="flex flex-1 items-center gap-1" onClick={() => toggleSort('name')}>
                  Nom {sortBy === 'name' && (sortAsc ? '\u25b2' : '\u25bc')}
                </button>
                <button className="flex w-24 items-center gap-1 justify-end" onClick={() => toggleSort('size')}>
                  Taille {sortBy === 'size' && (sortAsc ? '\u25b2' : '\u25bc')}
                </button>
                <button className="flex w-40 items-center gap-1 justify-end" onClick={() => toggleSort('date')}>
                  Modifie {sortBy === 'date' && (sortAsc ? '\u25b2' : '\u25bc')}
                </button>
              </div>
              {sortedItems.map(renderListItem)}
            </div>
          )}

          {/* Drop overlay */}
          {dragOver && (
            <div className="absolute inset-0 z-10 flex items-center justify-center backdrop-blur-sm pointer-events-none" style={{ background: `${colors.accent}1a` }}>
              <div className="rounded-2xl border-2 border-dashed px-8 py-6 text-center" style={{ borderColor: colors.accent }}>
                <span className="text-3xl">{'\u2b06\ufe0f'}</span>
                <p className="mt-2 text-sm font-medium" style={{ color: colors.accent }}>Deposer les fichiers ici</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Properties modal */}
      {propsItem && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setPropsItem(null)}>
          <div className="w-80 rounded-xl border p-5 shadow-2xl" style={{ borderColor: colors.border, background: colors.surface }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{fileIcon(propsItem)}</span>
              <div className="min-w-0">
                <h3 className="truncate text-sm font-semibold" style={{ color: colors.textPrimary }}>{propsItem.name}</h3>
                <p className="text-[11px]" style={{ color: colors.textSecondary }}>{propsItem.isDirectory ? 'Dossier' : propsItem.contentType || 'Fichier'}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: colors.textSecondary }}>Chemin</span>
                <span className="truncate max-w-[160px]" style={{ color: colors.textSecondary }}>{currentPath + propsItem.name}</span>
              </div>
              {!propsItem.isDirectory && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>Taille</span>
                  <span style={{ color: colors.textSecondary }}>{formatSize(propsItem.size)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span style={{ color: colors.textSecondary }}>Modifie</span>
                <span style={{ color: colors.textSecondary }}>{formatDate(propsItem.lastModified)}</span>
              </div>
              {propsItem.etag && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>ETag</span>
                  <span className="truncate max-w-[160px]" style={{ color: colors.textSecondary }}>{propsItem.etag}</span>
                </div>
              )}
              {propsItem.fileId && (
                <div className="flex justify-between">
                  <span style={{ color: colors.textSecondary }}>ID</span>
                  <span style={{ color: colors.textSecondary }}>{propsItem.fileId}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => setPropsItem(null)}
              className="mt-4 w-full rounded-lg py-1.5 text-xs font-medium text-white hover:opacity-90"
              style={{ background: colors.accent }}
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="flex h-7 shrink-0 items-center justify-between border-t px-3 text-[11px]" style={{ borderColor: colors.border, background: colors.surface, color: colors.textSecondary }}>
        <span>
          {searchQuery ? `${filteredItems.length}/${items.length}` : items.length} element{items.length !== 1 ? 's' : ''}
          {selected.size > 0 && ` \u2014 ${selected.size} selectionne${selected.size !== 1 ? 's' : ''}`}
        </span>
        <span>{formatSize(items.reduce((s, i) => s + i.size, 0))}</span>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleUpload(e.target.files)}
      />

      <style>{`
        .toolbar-btn {
          display: flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; border-radius: 6px;
          font-size: 13px; transition: background-color 150ms;
          color: ${colors.textPrimary};
        }
        .toolbar-btn:hover:not(:disabled) { background-color: ${colors.border}; }
        .toolbar-btn:disabled { opacity: 0.3; cursor: default; }
      `}</style>
    </div>
  );
}
