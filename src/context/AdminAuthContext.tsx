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

export type AdminLoginResult =
  | { ok: true }
  | { ok: false; code: 'not_configured' | 'invalid_credentials' | 'not_admin' };

interface AdminAuthContextType {
  isAuthenticated: boolean;
  user: AdminUser | null;
  login: (email: string, password: string) => Promise<AdminLoginResult>;
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
      let sessionUser = data.session?.user ?? null;
      if (sessionUser) {
        const { data: gu } = await sb.auth.getUser();
        if (!cancelled && gu.user) {
          sessionUser = gu.user;
        }
      }
      await applySessionUser(sessionUser);
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

  const login = async (email: string, password: string): Promise<AdminLoginResult> => {
    const sb = getAdminSupabase();
    if (!sb) {
      return { ok: false, code: 'not_configured' };
    }

    const { data, error } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      return { ok: false, code: 'invalid_credentials' };
    }

    // Fresh user + app_metadata from Auth API (sign-in payload can lag behind SQL updates).
    const { data: fresh, error: freshErr } = await sb.auth.getUser();
    const effectiveUser = !freshErr && fresh.user ? fresh.user : data.user;

    if (!isSupabaseAdminUser(effectiveUser)) {
      await sb.auth.signOut();
      return { ok: false, code: 'not_admin' };
    }

    setUser(userToAdminUser(effectiveUser));
    setIsAuthenticated(true);
    return { ok: true };
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
