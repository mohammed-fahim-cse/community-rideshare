import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client';
import type { Me, VerifyOtpResponse } from '../api/types';
import { tokenStorage } from './storage';

type AuthStatus = 'loading' | 'signedOut' | 'signedIn';

interface AuthContextValue {
  status: AuthStatus;
  user: Me | null;
  accessToken: string | null;
  signup: (phone: string, inviteCode: string) => Promise<void>;
  login: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: Me) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<Me | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const token = await tokenStorage.get();
      if (!token) {
        setStatus('signedOut');
        return;
      }
      try {
        const me = await apiRequest<Me>('/users/me', { token });
        setAccessToken(token);
        setUser(me);
        setStatus('signedIn');
      } catch {
        // Stored token is missing/expired/revoked — fall back to signed out silently.
        await tokenStorage.clear();
        setStatus('signedOut');
      }
    })();
  }, []);

  const signup = useCallback(async (phone: string, inviteCode: string) => {
    await apiRequest('/auth/signup', { method: 'POST', body: { phone, inviteCode } });
  }, []);

  const login = useCallback(async (phone: string) => {
    await apiRequest('/auth/login', { method: 'POST', body: { phone } });
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const res = await apiRequest<VerifyOtpResponse>('/auth/verify-otp', {
      method: 'POST',
      body: { phone, code },
    });
    await tokenStorage.set(res.accessToken);
    const me = await apiRequest<Me>('/users/me', { token: res.accessToken });
    setAccessToken(res.accessToken);
    setUser(me);
    setStatus('signedIn');
  }, []);

  const logout = useCallback(async () => {
    await tokenStorage.clear();
    setAccessToken(null);
    setUser(null);
    setStatus('signedOut');
  }, []);

  const value = useMemo(
    () => ({ status, user, accessToken, signup, login, verifyOtp, logout, setUser }),
    [status, user, accessToken, signup, login, verifyOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
