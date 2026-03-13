import { useState, useCallback, useEffect, useRef } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../auth/useAuth';

interface FileTab {
  id: string;
  name: string;
  content: string;
  language: string;
}

const LS_KEY = 'scalenix-texteditor-files';

const WELCOME_CONTENT = `# Bienvenue dans l'editeur de texte ScaleNixOS

Cet editeur utilise **Monaco Editor**, le meme moteur que VS Code.

## Fonctionnalites
- Coloration syntaxique automatique
- Onglets multiples
- Sauvegarde locale (localStorage)
- Detection automatique du langage
- Glisser-deposer de fichiers depuis l'explorateur

## Raccourcis
- \`Ctrl+S\` : Sauvegarder
- \`Ctrl+N\` : Nouveau fichier
- \`Ctrl+W\` : Fermer l'onglet

Bonne edition !
`;

const EXT_LANG_MAP: Record<string, string> = {
  js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
  py: 'python', rb: 'ruby', rs: 'rust', go: 'go', java: 'java',
  c: 'c', cpp: 'cpp', h: 'c', hpp: 'cpp', cs: 'csharp',
  html: 'html', htm: 'html', css: 'css', scss: 'scss', less: 'less',
  json: 'json', xml: 'xml', yaml: 'yaml', yml: 'yaml', toml: 'toml',
  md: 'markdown', markdown: 'markdown', txt: 'plaintext',
  sh: 'shell', bash: 'shell', zsh: 'shell', fish: 'shell',
  sql: 'sql', graphql: 'graphql', dockerfile: 'dockerfile',
  nix: 'plaintext', lua: 'lua', php: 'php', swift: 'swift', kt: 'kotlin',
};

const TEXT_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'json', 'xml', 'yaml', 'yml', 'toml', 'csv', 'tsv',
  'js', 'jsx', 'ts', 'tsx', 'py', 'rb', 'rs', 'go', 'java', 'c', 'cpp', 'h', 'hpp', 'cs',
  'html', 'htm', 'css', 'scss', 'less', 'sh', 'bash', 'zsh', 'fish',
  'sql', 'graphql', 'dockerfile', 'nix', 'lua', 'php', 'swift', 'kt',
  'ini', 'cfg', 'conf', 'env', 'log', 'svg',
]);

function isTextFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const base = filename.toLowerCase();
  if (base === 'dockerfile' || base === 'makefile' || base === '.gitignore') return true;
  return TEXT_EXTENSIONS.has(ext);
}

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const base = filename.toLowerCase();
  if (base === 'dockerfile') return 'dockerfile';
  if (base === 'makefile') return 'plaintext';
  return EXT_LANG_MAP[ext] ?? 'plaintext';
}

function isDarkBg(bg: string): boolean {
  const hex = bg.replace('#', '');
  if (hex.length < 6) return true;
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}

function makeId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function loadFiles(): FileTab[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch { /* ignore */ }
  return [{ id: makeId(), name: 'bienvenue.md', content: WELCOME_CONTENT, language: 'markdown' }];
}

function saveFiles(files: FileTab[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(files));
}

export function TextEditor() {
  const colors = useThemeStore((s) => s.colors);
  const { token } = useAuth();
  const dark = isDarkBg(colors.bg);
  const monacoTheme = dark ? 'vs-dark' : 'light';

  const [files, setFiles] = useState<FileTab[]>(loadFiles);
  const [activeId, setActiveId] = useState<string>(() => files[0]?.id ?? '');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 1, column: 1 });
  const editorRef = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeFile = files.find((f) => f.id === activeId);

  // Persist files on change
  useEffect(() => { saveFiles(files); }, [files]);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  // Listen for scalenix-file-drop events (files dragged from FileExplorer)
  useEffect(() => {
    const handler = async (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || detail.appId !== 'text-editor') return;

      const { fileUrl, fileName, token: dropToken } = detail;
      const authToken = dropToken || token;
      if (!authToken || !fileUrl || !fileName) return;

      // Only handle text files
      if (!isTextFile(fileName)) return;

      try {
        const res = await fetch(fileUrl, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const content = await res.text();
        const lang = detectLanguage(fileName);
        const tab: FileTab = { id: makeId(), name: fileName, content, language: lang };
        setFiles((prev) => [...prev, tab]);
        setActiveId(tab.id);
      } catch (err) {
        console.error('TextEditor: failed to load dropped file', err);
      }
    };

    window.addEventListener('scalenix-file-drop', handler);
    return () => window.removeEventListener('scalenix-file-drop', handler);
  }, [token]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ line: e.position.lineNumber, column: e.position.column });
    });
  };

  const updateContent = useCallback((value: string | undefined) => {
    if (!activeId || value === undefined) return;
    setFiles((prev) => prev.map((f) => f.id === activeId ? { ...f, content: value } : f));
  }, [activeId]);

  const newFile = useCallback(() => {
    const name = prompt('Nom du fichier :', 'sans-titre.txt');
    if (!name) return;
    const lang = detectLanguage(name);
    const tab: FileTab = { id: makeId(), name, content: '', language: lang };
    setFiles((prev) => [...prev, tab]);
    setActiveId(tab.id);
    setMenuOpen(false);
  }, []);

  const openFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '*/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const content = reader.result as string;
        const lang = detectLanguage(file.name);
        const tab: FileTab = { id: makeId(), name: file.name, content, language: lang };
        setFiles((prev) => [...prev, tab]);
        setActiveId(tab.id);
      };
      reader.readAsText(file);
    };
    input.click();
    setMenuOpen(false);
  }, []);

  const saveToFile = useCallback(() => {
    if (!activeFile) return;
    const blob = new Blob([activeFile.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
    setMenuOpen(false);
  }, [activeFile]);

  const closeTab = useCallback((id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (next.length === 0) {
        const welcome: FileTab = { id: makeId(), name: 'bienvenue.md', content: WELCOME_CONTENT, language: 'markdown' };
        setActiveId(welcome.id);
        return [welcome];
      }
      if (activeId === id) {
        const idx = prev.findIndex((f) => f.id === id);
        const newActive = next[Math.min(idx, next.length - 1)];
        setActiveId(newActive.id);
      }
      return next;
    });
    setMenuOpen(false);
  }, [activeId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveToFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        newFile();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeId) closeTab(activeId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [saveToFile, newFile, closeTab, activeId]);

  const lineCount = activeFile?.content.split('\n').length ?? 0;

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {/* Menu bar */}
      <div
        className="flex items-center gap-1 px-2 border-b text-xs"
        style={{ backgroundColor: colors.surface, borderColor: colors.border, height: 30 }}
      >
        <div className="relative" ref={menuRef}>
          <button
            className="px-2 py-1 rounded hover:brightness-125 transition-colors"
            style={{ backgroundColor: menuOpen ? colors.surfaceAlt : 'transparent', color: colors.textPrimary }}
            onClick={() => setMenuOpen((v) => !v)}
          >
            Fichier
          </button>
          {menuOpen && (
            <div
              className="absolute left-0 top-full mt-0.5 z-50 rounded-md border shadow-lg min-w-[180px] py-1"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <MenuItem label="Nouveau" shortcut="Ctrl+N" onClick={newFile} colors={colors} />
              <MenuItem label="Ouvrir" shortcut="" onClick={openFile} colors={colors} />
              <MenuItem label="Sauvegarder" shortcut="Ctrl+S" onClick={saveToFile} colors={colors} />
              <div className="my-1 border-t" style={{ borderColor: colors.border }} />
              <MenuItem label="Fermer onglet" shortcut="Ctrl+W" onClick={() => activeId && closeTab(activeId)} colors={colors} />
            </div>
          )}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex items-end gap-px overflow-x-auto border-b"
        style={{ backgroundColor: colors.surfaceAlt, borderColor: colors.border, minHeight: 32 }}
      >
        {files.map((f) => {
          const isActive = f.id === activeId;
          return (
            <div
              key={f.id}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer shrink-0 transition-colors"
              style={{
                backgroundColor: isActive ? colors.bg : 'transparent',
                color: isActive ? colors.textPrimary : colors.textSecondary,
                borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
              }}
              onClick={() => setActiveId(f.id)}
            >
              <span className="truncate max-w-[140px]">{f.name}</span>
              <button
                className="ml-1 rounded hover:bg-white/10 w-4 h-4 flex items-center justify-center text-[10px] leading-none"
                style={{ color: colors.textSecondary }}
                onClick={(e) => { e.stopPropagation(); closeTab(f.id); }}
                title="Fermer"
              >
                x
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        {activeFile && (
          <Editor
            key={activeFile.id}
            defaultValue={activeFile.content}
            language={activeFile.language}
            theme={monacoTheme}
            onChange={updateContent}
            onMount={handleEditorMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              wordWrap: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              padding: { top: 8 },
            }}
          />
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-3 text-[11px] border-t"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          color: colors.textSecondary,
          height: 24,
        }}
      >
        <div className="flex items-center gap-4">
          <span>{activeFile?.language ?? '-'}</span>
          <span>{lineCount} lignes</span>
        </div>
        <div>
          Ln {cursorPos.line}, Col {cursorPos.column}
        </div>
      </div>
    </div>
  );
}

function MenuItem({ label, shortcut, onClick, colors }: {
  label: string; shortcut: string; onClick: () => void;
  colors: { textPrimary: string; textSecondary: string; surfaceAlt: string };
}) {
  return (
    <button
      className="w-full flex items-center justify-between px-3 py-1.5 text-xs transition-colors hover:brightness-125"
      style={{ color: colors.textPrimary, backgroundColor: 'transparent' }}
      onMouseEnter={(e) => { (e.currentTarget.style.backgroundColor = colors.surfaceAlt); }}
      onMouseLeave={(e) => { (e.currentTarget.style.backgroundColor = 'transparent'); }}
      onClick={onClick}
    >
      <span>{label}</span>
      {shortcut && <span style={{ color: colors.textSecondary }}>{shortcut}</span>}
    </button>
  );
}
