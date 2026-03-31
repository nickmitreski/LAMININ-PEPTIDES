import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import type { User } from '@supabase/supabase-js';
import { getAdminSupabase } from '../lib/supabaseAdminClient';
import { isSupabaseAdminUser } from '../utils/adminAuth';

interface AdminUser {
  email: string;
  name: string;
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  authReady: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined
);

function userToAdminUser(user: User): AdminUser {
  const meta = user.user_metadata as Record<string, unknown> | undefined;
  const name =
    (typeof meta?.full_name === 'string' && meta.full_name) ||
    (typeof meta?.name === 'string' && meta.name) ||
    user.email?.split('@')[0] ||
    'Admin';
  return { email: user.email ?? '', name };
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const applySessionUser = useCallback(async (sessionUser: User | null) => {
    if (sessionUser && isSupabaseAdminUser(sessionUser)) {
      setUser(userToAdminUser(sessionUser));
      setIsAuthenticated(true);
    } else {
      if (sessionUser) {
        const sb = getAdminSupabase();
        await sb?.auth.signOut();
      }
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    const sb = getAdminSupabase();
    if (!sb) {
      setAuthReady(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      const { data } = await sb.auth.getSession();
      if (cancelled) return;
      await applySessionUser(data.session?.user ?? null);
      setAuthReady(true);
    })();

    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange(async (_event, session) => {
      await applySessionUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySessionUser]);

  const login = async (email: string, password: string): Promise<boolean> => {
    const sb = getAdminSupabase();
    if (!sb) return false;

    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return false;
    }

    if (!isSupabaseAdminUser(data.user)) {
      await sb.auth.signOut();
      return false;
    }

    setUser(userToAdminUser(data.user));
    setIsAuthenticated(true);
    return true;
  };

  const logout = async () => {
    const sb = getAdminSupabase();
    await sb?.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{ isAuthenticated, user, login, logout, authReady }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
