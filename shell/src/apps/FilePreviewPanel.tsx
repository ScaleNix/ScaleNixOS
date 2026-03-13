import { useState, useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';
import { formatSize, formatDate, fileIcon, type WebDAVItem } from './webdav';

export interface PreviewFile {
  name: string;
  path: string;
  type: string;       // contentType
  size: number;
  lastModified: string;
  isDirectory?: boolean;
}

interface FilePreviewPanelProps {
  file: PreviewFile;
  token: string;
  username: string;
  onClose: () => void;
}

const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico']);
const TEXT_EXTS = new Set(['txt', 'md', 'csv', 'json', 'xml', 'yml', 'yaml', 'js', 'ts', 'py', 'sh', 'bash', 'html', 'css', 'go', 'rs', 'java']);
const VIDEO_EXTS = new Set(['mp4', 'webm']);
const AUDIO_EXTS = new Set(['mp3', 'ogg', 'wav', 'flac', 'aac', 'm4a']);

function getExt(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

type PreviewType = 'image' | 'text' | 'pdf' | 'video' | 'audio' | 'other';

function getPreviewType(name: string): PreviewType {
  const ext = getExt(name);
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (TEXT_EXTS.has(ext)) return 'text';
  if (ext === 'pdf') return 'pdf';
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  return 'other';
}

function buildWebDAVUrl(username: string, path: string): string {
  return `/webdav/files/${username}${path}`;
}

/** Syntax keyword highlights for text preview */
function highlightLine(line: string, ext: string): string {
  if (!['js', 'ts', 'py', 'json', 'html', 'css', 'go', 'rs', 'java', 'sh', 'bash'].includes(ext)) {
    return line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  let escaped = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Strings
  escaped = escaped.replace(/(["'`])(?:(?!\1|\\).|\\.)*?\1/g, '<span style="color:#a5d6ff">$&</span>');
  // Comments
  escaped = escaped.replace(/(\/\/.*)$/gm, '<span style="color:#6b7280">$&</span>');
  // Keywords
  const keywords = /\b(const|let|var|function|return|if|else|for|while|import|export|from|class|interface|type|async|await|def|fn|pub|struct|enum|match)\b/g;
  escaped = escaped.replace(keywords, '<span style="color:#ff7b72">$&</span>');
  // Numbers
  escaped = escaped.replace(/\b(\d+\.?\d*)\b/g, '<span style="color:#79c0ff">$&</span>');
  return escaped;
}

export function FilePreviewPanel({ file, token, username, onClose }: FilePreviewPanelProps) {
  const colors = useThemeStore((s) => s.colors);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState<string | null>(null);
  const [imgBlobUrl, setImgBlobUrl] = useState<string | null>(null);

  const previewType = getPreviewType(file.name);
  const ext = getExt(file.name);
  const webdavUrl = buildWebDAVUrl(username, file.path);

  // Fetch text content
  useEffect(() => {
    if (previewType !== 'text') return;
    setTextLoading(true);
    setTextError(null);
    setTextContent(null);

    fetch(webdavUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const text = await res.text();
        // Limit preview to 500 lines
        const lines = text.split('\n');
        setTextContent(lines.slice(0, 500).join('\n') + (lines.length > 500 ? '\n... (tronque)' : ''));
      })
      .catch((e) => setTextError(e.message))
      .finally(() => setTextLoading(false));

    return () => { setTextContent(null); };
  }, [webdavUrl, token, previewType]);

  // Fetch image as blob (needed for Bearer auth)
  useEffect(() => {
    if (previewType !== 'image') return;
    let revoked = false;

    fetch(webdavUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        const blob = await res.blob();
        if (!revoked) {
          setImgBlobUrl(URL.createObjectURL(blob));
        }
      })
      .catch(() => { /* handled by broken img */ });

    return () => {
      revoked = true;
      setImgBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [webdavUrl, token, previewType]);

  const handleDownload = () => {
    // Fetch with auth then trigger download
    fetch(webdavUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (res) => {
        if (!res.ok) return;
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  // Build a fake WebDAVItem for the icon helper
  const fakeItem: WebDAVItem = {
    name: file.name,
    path: file.path,
    isDirectory: file.isDirectory ?? false,
    size: file.size,
    lastModified: file.lastModified,
    contentType: file.type,
  };

  return (
    <div
      className="flex flex-col h-full w-72 shrink-0 border-l overflow-hidden"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b shrink-0"
        style={{ borderColor: colors.border, backgroundColor: colors.surfaceAlt }}
      >
        <span className="text-xs font-semibold truncate">Apercu</span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded-md text-sm hover:opacity-80 transition-opacity"
          style={{ color: colors.textSecondary }}
          title="Fermer"
        >
          {'\u2715'}
        </button>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-3">
        {/* File icon + name */}
        <div className="flex flex-col items-center gap-2 mb-4">
          <span className="text-4xl">{fileIcon(fakeItem)}</span>
          <span className="text-sm font-medium text-center break-all leading-tight">{file.name}</span>
        </div>

        {/* Preview content by type */}
        {previewType === 'image' && (
          <div className="mb-4 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
            {imgBlobUrl ? (
              <img
                src={imgBlobUrl}
                alt={file.name}
                className="w-full h-auto object-contain max-h-60"
              />
            ) : (
              <div className="flex items-center justify-center h-32" style={{ color: colors.textSecondary }}>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            )}
          </div>
        )}

        {previewType === 'text' && (
          <div className="mb-4">
            {textLoading && (
              <div className="flex items-center justify-center h-20" style={{ color: colors.textSecondary }}>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </div>
            )}
            {textError && (
              <div className="text-xs p-2 rounded" style={{ color: '#ef4444', backgroundColor: colors.surfaceAlt }}>
                Erreur de chargement : {textError}
              </div>
            )}
            {textContent !== null && (
              <pre
                className="text-[10px] leading-relaxed p-2 rounded-lg overflow-x-auto max-h-60 whitespace-pre-wrap break-all"
                style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
                dangerouslySetInnerHTML={{
                  __html: textContent.split('\n').map((l) => highlightLine(l, ext)).join('\n'),
                }}
              />
            )}
          </div>
        )}

        {previewType === 'pdf' && (
          <div
            className="mb-4 flex flex-col items-center gap-3 p-4 rounded-lg"
            style={{ backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}
          >
            <span className="text-3xl">{'\ud83d\udcc4'}</span>
            <span className="text-xs text-center" style={{ color: colors.textSecondary }}>
              Apercu PDF non disponible
            </span>
            <button
              onClick={handleDownload}
              className="rounded-lg px-4 py-1.5 text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: colors.accent }}
            >
              Telecharger le PDF
            </button>
          </div>
        )}

        {previewType === 'video' && (
          <div className="mb-4 rounded-lg overflow-hidden border" style={{ borderColor: colors.border }}>
            <video
              controls
              className="w-full"
              preload="metadata"
            >
              {/* Video needs auth; use fetch + blob */}
              <source src={webdavUrl} type={file.type || 'video/mp4'} />
              Lecture video non supportee
            </video>
          </div>
        )}

        {previewType === 'audio' && (
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}>
            <audio controls className="w-full" preload="metadata">
              <source src={webdavUrl} type={file.type || 'audio/mpeg'} />
              Lecture audio non supportee
            </audio>
          </div>
        )}

        {previewType === 'other' && (
          <div
            className="mb-4 flex flex-col items-center gap-2 p-4 rounded-lg"
            style={{ backgroundColor: colors.surfaceAlt, border: `1px solid ${colors.border}` }}
          >
            <span className="text-xs text-center" style={{ color: colors.textSecondary }}>
              Aucun apercu disponible pour ce type de fichier
            </span>
          </div>
        )}

        {/* File metadata */}
        <div className="space-y-2 text-xs">
          <h4 className="font-semibold text-[11px] uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            Informations
          </h4>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Type</span>
            <span className="truncate max-w-[140px]" style={{ color: colors.textPrimary }}>
              {file.type || ext.toUpperCase() || 'Inconnu'}
            </span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Taille</span>
            <span style={{ color: colors.textPrimary }}>{formatSize(file.size)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Modifie</span>
            <span style={{ color: colors.textPrimary }}>{formatDate(file.lastModified)}</span>
          </div>
          <div className="flex justify-between">
            <span style={{ color: colors.textSecondary }}>Chemin</span>
            <span className="truncate max-w-[140px] text-right" style={{ color: colors.textPrimary }}>
              {file.path}
            </span>
          </div>
        </div>
      </div>

      {/* Footer with download button */}
      <div className="shrink-0 p-3 border-t" style={{ borderColor: colors.border }}>
        <button
          onClick={handleDownload}
          className="w-full rounded-lg py-2 text-xs font-medium text-white transition-colors hover:opacity-90"
          style={{ backgroundColor: colors.accent }}
        >
          Telecharger
        </button>
      </div>
    </div>
  );
}
