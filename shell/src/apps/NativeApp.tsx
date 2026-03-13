import type { AppManifest } from '../types/app.types';

interface NativeAppProps {
  app: AppManifest;
}

export function NativeApp({ app }: NativeAppProps) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-[#64748b]">
      Application native "{app.label}" - composant {app.component ?? 'non defini'}
    </div>
  );
}
