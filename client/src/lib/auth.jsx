import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setAuthToken, setUnauthorizedHandler } from './api';
import { cache } from './cache';
import { useApp } from './store';

const AuthContext = createContext(null);
const SESSION_KEY = 'todo:session';

function readSession() {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY));
    return session?.token && session?.user ? session : null;
  } catch {
    return null;
  }
}

/** Points the API client and the offline cache at the given session (or none). */
function applySession(session) {
  setAuthToken(session?.token ?? null);
  cache.setScope(session?.user?.id ?? null);
}

export function AuthProvider({ children }) {
  const { showToast } = useApp();
  const [session, setSession] = useState(() => {
    const saved = readSession();
    applySession(saved);
    return saved;
  });

  const save = useCallback((next) => {
    try {
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      else localStorage.removeItem(SESSION_KEY);
    } catch {
      /* storage blocked: session lasts for this tab only */
    }
    // Switching to a different user (or logging out) drops the previous user's cached data.
    if (next?.user?.id !== cache.scope()) cache.clear();
    applySession(next);
    setSession(next);
  }, []);

  const login = useCallback(async (credentials) => save(await api.login(credentials)), [save]);
  const register = useCallback(async (details) => save(await api.register(details)), [save]);
  // "Get Started": a private guest account, so the app works without a sign-up form.
  const startGuest = useCallback(async () => save(await api.guest()), [save]);
  // Guest → full account, keeping the same user (and all tasks).
  const upgrade = useCallback(async (details) => save(await api.upgrade(details)), [save]);
  const logout = useCallback(() => save(null), [save]);

  useEffect(() => {
    setUnauthorizedHandler((message) => {
      save(null);
      showToast(message || 'Please log in again');
    });
    return () => setUnauthorizedHandler(null);
  }, [save, showToast]);

  // Refresh the profile in the background (also validates the stored token).
  const token = session?.token;
  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    api
      .me({ signal: controller.signal })
      .then(({ user }) => setSession((s) => (s?.token === token ? { ...s, user } : s)))
      .catch(() => {}); // offline or aborted: keep the saved profile
    return () => controller.abort();
  }, [token]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      isGuest: Boolean(session?.user?.isGuest),
      login,
      register,
      startGuest,
      upgrade,
      logout,
    }),
    [session, login, register, startGuest, upgrade, logout]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
