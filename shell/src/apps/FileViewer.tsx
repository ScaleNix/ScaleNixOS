import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../auth/useAuth';
import { useWindowStore } from '../store/windowStore';
import { marked } from 'marked';
import type { WindowState } from '../types/app.types';

interface FileViewerProps {
  win: WindowState;
}

export function FileViewer({ win }: FileViewerProps) {
  const { token } = useAuth();
  const viewer = win.fileViewer;

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!viewer?.siblings) return 0;
    return viewer.siblings.findIndex((s) => s.url === viewer.fileUrl);
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const videoRef = useRef<HTMLVideoElement>(null);

  const siblings = viewer?.siblings ?? (viewer ? [{ url: viewer.fileUrl, name: viewer.fileName, type: viewer.fileType }] : []);
  const current = siblings[currentIndex] ?? siblings[0];

  if (!viewer || !current) {
    return (
      <div className="flex h-full items-center justify-center bg-[#0a0a0f] text-sm text-[#64748b]">
        Aucun fichier a afficher
      </div>
    );
  }

  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < siblings.length - 1;

  const fileUrl = current.url;
  const fileName = current.name;
  const fileType = current.type;

  // Fetch file with auth header
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setBlobUrl(null);
    setTextContent(null);
    setLoading(true);
    setError(false);

    const headers: HeadersInit = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(fileUrl, { headers })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        if (cancelled) return;
        if (fileType === 'markdown') {
          const text = await res.text();
          setTextContent(text);
        } else {
          const blob = await res.blob();
          setBlobUrl(URL.createObjectURL(blob));
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError(true);
        }
      });

    return () => {
      cancelled = true;
      setBlobUrl((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
    };
  }, [fileUrl, fileType, token]);

  const markdownHtml = useMemo(() => {
    if (fileType !== 'markdown' || !textContent) return '';
    return marked.parse(textContent) as string;
  }, [fileType, textContent]);

  const authedUrl = blobUrl ?? fileUrl;

  const goTo = (idx: number) => {
    if (idx < 0 || idx >= siblings.length) return;
    setCurrentIndex(idx);
    setLoading(true);
    setError(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });

    // Update window title
    const winState = useWindowStore.getState();
    const sib = siblings[idx];
    useWindowStore.setState({
      windows: winState.windows.map((w) =>
        w.id === win.id ? { ...w, title: sib.name } : w,
      ),
    });
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Check if this window is active
      const active = useWindowStore.getState().activeWindowId;
      if (active !== win.id) return;

      if (e.key === 'ArrowLeft' && hasPrev) {
        e.preventDefault();
        goTo(currentIndex - 1);
      } else if (e.key === 'ArrowRight' && hasNext) {
        e.preventDefault();
        goTo(currentIndex + 1);
      } else if (e.key === '+' || e.key === '=') {
        setZoom((z) => Math.min(z * 1.25, 5));
      } else if (e.key === '-') {
        setZoom((z) => Math.max(z / 1.25, 0.1));
      } else if (e.key === '0') {
        setZoom(1);
        setPan({ x: 0, y: 0 });
      }
    },
    [win.id, currentIndex, hasPrev, hasNext],
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleWheel = (e: React.WheelEvent) => {
    if (fileType !== 'image') return;
    e.stopPropagation();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((z) => Math.min(Math.max(z * delta, 0.1), 5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (fileType !== 'image' || zoom <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: dragStart.current.panX + e.clientX - dragStart.current.x,
      y: dragStart.current.panY + e.clientY - dragStart.current.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);


  return (
    <div className="flex h-full flex-col bg-[#0a0a0f] text-[#e2e8f0] select-none">
      {/* Content area */}
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: fileType === 'image' && zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
      >
        {/* Loading spinner */}
        {loading && !error && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0f]">
            <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#4361ee] border-t-transparent" />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#0a0a0f]">
            <span className="text-4xl opacity-50">&#x26A0;</span>
            <span className="text-sm text-[#64748b]">Impossible de charger le fichier</span>
            <button
              onClick={() => { setError(false); setLoading(true); }}
              className="rounded-lg bg-[#4361ee] px-4 py-1.5 text-xs font-medium text-white hover:bg-[#3451de]"
            >
              Reessayer
            </button>
          </div>
        )}

        {/* Image viewer */}
        {fileType === 'image' && (
          <img
            key={fileUrl}
            src={authedUrl}
            alt={fileName}
            draggable={false}
            className="max-h-full max-w-full object-contain transition-transform duration-100"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              display: loading ? 'none' : 'block',
            }}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}

        {/* Video player */}
        {fileType === 'video' && (
          <video
            key={fileUrl}
            ref={videoRef}
            src={authedUrl}
            controls
            autoPlay
            className="max-h-full max-w-full"
            style={{ display: loading ? 'none' : 'block' }}
            onLoadedData={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}

        {/* Audio player */}
        {fileType === 'audio' && (
          <div className="flex flex-col items-center gap-6">
            <div className="flex h-32 w-32 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4361ee]/30 to-[#7c3aed]/30 shadow-lg">
              <span className="text-6xl">&#127925;</span>
            </div>
            <span className="max-w-[300px] truncate text-sm font-medium text-[#94a3b8]">{fileName}</span>
            <audio
              key={fileUrl}
              src={authedUrl}
              controls
              autoPlay
              className="w-80"
              onLoadedData={() => setLoading(false)}
              onError={() => { setLoading(false); setError(true); }}
            />
          </div>
        )}

        {/* PDF viewer */}
        {fileType === 'pdf' && (
          <iframe
            key={fileUrl}
            src={authedUrl}
            className="h-full w-full border-0"
            title={fileName}
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
          />
        )}

        {/* Markdown / Text viewer */}
        {fileType === 'markdown' && textContent && (
          <div className="h-full w-full overflow-auto p-8">
            <div
              className="md-viewer mx-auto max-w-3xl text-sm leading-relaxed text-[#cbd5e1]"
              dangerouslySetInnerHTML={{ __html: markdownHtml }}
            />
          </div>
        )}

        {/* Navigation arrows */}
        {siblings.length > 1 && (
          <>
            {hasPrev && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex - 1); }}
                className="absolute left-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white hover:scale-110"
                title="Precedent"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
            {hasNext && (
              <button
                onClick={(e) => { e.stopPropagation(); goTo(currentIndex + 1); }}
                className="absolute right-3 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white/80 backdrop-blur-sm transition-all hover:bg-black/80 hover:text-white hover:scale-110"
                title="Suivant"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Bottom toolbar */}
      <div className="flex h-9 shrink-0 items-center justify-between border-t border-[#1e1e2e] bg-[#111119] px-3">
        <div className="flex items-center gap-2">
          {/* File counter */}
          {siblings.length > 1 && (
            <span className="text-[11px] text-[#64748b]">
              {currentIndex + 1} / {siblings.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom controls (images only) */}
          {fileType === 'image' && (
            <>
              <button
                onClick={() => setZoom((z) => Math.max(z / 1.25, 0.1))}
                className="viewer-btn"
                title="Zoom arriere"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
              <button
                onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
                className="rounded px-1.5 py-0.5 text-[11px] text-[#94a3b8] hover:bg-[#1f2937]"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button
                onClick={() => setZoom((z) => Math.min(z * 1.25, 5))}
                className="viewer-btn"
                title="Zoom avant"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3V11M3 7H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
              <div className="mx-1.5 h-4 w-px bg-[#1e1e2e]" />
            </>
          )}

        </div>
      </div>

      <style>{`
        .viewer-btn {
          display: flex; align-items: center; justify-content: center;
          width: 26px; height: 26px; border-radius: 6px;
          color: #94a3b8; transition: all 150ms;
        }
        .viewer-btn:hover { background-color: #1f2937; color: #e2e8f0; }
        .md-viewer h1 { font-size: 1.75em; font-weight: 700; color: #e2e8f0; margin: 1.2em 0 0.6em; border-bottom: 1px solid #2a2a3e; padding-bottom: 0.3em; }
        .md-viewer h2 { font-size: 1.4em; font-weight: 600; color: #e2e8f0; margin: 1em 0 0.5em; }
        .md-viewer h3 { font-size: 1.15em; font-weight: 600; color: #e2e8f0; margin: 0.8em 0 0.4em; }
        .md-viewer p { margin: 0.6em 0; }
        .md-viewer a { color: #4361ee; text-decoration: underline; }
        .md-viewer a:hover { color: #6b8aff; }
        .md-viewer code { background: #1e1e2e; color: #f472b6; padding: 0.15em 0.4em; border-radius: 4px; font-size: 0.9em; }
        .md-viewer pre { background: #1e1e2e; border: 1px solid #2a2a3e; border-radius: 8px; padding: 1em; overflow-x: auto; margin: 0.8em 0; }
        .md-viewer pre code { background: none; color: #cbd5e1; padding: 0; }
        .md-viewer blockquote { border-left: 3px solid #4361ee80; padding: 0.4em 1em; margin: 0.8em 0; color: #94a3b8; background: #1e1e2e40; border-radius: 0 6px 6px 0; }
        .md-viewer ul, .md-viewer ol { padding-left: 1.5em; margin: 0.5em 0; }
        .md-viewer li { margin: 0.25em 0; }
        .md-viewer ul li { list-style-type: disc; }
        .md-viewer ol li { list-style-type: decimal; }
        .md-viewer strong { color: #e2e8f0; }
        .md-viewer hr { border: none; border-top: 1px solid #2a2a3e; margin: 1.5em 0; }
        .md-viewer table { border-collapse: collapse; width: 100%; margin: 0.8em 0; }
        .md-viewer th, .md-viewer td { border: 1px solid #2a2a3e; padding: 0.5em 0.8em; text-align: left; }
        .md-viewer th { background: #1e1e2e; color: #e2e8f0; font-weight: 600; }
        .md-viewer img { max-width: 100%; border-radius: 8px; margin: 0.5em 0; }
      `}</style>
    </div>
  );
}
