import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import keycloak from './keycloak';
import type { AuthContextType, ScalenixUser } from '../types/auth.types';

export const AuthContext = createContext<AuthContextType>({
  initialized: false,
  token: undefined,
  user: null,
  logout: () => {},
});

function parseUser(): ScalenixUser | null {
  const parsed = keycloak.tokenParsed;
  if (!parsed) return null;
  const realmRoles = parsed.realm_access?.roles ?? [];
  return {
    name: parsed.name ?? '',
    email: parsed.email ?? '',
    preferred_username: parsed.preferred_username ?? '',
    roles: realmRoles,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [initialized, setInitialized] = useState(false);
  const [token, setToken] = useState<string | undefined>();
  const [user, setUser] = useState<ScalenixUser | null>(null);

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', pkceMethod: 'S256' })
      .then((authenticated) => {
        if (authenticated) {
          setToken(keycloak.token);
          setUser(parseUser());
        }
        setInitialized(true);
      })
      .catch((err) => {
        console.error('Keycloak init failed', err);
        setInitialized(true);
      });

    // Refresh token every 60s
    const interval = setInterval(() => {
      keycloak
        .updateToken(70)
        .then((refreshed) => {
          if (refreshed) {
            setToken(keycloak.token);
            setUser(parseUser());
          }
        })
        .catch(() => {
          keycloak.logout();
        });
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const logout = useCallback(() => {
    keycloak.logout({ redirectUri: window.location.origin });
  }, []);

  if (!initialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#0a0f1e]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4361ee] border-t-transparent" />
          <span className="text-sm text-[#64748b]">Connexion en cours...</span>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ initialized, token, user, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
