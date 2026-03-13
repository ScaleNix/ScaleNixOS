import { useState, useCallback, useEffect } from 'react';
import { useThemeStore, THEME_PRESETS } from '../store/themeStore';

const STORAGE_KEY = 'scalenix-onboarding-done';

interface StepProps {
  accent: string;
}

/* ---------- Step components ---------- */

function StepWelcome({ accent }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div
        className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl shadow-lg"
        style={{ background: `${accent}22`, border: `2px solid ${accent}44` }}
      >
        <svg viewBox="0 0 48 48" width="56" height="56" fill="none">
          <rect x="4" y="8" width="40" height="28" rx="4" stroke={accent} strokeWidth="2.5" />
          <rect x="16" y="36" width="16" height="4" rx="1" fill={accent} opacity={0.5} />
          <circle cx="24" cy="22" r="6" fill={accent} opacity={0.7} />
        </svg>
      </div>
      <h2 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>
        Bienvenue sur ScaleNixOS
      </h2>
      <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Votre bureau web intelligent, concu pour la productivite et la collaboration.
        Decouvrons ensemble les fonctionnalites essentielles en quelques etapes.
      </p>
    </div>
  );
}

function StepDesktop({ accent }: StepProps) {
  const items = [
    { icon: '🖱️', label: 'Double-clic', desc: 'Ouvrir une application ou un fichier' },
    { icon: '📋', label: 'Clic droit', desc: 'Afficher le menu contextuel' },
    { icon: '📁', label: 'Glisser-deposer', desc: 'Deplacer des fichiers sur le bureau' },
  ];
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
        Votre bureau
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Le bureau est votre espace de travail principal. Vous pouvez y placer des raccourcis
        vers vos fichiers et applications favorites.
      </p>
      <div className="grid gap-3 w-full max-w-sm mt-2">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-4 rounded-xl px-4 py-3 text-left"
            style={{ background: `${accent}10`, border: `1px solid ${accent}22` }}
          >
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="font-semibold text-sm" style={{ color: 'var(--theme-text)' }}>{item.label}</div>
              <div className="text-xs" style={{ color: 'var(--theme-text2)' }}>{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTaskbar({ accent }: StepProps) {
  const features = [
    { icon: '🚀', label: 'Launcher', desc: 'Acces rapide a toutes vos applications' },
    { icon: '🔄', label: 'Bascule', desc: 'Basculer entre les fenetres ouvertes' },
    { icon: '🔔', label: 'Notifications', desc: 'Restez informe en temps reel' },
    { icon: '⚙️', label: 'Parametres systeme', desc: 'Horloge, volume, Wi-Fi, batterie' },
  ];
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
        La barre des taches
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Situee en bas de l'ecran, elle vous permet de naviguer entre vos applications
        et d'acceder aux outils systeme.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
        {features.map((f) => (
          <div
            key={f.label}
            className="flex flex-col items-center gap-2 rounded-xl px-3 py-4"
            style={{ background: `${accent}10`, border: `1px solid ${accent}22` }}
          >
            <span className="text-2xl">{f.icon}</span>
            <div className="font-semibold text-xs" style={{ color: 'var(--theme-text)' }}>{f.label}</div>
            <div className="text-[11px] leading-tight" style={{ color: 'var(--theme-text2)' }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepApps({ accent }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
        Applications
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Ouvrez le Launcher pour decouvrir toutes les applications disponibles.
      </p>
      <div className="flex flex-col gap-3 w-full max-w-sm mt-2">
        <div
          className="flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: `${accent}10`, border: `1px solid ${accent}22` }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: `${accent}33`, color: accent }}
          >
            ⌘
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm" style={{ color: 'var(--theme-text)' }}>Meta + Espace</div>
            <div className="text-xs" style={{ color: 'var(--theme-text2)' }}>Ouvrir / fermer le Launcher</div>
          </div>
        </div>
        <div
          className="flex items-center gap-4 rounded-xl px-4 py-3"
          style={{ background: `${accent}10`, border: `1px solid ${accent}22` }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
            style={{ background: `${accent}33`, color: accent }}
          >
            🔍
          </div>
          <div className="text-left">
            <div className="font-semibold text-sm" style={{ color: 'var(--theme-text)' }}>Ctrl + K</div>
            <div className="text-xs" style={{ color: 'var(--theme-text2)' }}>Recherche Spotlight rapide</div>
          </div>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--theme-text2)' }}>
          Vous pouvez aussi double-cliquer sur le bureau ou cliquer sur le bouton Launcher dans la barre des taches.
        </p>
      </div>
    </div>
  );
}

function StepShortcuts({ accent }: StepProps) {
  const shortcuts = [
    { keys: 'Alt + Tab', desc: 'Basculer entre les fenetres' },
    { keys: 'Ctrl + K', desc: 'Spotlight / recherche rapide' },
    { keys: 'Meta + Espace', desc: 'Ouvrir le Launcher' },
    { keys: 'Ctrl + Shift + V', desc: 'Historique du presse-papiers' },
    { keys: 'Ctrl + Alt + L', desc: 'Verrouiller l\'ecran' },
    { keys: 'Ctrl + Alt + 1-9', desc: 'Changer d\'espace de travail' },
  ];
  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
        Raccourcis clavier
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Gagnez du temps avec ces raccourcis essentiels.
      </p>
      <div className="w-full max-w-sm mt-2 space-y-2">
        {shortcuts.map((s) => (
          <div
            key={s.keys}
            className="flex items-center justify-between rounded-lg px-4 py-2.5"
            style={{ background: `${accent}10`, border: `1px solid ${accent}15` }}
          >
            <span
              className="text-xs font-mono font-semibold px-2 py-1 rounded"
              style={{ background: `${accent}22`, color: accent }}
            >
              {s.keys}
            </span>
            <span className="text-xs" style={{ color: 'var(--theme-text2)' }}>{s.desc}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepTheme({ accent }: StepProps) {
  const setTheme = useThemeStore((s) => s.setTheme);
  const currentId = useThemeStore((s) => s.themeId);
  const presets = THEME_PRESETS.slice(0, 4); // Show first 4 themes

  return (
    <div className="flex flex-col items-center text-center gap-5">
      <h2 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
        Personnalisation
      </h2>
      <p className="text-sm max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Choisissez un theme pour personnaliser votre bureau. Vous pourrez le modifier
        a tout moment dans les parametres.
      </p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-2">
        {presets.map((preset) => {
          const selected = currentId === preset.id;
          return (
            <button
              key={preset.id}
              onClick={() => setTheme(preset.id)}
              className="relative flex flex-col items-center gap-2 rounded-xl px-3 py-4 transition-all duration-200 cursor-pointer"
              style={{
                background: selected ? `${preset.colors.accent}22` : `${accent}08`,
                border: selected ? `2px solid ${preset.colors.accent}` : `1px solid ${accent}22`,
                transform: selected ? 'scale(1.03)' : 'scale(1)',
              }}
            >
              <div className="flex gap-1.5">
                {[preset.colors.bg, preset.colors.surface, preset.colors.accent].map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded-full border"
                    style={{ background: c, borderColor: `${c}88` }}
                  />
                ))}
              </div>
              <span className="text-xs font-semibold" style={{ color: selected ? preset.colors.accent : 'var(--theme-text)' }}>
                {preset.name}
              </span>
              {selected && (
                <div
                  className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: preset.colors.accent, color: '#fff' }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReady({ accent }: StepProps) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-4xl"
        style={{ background: `${accent}22`, border: `2px solid ${accent}44` }}
      >
        🚀
      </div>
      <h2 className="text-3xl font-bold" style={{ color: 'var(--theme-text)' }}>
        C'est parti !
      </h2>
      <p className="text-base leading-relaxed max-w-md" style={{ color: 'var(--theme-text2)' }}>
        Votre bureau est pret. Explorez les applications, personnalisez votre espace
        et commencez a travailler. Bonne decouverte !
      </p>
    </div>
  );
}

/* ---------- Main Onboarding component ---------- */

const STEPS = [
  { id: 'welcome', Component: StepWelcome },
  { id: 'desktop', Component: StepDesktop },
  { id: 'taskbar', Component: StepTaskbar },
  { id: 'apps', Component: StepApps },
  { id: 'shortcuts', Component: StepShortcuts },
  { id: 'theme', Component: StepTheme },
  { id: 'ready', Component: StepReady },
];

export function Onboarding() {
  const accent = useThemeStore((s) => s.colors.accent);
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [animating, setAnimating] = useState(false);

  // Check if onboarding was already completed
  const done = localStorage.getItem(STORAGE_KEY) === '1';
  const [dismissed, setDismissed] = useState(done);

  // Fade in on mount
  useEffect(() => {
    if (!dismissed) {
      requestAnimationFrame(() => setVisible(true));
    }
  }, [dismissed]);

  const finish = useCallback(() => {
    setFadingOut(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, '1');
      setDismissed(true);
    }, 350);
  }, []);

  const goTo = useCallback((target: number, dir: 'next' | 'prev') => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setStep(target);
      setAnimating(false);
    }, 200);
  }, [animating]);

  const next = useCallback(() => {
    if (step === STEPS.length - 1) {
      finish();
    } else {
      goTo(step + 1, 'next');
    }
  }, [step, finish, goTo]);

  const prev = useCallback(() => {
    if (step > 0) goTo(step - 1, 'prev');
  }, [step, goTo]);

  if (dismissed) return null;

  const isLast = step === STEPS.length - 1;
  const CurrentStep = STEPS[step].Component;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        opacity: visible && !fadingOut ? 1 : 0,
        transition: 'opacity 0.35s ease',
        pointerEvents: visible && !fadingOut ? 'auto' : 'none',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { /* do nothing, prevent accidental close */ } }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden"
        style={{
          background: `linear-gradient(145deg, ${useThemeStore.getState().colors.surface}ee, ${useThemeStore.getState().colors.bg}dd)`,
          border: `1px solid ${accent}33`,
          boxShadow: `0 0 80px ${accent}15, 0 24px 48px rgba(0,0,0,0.4)`,
        }}
      >
        {/* Skip button */}
        <button
          onClick={finish}
          className="absolute top-4 right-4 text-xs px-3 py-1.5 rounded-full transition-colors duration-200 cursor-pointer z-10"
          style={{
            color: 'var(--theme-text2)',
            background: `${accent}11`,
            border: `1px solid ${accent}22`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `${accent}22`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `${accent}11`;
          }}
        >
          Passer
        </button>

        {/* Step content */}
        <div
          className="px-8 pt-12 pb-6 min-h-[380px] flex items-center justify-center"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating
              ? direction === 'next' ? 'translateX(30px)' : 'translateX(-30px)'
              : 'translateX(0)',
            transition: 'opacity 0.2s ease, transform 0.2s ease',
          }}
        >
          <CurrentStep accent={accent} />
        </div>

        {/* Footer: dots + nav buttons */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-2">
            {STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > step ? 'next' : 'prev')}
                className="rounded-full transition-all duration-300 cursor-pointer"
                style={{
                  width: i === step ? 24 : 8,
                  height: 8,
                  background: i === step ? accent : `${accent}44`,
                }}
                aria-label={`Etape ${i + 1}`}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={prev}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer"
                style={{
                  color: 'var(--theme-text2)',
                  background: `${accent}11`,
                  border: `1px solid ${accent}22`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${accent}22`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${accent}11`;
                }}
              >
                Precedent
              </button>
            )}
            <button
              onClick={next}
              className="px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background: accent,
                color: '#fff',
                boxShadow: `0 4px 12px ${accent}44`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {isLast ? 'Commencer' : 'Suivant'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
