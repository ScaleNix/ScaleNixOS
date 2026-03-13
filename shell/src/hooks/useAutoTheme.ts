import { useEffect } from 'react';
import { useThemeStore } from '../store/themeStore';

const DARK_THEME = 'midnight';
const LIGHT_THEME = 'light';

/**
 * Parses an "HH:MM" string into total minutes since midnight.
 */
function parseTime(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Returns true if the current time falls in the "dark" window
 * given light-start and dark-start schedule times.
 */
function isDarkBySchedule(lightTime: string, darkTime: string): boolean {
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const lightMin = parseTime(lightTime);
  const darkMin = parseTime(darkTime);

  if (lightMin < darkMin) {
    // e.g. light 08:00, dark 20:00 -> dark when current < 08:00 or current >= 20:00
    return current < lightMin || current >= darkMin;
  }
  // e.g. light 20:00, dark 08:00 (inverted) -> dark when current >= 08:00 and current < 20:00
  return current >= darkMin && current < lightMin;
}

export function useAutoTheme() {
  const autoTheme = useThemeStore((s) => s.autoTheme);
  const scheduleLight = useThemeStore((s) => s.scheduleLight);
  const scheduleDark = useThemeStore((s) => s.scheduleDark);
  const setTheme = useThemeStore((s) => s.setTheme);

  // System preference mode
  useEffect(() => {
    if (autoTheme !== 'system') return;

    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (dark: boolean) => {
      setTheme(dark ? DARK_THEME : LIGHT_THEME);
    };

    // Apply immediately
    apply(mq.matches);

    const handler = (e: MediaQueryListEvent) => apply(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [autoTheme, setTheme]);

  // Schedule mode
  useEffect(() => {
    if (autoTheme !== 'schedule') return;

    const apply = () => {
      const dark = isDarkBySchedule(scheduleLight, scheduleDark);
      setTheme(dark ? DARK_THEME : LIGHT_THEME);
    };

    // Apply immediately
    apply();

    // Re-check every 60 seconds
    const interval = setInterval(apply, 60_000);
    return () => clearInterval(interval);
  }, [autoTheme, scheduleLight, scheduleDark, setTheme]);
}
