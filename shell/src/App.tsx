import { AuthProvider } from './auth/AuthProvider';
import { ContextMenuProvider } from './components/ContextMenu';
import { Desktop } from './desktop/Desktop';

export function App() {
  return (
    <AuthProvider>
      <ContextMenuProvider>
        <Desktop />
      </ContextMenuProvider>
    </AuthProvider>
  );
}
