import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { api, isAbortError } from '../lib/api';
import { useApp } from '../lib/store';
import { matchesQuery } from '../lib/tasks';
import { useTaskListActions } from '../hooks/useTaskListActions';
import TaskList from '../components/task/TaskList';
import FilterPanel from '../components/FilterPanel';
import { BackButton, Spinner } from '../components/Layout';

const PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100; // API limit
const DEBOUNCE_MS = 250;
const DEFAULT_SORT = 'dueDate:asc';

/** Search + filter + sort over all of the user's tasks, with infinite scroll. */
export default function SearchPage() {
  const { version } = useApp();
  // Query and filters live in the URL, so returning from view/edit restores the same results.
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const filters = {
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    tag: searchParams.get('tag') || '',
    sort: searchParams.get('sort') || DEFAULT_SORT,
  };
  const [sortBy, order] = filters.sort.split(':');
  const requestKey = JSON.stringify([query.trim(), filters.status, filters.priority, filters.tag, sortBy, order]);

  const [results, setResults] = useState(null);
  const [resultsQuery, setResultsQuery] = useState(null); // the query the current results are for
  const [nextCursor, setNextCursor] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreError, setMoreError] = useState(null);
  const [tags, setTags] = useState([]);
  const { toggle, remove } = useTaskListActions(setResults);

  const moreRequest = useRef(null);
  const sentinelRef = useRef(null);
  // How many rows are on screen, so a refresh after an edit keeps the same rows loaded.
  const loadedCount = useRef(0);
  const lastKey = useRef(requestKey);

  const params = useCallback(
    (extra) => ({
      q: query.trim(),
      status: filters.status,
      priority: filters.priority,
      tag: filters.tag,
      sortBy,
      order,
      ...extra,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestKey]
  );

  useEffect(() => {
    const controller = new AbortController();
    api
      .tags({ signal: controller.signal })
      .then(setTags)
      .catch(() => {});
    return () => controller.abort();
  }, [version]);

  // First page: debounced; an in-flight request is aborted when the query or filters change.
  useEffect(() => {
    moreRequest.current?.abort();
    if (requestKey !== lastKey.current) {
      lastKey.current = requestKey;
      loadedCount.current = 0;
    }
    const controller = new AbortController();
    const limit = Math.min(Math.max(PAGE_SIZE, loadedCount.current), MAX_PAGE_SIZE);
    const timer = setTimeout(() => {
      api
        .search(params({ limit }), { signal: controller.signal })
        .then((page) => {
          setResults(page.items);
          setResultsQuery(requestKey);
          setNextCursor(page.nextCursor);
          setError(null);
          setMoreError(null);
          loadedCount.current = page.items.length;
        })
        .catch((err) => !isAbortError(err) && setError(err.message));
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, version, params]);

  const loadMore = useCallback(() => {
    if (!nextCursor || moreRequest.current) return;
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setMoreError(null);
    api
      .search(params({ limit: PAGE_SIZE, cursor: nextCursor }), { signal: controller.signal })
      .then((page) => {
        setResults((list) => {
          const seen = new Set(list.map((t) => t.id));
          const merged = [...list, ...page.items.filter((t) => !seen.has(t.id))];
          loadedCount.current = merged.length;
          return merged;
        });
        setNextCursor(page.nextCursor);
      })
      .catch((err) => !isAbortError(err) && setMoreError(err.message))
      .finally(() => {
        if (moreRequest.current === controller) moreRequest.current = null;
        setLoadingMore(false);
      });
  }, [nextCursor, params]);

  // Infinite scroll: load the next page when the end of the list comes into view.
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !nextCursor || moreError) return;
    const observer = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: '200px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [nextCursor, moreError, loadMore]);

  useEffect(() => () => moreRequest.current?.abort(), []);

  const update = (next) => {
    const merged = { q: query, ...filters, ...next };
    const clean = Object.fromEntries(
      Object.entries(merged).filter(([k, v]) => v && !(k === 'sort' && v === DEFAULT_SORT))
    );
    setSearchParams(clean, { replace: true });
  };

  // While the debounced request is pending, filter the loaded results on the client
  // so the list reacts to every keystroke instantly.
  const pending = resultsQuery !== requestKey;
  const visible = useMemo(
    () => (pending && results && query.trim() ? results.filter((t) => matchesQuery(t, query)) : results),
    [pending, results, query]
  );

  const filtered = query.trim() || filters.status || filters.priority || filters.tag;

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto w-full max-w-md px-6 pt-6 pb-16 md:max-w-2xl md:px-10 md:pt-10">
        <BackButton />

        <form role="search" onSubmit={(e) => e.preventDefault()} className="mt-5">
          <div className="flex h-12 items-center rounded-[4px] border border-field bg-white pr-3 pl-4 focus-within:border-primary">
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Search for a task"
              aria-label="Search for a task"
              className="h-full flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:hidden"
            />
            <Search className="size-5 text-ink" strokeWidth={1.75} />
          </div>
        </form>

        <FilterPanel filters={filters} tags={tags} onChange={(next) => update(next)} />

        <div className="mt-2">
          {error && !visible && <p className="mt-10 text-center text-[13px] text-danger">{error}</p>}
          {!error && visible === null && <Spinner className="mx-auto mt-10" />}
          {visible?.length === 0 && !pending && (
            <div className="mt-12 flex flex-col items-center text-center">
              <SearchX className="size-9 text-track" strokeWidth={1.5} />
              <p className="mt-3 text-[13px] text-muted">
                {filtered ? 'No tasks match your search or filters.' : 'No tasks yet.'}
              </p>
            </div>
          )}
          {visible?.length > 0 && (
            <>
              <p className="sr-only" aria-live="polite">
                {visible.length}
                {nextCursor ? '+' : ''} result{visible.length === 1 ? '' : 's'}
              </p>
              <TaskList tasks={visible} onToggle={toggle} onDelete={remove} showDate />
              <div ref={sentinelRef} className="flex min-h-12 items-center justify-center py-4">
                {loadingMore && <Spinner />}
                {moreError && (
                  <button type="button" onClick={loadMore} className="text-[13px] font-medium text-primary">
                    Couldn’t load more — tap to retry
                  </button>
                )}
                {nextCursor && !loadingMore && !moreError && (
                  <button type="button" onClick={loadMore} className="text-[13px] font-medium text-primary">
                    Load more
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
