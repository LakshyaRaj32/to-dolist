import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import { editableFields } from './tasks';
import Toast from '../components/Toast';
import OfflineBanner from '../components/OfflineBanner';

const AppContext = createContext(null);

function useOnlineStatus() {
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

/**
 * App-wide state that several screens share:
 * - `version`: bumped after every successful mutation so all visible lists refetch,
 * - toasts, and online/offline status.
 */
export function AppProvider({ children }) {
  const [version, setVersion] = useState(0);
  const [toast, setToast] = useState(null);
  const online = useOnlineStatus();
  const timer = useRef();

  const changed = useCallback(() => setVersion((v) => v + 1), []);

  const showToast = useCallback((message, action) => {
    clearTimeout(timer.current);
    setToast({ id: Date.now(), message, action });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  const hideToast = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);

  // Coming back online: refresh everything that was served from the cache.
  useEffect(() => {
    if (online) changed();
  }, [online, changed]);

  const value = useMemo(() => ({ version, changed, showToast, online }), [version, changed, showToast, online]);

  return (
    <AppContext.Provider value={value}>
      {!online && <OfflineBanner />}
      {children}
      <Toast toast={toast} onClose={hideToast} />
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);

const failureMessage = (err) =>
  err.offline ? 'You’re offline — the change was undone' : `${err.message} — the change was undone`;

/**
 * Task mutations used by every screen. Callers update their own list first (optimistic UI)
 * and pass `rollback`, which runs if the request fails.
 */
export function useTaskActions() {
  const { changed, showToast } = useApp();

  const setStatus = useCallback(
    async (task, status, { rollback } = {}) => {
      try {
        const updated = await api.update(task.id, { status });
        changed();
        return updated;
      } catch (err) {
        rollback?.();
        showToast(failureMessage(err));
        return null;
      }
    },
    [changed, showToast]
  );

  const removeTask = useCallback(
    async (task, { rollback } = {}) => {
      try {
        await api.remove(task.id);
        changed();
        showToast('Task deleted', {
          label: 'Undo',
          onClick: async () => {
            try {
              await api.create(editableFields(task));
              changed();
            } catch (err) {
              showToast(err.message);
            }
          },
        });
        return true;
      } catch (err) {
        rollback?.();
        showToast(failureMessage(err));
        return false;
      }
    },
    [changed, showToast]
  );

  const reorderTasks = useCallback(
    async (ids, { rollback } = {}) => {
      try {
        await api.reorder(ids);
        changed();
        return true;
      } catch (err) {
        rollback?.();
        showToast(failureMessage(err));
        return false;
      }
    },
    [changed, showToast]
  );

  return { setStatus, removeTask, reorderTasks };
}
