import { useRef, useState, useEffect, useCallback } from 'react';
import { useThemeStore } from '../store/themeStore';
import { useScreenshotStore } from '../store/screenshotStore';

type Tool = 'draw' | 'rectangle' | 'arrow' | 'text';
type ViewMode = 'screenshot' | 'recorder';

interface Annotation {
  tool: Tool;
  color: string;
  /** Freehand: array of [x,y] pairs */
  points?: [number, number][];
  /** Rectangle / Arrow / Text: start + end */
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
  /** Text content */
  text?: string;
}

const COLORS = [
  { label: 'Red', value: '#ef4444' },
  { label: 'Blue', value: '#3b82f6' },
  { label: 'Green', value: '#22c55e' },
  { label: 'Yellow', value: '#eab308' },
  { label: 'White', value: '#ffffff' },
  { label: 'Black', value: '#000000' },
];

const TOOLS: { id: Tool; label: string; icon: string }[] = [
  { id: 'draw', label: 'Draw', icon: '✏️' },
  { id: 'rectangle', label: 'Rectangle', icon: '▭' },
  { id: 'arrow', label: 'Arrow', icon: '➜' },
  { id: 'text', label: 'Text', icon: 'T' },
];

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/* ───────────────────────── Screen Recorder Sub-component ───────────────────────── */

function ScreenRecorder() {
  const colors = useThemeStore((s) => s.colors);
  const {
    isRecording,
    recordingDuration,
    lastRecording,
    startRecording,
    stopRecording,
    setRecordingDuration,
    setLastRecording,
  } = useScreenshotStore();

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update video src when recording is available
  useEffect(() => {
    if (lastRecording && videoRef.current) {
      videoRef.current.src = lastRecording;
    }
  }, [lastRecording]);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 },
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? 'video/webm;codecs=vp9,opus'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
          ? 'video/webm;codecs=vp8,opus'
          : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setLastRecording(url);
        stopRecording();
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        }
      };

      // Handle user stopping share via browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      };

      recorder.start(1000); // collect data every second
      startRecording();

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingDuration(useScreenshotStore.getState().recordingDuration + 1);
      }, 1000);
    } catch {
      // User cancelled the screen picker or permission denied
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownload = () => {
    if (!lastRecording) return;
    const link = document.createElement('a');
    link.download = `recording-${Date.now()}.webm`;
    link.href = lastRecording;
    link.click();
  };

  const handleDiscard = () => {
    if (lastRecording) {
      URL.revokeObjectURL(lastRecording);
    }
    setLastRecording(null);
  };

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6">
      {/* Recording indicator */}
      {isRecording && (
        <div
          className="flex items-center gap-3 rounded-lg px-5 py-3"
          style={{ backgroundColor: colors.surface, border: `1px solid ${colors.border}` }}
        >
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              backgroundColor: '#ef4444',
              boxShadow: '0 0 8px #ef4444',
              animation: 'pulse 1s ease-in-out infinite',
            }}
          />
          <span className="text-lg font-mono font-semibold" style={{ color: colors.textPrimary }}>
            {formatDuration(recordingDuration)}
          </span>
          <span className="text-sm" style={{ color: colors.textSecondary }}>
            Enregistrement en cours...
          </span>
        </div>
      )}

      {/* Video preview */}
      {lastRecording && !isRecording && (
        <div className="flex w-full max-w-3xl flex-col items-center gap-3">
          <video
            ref={videoRef}
            controls
            className="w-full rounded-lg"
            style={{ border: `1px solid ${colors.border}`, maxHeight: 400 }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="rounded px-4 py-1.5 text-sm font-medium transition-colors"
              style={{ backgroundColor: colors.accent, color: '#fff' }}
            >
              Telecharger (.webm)
            </button>
            <button
              onClick={handleDiscard}
              className="rounded px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: colors.surfaceAlt,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
              }}
            >
              Supprimer
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      {!isRecording && !lastRecording && (
        <div className="flex flex-col items-center gap-4">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-full text-4xl"
            style={{ backgroundColor: colors.surfaceAlt, border: `2px solid ${colors.border}` }}
          >
            🎬
          </div>
          <p className="text-sm" style={{ color: colors.textSecondary }}>
            Capturez votre ecran en video
          </p>
          <button
            onClick={handleStartRecording}
            className="rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#ef4444', color: '#fff' }}
          >
            Enregistrer l'ecran
          </button>
        </div>
      )}

      {/* Stop button when recording */}
      {isRecording && (
        <button
          onClick={handleStopRecording}
          className="rounded-lg px-6 py-2 text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#ef4444', color: '#fff' }}
        >
          Arreter l'enregistrement
        </button>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

/* ───────────────────────── Main ScreenCapture Component ───────────────────────── */

export function ScreenCapture() {
  const colors = useThemeStore((s) => s.colors);
  const lastCapture = useScreenshotStore((s) => s.lastCapture);
  const isRecording = useScreenshotStore((s) => s.isRecording);
  const lastRecording = useScreenshotStore((s) => s.lastRecording);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('screenshot');
  const [activeTool, setActiveTool] = useState<Tool>('draw');
  const [activeColor, setActiveColor] = useState('#ef4444');
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [current, setCurrent] = useState<Annotation | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');

  // Auto-switch to recorder view when recording starts or has a recording
  useEffect(() => {
    if (isRecording || lastRecording) {
      setViewMode('recorder');
    }
  }, [isRecording, lastRecording]);

  // Load the screenshot image
  useEffect(() => {
    if (!lastCapture) return;
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.src = lastCapture;
  }, [lastCapture]);

  // Render canvas
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const container = containerRef.current;
    if (!container) return;

    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw;
    canvas.height = ch;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate scale to fit image in canvas
    const scale = Math.min(cw / img.width, ch / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const offsetX = (cw - drawW) / 2;
    const offsetY = (ch - drawH) / 2;

    ctx.clearRect(0, 0, cw, ch);
    ctx.fillStyle = '#111';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

    // Draw all annotations
    const allAnnotations = current ? [...annotations, current] : annotations;
    for (const ann of allAnnotations) {
      ctx.strokeStyle = ann.color;
      ctx.fillStyle = ann.color;
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (ann.tool === 'draw' && ann.points && ann.points.length > 1) {
        ctx.beginPath();
        ctx.moveTo(ann.points[0][0], ann.points[0][1]);
        for (let i = 1; i < ann.points.length; i++) {
          ctx.lineTo(ann.points[i][0], ann.points[i][1]);
        }
        ctx.stroke();
      } else if (ann.tool === 'rectangle' && ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
        ctx.strokeRect(
          Math.min(ann.x1, ann.x2),
          Math.min(ann.y1, ann.y2),
          Math.abs(ann.x2 - ann.x1),
          Math.abs(ann.y2 - ann.y1),
        );
      } else if (ann.tool === 'arrow' && ann.x1 != null && ann.y1 != null && ann.x2 != null && ann.y2 != null) {
        drawArrow(ctx, ann.x1, ann.y1, ann.x2, ann.y2);
      } else if (ann.tool === 'text' && ann.text && ann.x1 != null && ann.y1 != null) {
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(ann.text, ann.x1, ann.y1);
      }
    }
  }, [annotations, current]);

  useEffect(() => {
    if (imageLoaded) render();
  }, [imageLoaded, render]);

  // Re-render on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const obs = new ResizeObserver(() => render());
    obs.observe(container);
    return () => obs.disconnect();
  }, [render]);

  function drawArrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    const headLen = 14;
    const angle = Math.atan2(y2 - y1, x2 - x1);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();
  }

  function getCanvasPos(e: React.MouseEvent): [number, number] {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    const [x, y] = getCanvasPos(e);

    if (activeTool === 'text') {
      setTextInput({ x, y });
      setTextValue('');
      return;
    }

    if (activeTool === 'draw') {
      setCurrent({ tool: 'draw', color: activeColor, points: [[x, y]] });
    } else {
      setCurrent({ tool: activeTool, color: activeColor, x1: x, y1: y, x2: x, y2: y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!current) return;
    const [x, y] = getCanvasPos(e);

    if (current.tool === 'draw') {
      setCurrent((prev) => prev ? { ...prev, points: [...(prev.points || []), [x, y]] } : prev);
    } else {
      setCurrent((prev) => prev ? { ...prev, x2: x, y2: y } : prev);
    }
    render();
  };

  const handleMouseUp = () => {
    if (current) {
      setAnnotations((prev) => [...prev, current]);
      setCurrent(null);
    }
  };

  const confirmText = () => {
    if (textInput && textValue.trim()) {
      setAnnotations((prev) => [
        ...prev,
        { tool: 'text', color: activeColor, x1: textInput.x, y1: textInput.y, text: textValue.trim() },
      ]);
    }
    setTextInput(null);
    setTextValue('');
  };

  const handleUndo = () => {
    setAnnotations((prev) => prev.slice(0, -1));
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `screenshot-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopy = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      }
    } catch {
      // Clipboard API may fail in some contexts
    }
  };

  // Tab bar for switching between screenshot and recorder
  const renderTabBar = () => (
    <div
      className="flex items-center border-b"
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <button
        onClick={() => setViewMode('screenshot')}
        className="px-4 py-2 text-xs font-medium transition-colors"
        style={{
          backgroundColor: viewMode === 'screenshot' ? colors.bg : 'transparent',
          color: viewMode === 'screenshot' ? colors.accent : colors.textSecondary,
          borderBottom: viewMode === 'screenshot' ? `2px solid ${colors.accent}` : '2px solid transparent',
        }}
      >
        📸 Capture d'ecran
      </button>
      <button
        onClick={() => setViewMode('recorder')}
        className="relative px-4 py-2 text-xs font-medium transition-colors"
        style={{
          backgroundColor: viewMode === 'recorder' ? colors.bg : 'transparent',
          color: viewMode === 'recorder' ? colors.accent : colors.textSecondary,
          borderBottom: viewMode === 'recorder' ? `2px solid ${colors.accent}` : '2px solid transparent',
        }}
      >
        🎬 Enregistrer l'ecran
        {isRecording && (
          <span
            className="ml-1.5 inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: '#ef4444', animation: 'pulse 1s ease-in-out infinite' }}
          />
        )}
      </button>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );

  if (viewMode === 'recorder') {
    return (
      <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
        {renderTabBar()}
        <div className="flex-1 overflow-auto">
          <ScreenRecorder />
        </div>
      </div>
    );
  }

  if (!lastCapture) {
    return (
      <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
        {renderTabBar()}
        <div className="flex flex-1 items-center justify-center" style={{ color: colors.textSecondary }}>
          No screenshot captured yet. Use the capture shortcut to take a screenshot.
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: colors.bg, color: colors.textPrimary }}>
      {renderTabBar()}
      {/* Toolbar */}
      <div
        className="flex items-center gap-1 px-3 py-1.5 border-b flex-wrap"
        style={{ backgroundColor: colors.surface, borderColor: colors.border }}
      >
        {/* Tool buttons */}
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            title={tool.label}
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeTool === tool.id ? colors.accent : colors.surfaceAlt,
              color: activeTool === tool.id ? '#fff' : colors.textPrimary,
              border: `1px solid ${colors.border}`,
            }}
          >
            <span>{tool.icon}</span>
            <span>{tool.label}</span>
          </button>
        ))}

        <div className="mx-1 h-5 w-px" style={{ backgroundColor: colors.border }} />

        {/* Color picker */}
        {COLORS.map((c) => (
          <button
            key={c.value}
            onClick={() => setActiveColor(c.value)}
            title={c.label}
            className="h-5 w-5 rounded-full transition-transform"
            style={{
              backgroundColor: c.value,
              border: activeColor === c.value ? `2px solid ${colors.accent}` : `1px solid ${colors.border}`,
              transform: activeColor === c.value ? 'scale(1.2)' : undefined,
            }}
          />
        ))}

        <div className="mx-1 h-5 w-px" style={{ backgroundColor: colors.border }} />

        {/* Action buttons */}
        <button
          onClick={handleUndo}
          disabled={annotations.length === 0}
          className="rounded px-2 py-1 text-xs font-medium transition-colors disabled:opacity-40"
          style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
        >
          Undo
        </button>
        <button
          onClick={handleSave}
          className="rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ backgroundColor: colors.accent, color: '#fff' }}
        >
          Save
        </button>
        <button
          onClick={handleCopy}
          className="rounded px-2 py-1 text-xs font-medium transition-colors"
          style={{ backgroundColor: colors.surfaceAlt, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
        >
          Copy
        </button>
      </div>

      {/* Canvas area */}
      <div ref={containerRef} className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: activeTool === 'text' ? 'text' : 'crosshair' }}
        />
        {/* Text input overlay */}
        {textInput && (
          <div
            className="absolute"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              autoFocus
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmText();
                if (e.key === 'Escape') { setTextInput(null); setTextValue(''); }
              }}
              onBlur={confirmText}
              className="rounded px-1 py-0.5 text-sm outline-none"
              style={{
                backgroundColor: `${colors.surface}dd`,
                color: activeColor,
                border: `1px solid ${colors.border}`,
                minWidth: 100,
                fontWeight: 'bold',
              }}
              placeholder="Type text..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
