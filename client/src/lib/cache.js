// Persistent cache of API GET responses (localStorage), scoped per user so a shared device
// never shows one user's tasks to another. Used to render instantly and to work offline.

const PREFIX = 'todo:cache:';
const MAX_ENTRIES = 80;

let scope = null; // current user id

const storage = () => {
  try {
    return window.localStorage;
  } catch {
    return null; // blocked storage (private mode etc.) → cache disabled
  }
};

const fullKey = (url) => `${PREFIX}${scope}:${url}`;

function prune() {
  const ls = storage();
  if (!ls) return;
  const entries = [];
  for (let i = 0; i < ls.length; i++) {
    const key = ls.key(i);
    if (!key?.startsWith(PREFIX)) continue;
    try {
      entries.push([key, JSON.parse(ls.getItem(key)).t || 0]);
    } catch {
      entries.push([key, 0]);
    }
  }
  if (entries.length <= MAX_ENTRIES) return;
  entries.sort((a, b) => a[1] - b[1]);
  entries.slice(0, entries.length - MAX_ENTRIES).forEach(([key]) => ls.removeItem(key));
}

export const cache = {
  setScope(userId) {
    scope = userId || null;
  },

  scope() {
    return scope;
  },

  get(url) {
    const ls = storage();
    if (!ls || !scope) return undefined;
    try {
      const raw = ls.getItem(fullKey(url));
      return raw ? JSON.parse(raw).data : undefined;
    } catch {
      return undefined;
    }
  },

  set(url, data) {
    const ls = storage();
    if (!ls || !scope) return;
    try {
      ls.setItem(fullKey(url), JSON.stringify({ t: Date.now(), data }));
    } catch {
      /* quota exceeded: pruning below frees space for next time */
    }
    prune();
  },

  clear() {
    const ls = storage();
    if (!ls) return;
    Object.keys(ls)
      .filter((key) => key.startsWith(PREFIX))
      .forEach((key) => ls.removeItem(key));
  },
};
