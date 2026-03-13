import { useEffect, useState, useCallback, useRef } from 'react';
import { useLockStore } from '../store/lockStore';
import { useThemeStore } from '../store/themeStore';
import { useAuth } from '../auth/useAuth';

export default function LockScreen() {
  const { locked, unlock, lock, idleTimeout } = useLockStore();
  const accent = useThemeStore((s) => s.colors.accent);
  const { user } = useAuth();

  const [now, setNow] = useState(() => new Date());
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --------------- clock tick ---------------
  useEffect(() => {
    if (!locked) return;
    const id = setInterval(() => setNow(new Date()), 1_000);
    return () => clearInterval(id);
  }, [locked]);

  // --------------- fade-in on lock ---------------
  useEffect(() => {
    if (locked) {
      setFadingOut(false);
      // Small RAF delay so the opacity transition triggers
      requestAnimationFrame(() => setVisible(true));
    }
  }, [locked]);

  // --------------- idle auto-lock ---------------
  useEffect(() => {
    if (locked) return; // already locked, skip idle tracking

    const timeoutMs = idleTimeout * 60 * 1_000;
    if (timeoutMs <= 0) return; // disabled

    const resetTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => lock(), timeoutMs);
    };

    const events: (keyof WindowEventMap)[] = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer, { passive: true }));

    // Start the timer immediately
    resetTimer();

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [locked, idleTimeout, lock]);

  // --------------- unlock handler ---------------
  const handleUnlock = useCallback(() => {
    setFadingOut(true);
    // Wait for fade-out animation, then actually unlock
    setTimeout(() => {
      setVisible(false);
      setFadingOut(false);
      unlock();
    }, 400);
  }, [unlock]);

  if (!locked) return null;

  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');

  const dateStr = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  // Capitalise first letter
  const dateDisplay = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleUnlock}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleUnlock();
      }}
      className="fixed inset-0 flex cursor-pointer select-none flex-col items-center justify-center transition-opacity duration-500"
      style={{
        zIndex: 9999,
        opacity: visible && !fadingOut ? 1 : 0,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
      }}
    >
      {/* Clock */}
      <div
        className="font-extralight tracking-wider"
        style={{ fontSize: 'clamp(5rem, 14vw, 10rem)', lineHeight: 1, color: '#fff' }}
      >
        {hours}
        <span style={{ opacity: now.getSeconds() % 2 === 0 ? 1 : 0.3 }}>:</span>
        {minutes}
      </div>

      {/* Date */}
      <p className="mt-2 text-lg font-light tracking-wide" style={{ color: 'rgba(255,255,255,0.7)' }}>
        {dateDisplay}
      </p>

      {/* User */}
      <div className="mt-10 flex flex-col items-center gap-3">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-semibold text-white"
          style={{
            background: `linear-gradient(135deg, ${accent}, ${accent}99)`,
            boxShadow: `0 0 24px ${accent}44`,
          }}
        >
          {initials}
        </div>
        <span className="text-base font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
          {user?.name ?? user?.preferred_username ?? 'Utilisateur'}
        </span>
      </div>

      {/* Unlock hint */}
      <p
        className="absolute bottom-12 animate-pulse text-sm font-light tracking-widest uppercase"
        style={{ color: 'rgba(255,255,255,0.45)' }}
      >
        Cliquez pour d&eacute;verrouiller
      </p>
    </div>
  );
}
