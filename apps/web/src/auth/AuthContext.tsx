import {
  type LoginInput,
  type LoginResponse,
  type Member,
  UserRole,
} from '@pm/shared';
import { useQueryClient } from '@tanstack/react-query';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  getToken,
  http,
  setToken,
  setUnauthorizedHandler,
} from '../api/client';

interface AuthState {
  user: Member | null;
  /** True while an existing session is being restored on page load. */
  loading: boolean;
  isManager: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<Member | null>(null);
  const [loading, setLoading] = useState(() => !!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!getToken()) return;
    http
      .get<Member>('/auth/me')
      .then((r) => setUser(r.data))
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [logout]);

  const login = useCallback(
    async (input: LoginInput) => {
      const { data } = await http.post<LoginResponse>('/auth/login', input);
      queryClient.clear();
      setToken(data.accessToken);
      setUser(data.user);
    },
    [queryClient],
  );

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isManager: user?.role === UserRole.Manager,
      login,
      logout,
    }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
