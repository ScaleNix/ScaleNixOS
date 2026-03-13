import { useRef, useState, useEffect, useCallback } from 'react';
import type { AppManifest } from '../types/app.types';
import { useAuth } from '../auth/useAuth';
import { getZimbraPreauthUrl, isZimbraApp } from './zimbraPreauth';

interface IframeAppProps {
  app: AppManifest;
  token: string;
}

export function IframeApp({ app, token }: IframeAppProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { user } = useAuth();

  // Resolve app URL (preauth for Zimbra, token for LiveKit)
  useEffect(() => {
    if (isZimbraApp(app.id) && user?.email) {
      if (app.id === 'zimbra-calendar') {
        // For calendar: load preauth first, then navigate to calendar hash after session is set
        getZimbraPreauthUrl(user.email)
          .then((preauthUrl) => {
            // First load preauth to establish Zimbra session
            setResolvedUrl(preauthUrl);
            // After iframe loads and session cookie is set, navigate to calendar view
            setTimeout(() => {
              setResolvedUrl(`${import.meta.env.VITE_ZIMBRA_URL}/#702`);
            }, 3000);
          })
          .catch(() => setResolvedUrl(app.url ?? null));
      } else {
        getZimbraPreauthUrl(user.email)
          .then(setResolvedUrl)
          .catch(() => setResolvedUrl(app.url ?? null));
      }
    } else if (app.id === 'livekit-meet' && app.url && token) {
      const sep = app.url.includes('?') ? '&' : '?';
      setResolvedUrl(`${app.url}${sep}token=${encodeURIComponent(token)}`);
    } else {
      setResolvedUrl(app.url ?? null);
    }
  }, [app.id, app.url, user?.email, token]);

  const handleLoad = useCallback(() => {
    setLoading(false);
    setError(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Inject token via postMessage
    if (iframeRef.current?.contentWindow && resolvedUrl) {
      try {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SCALENIX_TOKEN', token },
          new URL(resolvedUrl).origin,
        );
      } catch {
        // cross-origin may block — SSO via shared cookies handles this
      }
    }
  }, [token, resolvedUrl]);

  const startTimeout = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (loading) setError(true);
    }, 15_000);
  }, [loading]);

  useEffect(() => {
    if (resolvedUrl) {
      startTimeout();
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startTimeout, resolvedUrl]);

  const retry = () => {
    setLoading(true);
    setError(false);
    if (isZimbraApp(app.id) && user?.email) {
      getZimbraPreauthUrl(user.email).then((url) => {
        if (app.id === 'zimbra-calendar') {
          setResolvedUrl(url);
          setTimeout(() => {
            const calUrl = `${import.meta.env.VITE_ZIMBRA_URL}/#702`;
            setResolvedUrl(calUrl);
            if (iframeRef.current) iframeRef.current.src = calUrl;
          }, 3000);
        } else {
          setResolvedUrl(url);
          if (iframeRef.current) iframeRef.current.src = url;
        }
      });
    } else if (iframeRef.current) {
      iframeRef.current.src = resolvedUrl ?? '';
    }
    startTimeout();
  };

  if (!app.url) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#64748b]">
        URL non configuree
      </div>
    );
  }

  if (!resolvedUrl) {
    return (
      <div className="flex h-full items-center justify-center gap-3 bg-[#111827]">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#4361ee] border-t-transparent" />
        <span className="text-sm text-[#64748b]">Preparation de {app.label}...</span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {loading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111827]">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#4361ee] border-t-transparent" />
          <span className="text-sm text-[#64748b]">Chargement de {app.label}...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-[#111827]">
          <span className="text-3xl">{app.icon}</span>
          <span className="text-sm text-[#e2e8f0]">Impossible de charger {app.label}</span>
          <button
            onClick={retry}
            className="rounded-lg bg-[#4361ee] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#3451de]"
          >
            Reessayer
          </button>
        </div>
      )}

      <iframe
        ref={iframeRef}
        src={resolvedUrl}
        sandbox={app.sandboxPolicy}
        allow="fullscreen; camera; microphone; display-capture"
        allowFullScreen
        onLoad={handleLoad}
        className="h-full w-full border-0"
        title={app.label}
      />
    </div>
  );
}
