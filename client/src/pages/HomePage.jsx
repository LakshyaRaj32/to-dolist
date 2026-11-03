import { useEffect, useMemo, useState } from 'react';
import { addWeeks, format, isSameDay, isToday, startOfDay } from 'date-fns';
import { ArrowUpDown, CalendarCheck, Check, CircleUserRound, Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, isAbortError } from '../lib/api';
import { useAuth } from '../lib/auth';
import { relativeWeekLabel, TIME_ZONE, toInputDate, weekStartOf } from '../lib/dates';
import { useApp, useTaskActions } from '../lib/store';
import { sortForDay } from '../lib/tasks';
import { useTaskListActions } from '../hooks/useTaskListActions';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import WeekStrip from '../components/WeekStrip';
import SummaryCards, { WeeklyProgress } from '../components/SummaryCards';
import TaskList from '../components/task/TaskList';
import SortableTaskList from '../components/task/SortableTaskList';
import WeekOverviewCard from '../components/WeekOverviewCard';
import AccountSheet from '../components/AccountSheet';
import { IconButton, Spinner } from '../components/Layout';

const weekParams = (weekKey) => ({ from: weekKey, to: addWeeks(new Date(weekKey), 1).toISOString() });
const withKeys = (weeks) => weeks?.map((w) => ({ ...w, key: new Date(w.weekStart).toISOString() }));

function Greeting() {
  const { user, isGuest } = useAuth();
  const [accountOpen, setAccountOpen] = useState(false);
  const first = isGuest ? 'there' : user?.name?.split(' ')[0] || 'there';
  return (
    <div className="flex items-center gap-3">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted">{format(new Date(), 'EEEE, d MMMM')}</p>
        <p className="truncate text-[15px] font-semibold">Hi, {first}</p>
      </div>
      {isGuest && (
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          className="text-[12px] font-medium text-primary hover:underline"
        >
          Save account
        </button>
      )}
      <IconButton label="Account" onClick={() => setAccountOpen(true)} className="text-body hover:text-primary">
        {isGuest ? (
          <CircleUserRound className="size-6" strokeWidth={1.5} />
        ) : (
          <span className="grid size-8 place-items-center rounded-full bg-complete text-[13px] font-semibold text-primary">
            {first[0]?.toUpperCase()}
          </span>
        )}
      </IconButton>
      {accountOpen && <AccountSheet onClose={() => setAccountOpen(false)} />}
    </div>
  );
}

export default function HomePage() {
  const { version, online } = useApp();
  const { reorderTasks } = useTaskActions();
  const { newTask } = useTaskNavigation();

  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const weekStart = weekStartOf(selected);
  const weekKey = weekStart.toISOString();

  // Start from the cached copy (instant paint / offline), then revalidate from the API.
  const [weekTasks, setWeekTasks] = useState(() => api.peek('/tasks', weekParams(weekKey)) ?? null);
  const [weeks, setWeeks] = useState(() => withKeys(api.peek('/tasks/weeks', { tz: TIME_ZONE })) ?? null);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(() => new Set());
  const [reordering, setReordering] = useState(false);

  const { toggle, remove } = useTaskListActions(setWeekTasks);

  // Switching weeks quickly aborts the previous week's request.
  useEffect(() => {
    const params = weekParams(weekKey);
    setWeekTasks((current) => api.peek('/tasks', params) ?? current);
    const controller = new AbortController();
    api
      .list(params, { signal: controller.signal })
      .then((data) => {
        setWeekTasks(data);
        setError(null);
      })
      .catch((err) => !isAbortError(err) && setError(err.message));
    return () => controller.abort();
  }, [weekKey, version]);

  // Per-week open/completed summary (computed by the API in the user's time zone).
  useEffect(() => {
    const controller = new AbortController();
    api
      .weeks(TIME_ZONE, { signal: controller.signal })
      .then((data) => setWeeks(withKeys(data)))
      .catch((err) => !isAbortError(err) && setError(err.message));
    return () => controller.abort();
  }, [version]);

  const stats = useMemo(() => {
    const list = weekTasks || [];
    const completed = list.filter((t) => t.status === 'completed').length;
    return { completed, pending: list.length - completed, total: list.length };
  }, [weekTasks]);

  const busyDays = useMemo(
    () => new Set((weekTasks || []).map((t) => toInputDate(new Date(t.dueAt)))),
    [weekTasks]
  );

  const dayTasks = useMemo(
    () => sortForDay((weekTasks || []).filter((t) => isSameDay(new Date(t.dueAt), selected))),
    [weekTasks, selected]
  );

  // Drag-and-drop: show the new order immediately, roll back if saving fails.
  const reorder = (ordered) => {
    const before = weekTasks;
    const position = new Map(ordered.map((t, i) => [t.id, i]));
    setWeekTasks((list) => list.map((t) => (position.has(t.id) ? { ...t, position: position.get(t.id) } : t)));
    reorderTasks(
      ordered.map((t) => t.id),
      { rollback: () => setWeekTasks(before) }
    );
  };

  const changeWeek = (delta) => setSelected((d) => addWeeks(d, delta));
  const selectDay = (day) => {
    setSelected(day);
    setReordering(false);
  };

  const toggleWeek = (key) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const viewAll = () => {
    setExpanded((prev) => new Set(prev).add(weekKey));
    requestAnimationFrame(() =>
      document.getElementById(`week-${weekKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  };

  const isCurrentWeek = isSameDay(weekStart, weekStartOf(new Date()));
  const canReorder = dayTasks.length > 1 && online;

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto w-full max-w-md px-6 pt-6 pb-[calc(9rem_+_var(--bottom-inset))] md:max-w-5xl md:px-10 md:pt-10">
        <div className="md:grid md:grid-cols-2 md:gap-12 lg:gap-20">
          {/* Left column: search, week picker, stats */}
          <section className="space-y-7 md:sticky md:top-10 md:self-start">
            <Greeting />

            <Link
              to="/search"
              className="flex h-12 items-center rounded-[4px] border border-field bg-white pr-3 pl-4 text-[13px] text-muted transition hover:border-primary/50"
              aria-label="Search for a task"
            >
              <span className="flex-1">Search for a task</span>
              <Search className="size-5 text-ink" strokeWidth={1.75} />
            </Link>

            <div>
              {!isCurrentWeek || !isToday(selected) ? (
                <div className="mb-2 flex items-center justify-between text-[12px]">
                  <span className="font-medium text-body">{format(selected, 'MMMM yyyy')}</span>
                  <button
                    type="button"
                    onClick={() => selectDay(startOfDay(new Date()))}
                    className="font-medium text-primary"
                  >
                    Today
                  </button>
                </div>
              ) : null}
              <WeekStrip
                weekStart={weekStart}
                selected={selected}
                onSelect={selectDay}
                onWeekChange={changeWeek}
                busyDays={busyDays}
              />
            </div>

            <SummaryCards
              completed={stats.completed}
              pending={stats.pending}
              caption={relativeWeekLabel(weekStart)}
            />

            <WeeklyProgress completed={stats.completed} total={stats.total} />
          </section>

          {/* Right column: the selected day's tasks and all weeks */}
          <section className="mt-9 md:mt-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[17px] font-semibold">
                {isToday(selected) ? 'Tasks Today' : `Tasks · ${format(selected, 'EEE d MMM')}`}
              </h2>
              <div className="flex items-center gap-4">
                {(canReorder || reordering) && (
                  <button
                    type="button"
                    onClick={() => setReordering((r) => !r)}
                    aria-pressed={reordering}
                    className="inline-flex items-center gap-1 text-[13px] font-medium text-primary"
                  >
                    {reordering ? <Check className="size-4" /> : <ArrowUpDown className="size-4" />}
                    {reordering ? 'Done' : 'Reorder'}
                  </button>
                )}
                {!reordering && (
                  <button type="button" onClick={viewAll} className="text-[13px] font-medium text-primary">
                    View All
                  </button>
                )}
              </div>
            </div>

            <div className="mt-3">
              {error && !weekTasks && <p className="py-6 text-center text-[13px] text-danger">{error}</p>}
              {!error && weekTasks === null && <Spinner className="mx-auto my-6" />}
              {weekTasks && dayTasks.length === 0 && (
                <div className="flex flex-col items-center py-8 text-center">
                  <CalendarCheck className="size-9 text-track" strokeWidth={1.5} />
                  <p className="mt-2 text-[13px] text-muted">No tasks for this day.</p>
                  <button
                    type="button"
                    onClick={() => newTask(toInputDate(selected))}
                    className="mt-1 text-[13px] font-medium text-primary"
                  >
                    Add a task
                  </button>
                </div>
              )}
              {dayTasks.length > 0 &&
                (reordering ? (
                  <>
                    <p className="mb-1 text-[12px] text-muted">
                      Drag the handles to set the order you’ll work in. Keyboard: Space, then arrow keys.
                    </p>
                    <SortableTaskList tasks={dayTasks} onReorder={reorder} />
                  </>
                ) : (
                  <TaskList tasks={dayTasks} onToggle={toggle} onDelete={remove} />
                ))}
            </div>

            <div className="mt-10">
              <h2 className="text-[17px] font-semibold">Weekly Overview</h2>
              <p className="mt-1 text-[12px] text-muted">Tap a week to see all of its tasks</p>
              <div className="mt-4 space-y-3">
                {weeks === null && !error && <Spinner className="mx-auto my-6" />}
                {weeks?.length === 0 && (
                  <p className="py-4 text-center text-[13px] text-muted">
                    No tasks yet — tap + to plan your week.
                  </p>
                )}
                {weeks?.map((week) => (
                  <WeekOverviewCard
                    key={week.key}
                    week={week}
                    expanded={expanded.has(week.key)}
                    onToggle={() => toggleWeek(week.key)}
                  />
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-5xl justify-center pb-[calc(max(1.75rem,env(safe-area-inset-bottom))_+_var(--bottom-inset))] md:justify-end md:px-10 md:pb-[calc(2.5rem_+_var(--bottom-inset))]">
        <button
          type="button"
          onClick={() => newTask(toInputDate(selected))}
          aria-label="Add Task"
          className="pointer-events-auto grid size-[68px] place-items-center rounded-full bg-primary text-white shadow-[0_8px_24px_rgba(69,102,236,0.35)] transition hover:bg-[#3a59de] active:scale-95"
        >
          <Plus className="size-8" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
