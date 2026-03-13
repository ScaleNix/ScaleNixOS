import { useRef, useState, useEffect } from 'react';
import type { AppManifest } from '../types/app.types';

interface XpraAppProps {
  app: AppManifest;
  token: string;
}

export function XpraApp({ app }: Omit<XpraAppProps, 'token'> & { token?: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);

  // oauth2-proxy handles auth via cookies — no token param needed
  const xpraUrl = app.url ?? '';

  useEffect(() => {
    // Stop propagation of keyboard events when Xpra iframe is focused
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleFocus = () => {
      iframe.style.outline = 'none';
    };

    iframe.addEventListener('focus', handleFocus);
    return () => iframe.removeEventListener('focus', handleFocus);
  }, []);

  if (!xpraUrl) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#64748b]">
        URL Xpra non configuree
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {loading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111827]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1abc9c] border-t-transparent" />
          <span className="text-sm text-[#64748b]">Demarrage de {app.label}...</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={xpraUrl}
        allow="fullscreen; clipboard-read; clipboard-write"
        allowFullScreen
        onLoad={() => setLoading(false)}
        className="h-full w-full border-0"
        title={app.label}
      />
    </div>
  );
}
