import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getMe, login as apiLogin, verifyOtp as apiVerifyOtp } from '../api/auth';
import type { Me } from '../api/types';

const TOKEN_KEY = 'rideshare.admin.accessToken';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: Me | null;
  accessToken: string | null;
  login: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Me | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      // Synchronously deciding "no token, so signed out" — there's no async boundary to
      // move this past; it's the initial read of an external system (localStorage), not a
      // subscription.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('signedOut');
      return;
    }

    getMe(token)
      .then((me) => {
        if (me.role !== 'ADMIN') {
          localStorage.removeItem(TOKEN_KEY);
          setStatus('signedOut');
          return;
        }
        setAccessToken(token);
        setUser(me);
        setStatus('signedIn');
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setStatus('signedOut');
      });
  }, []);

  const login = useCallback(async (phone: string) => {
    await apiLogin(phone);
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await apiVerifyOtp(phone, code);
    const me = await getMe(res.accessToken);
    if (me.role !== 'ADMIN') {
      throw new Error('This account is not an admin for any community.');
    }
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    setAccessToken(res.accessToken);
    setUser(me);
    setStatus('signedIn');
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setAccessToken(null);
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, user, accessToken, login, verifyOtp, logout }),
    [status, user, accessToken, login, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
