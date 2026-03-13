export interface ScalenixUser {
  name: string;
  email: string;
  preferred_username: string;
  roles: string[];
}

export interface AuthContextType {
  initialized: boolean;
  token: string | undefined;
  user: ScalenixUser | null;
  logout: () => void;
}
