import { useEffect, useState } from 'react';
import { addWeeks, isSameDay } from 'date-fns';
import { ChevronDown, Plus } from 'lucide-react';
import { api, isAbortError } from '../lib/api';
import { dayLabel, relativeWeekLabel, toInputDate, weekRangeLabel, weekStartOf } from '../lib/dates';
import { useApp } from '../lib/store';
import { sortForDay } from '../lib/tasks';
import { useTaskListActions } from '../hooks/useTaskListActions';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import TaskList from './task/TaskList';
import { Spinner } from './Layout';

function groupByDay(tasks) {
  const groups = [];
  for (const task of tasks) {
    const due = new Date(task.dueAt);
    const last = groups[groups.length - 1];
    if (last && isSameDay(last.day, due)) last.tasks.push(task);
    else groups.push({ day: due, tasks: [task] });
  }
  return groups.map((g) => ({ ...g, tasks: sortForDay(g.tasks) }));
}

/** A week's summary card (open vs. completed) that expands to list the week's tasks. */
export default function WeekOverviewCard({ week, expanded, onToggle }) {
  const { version } = useApp();
  const { newTask } = useTaskNavigation();
  const [tasks, setTasks] = useState(null);
  const [error, setError] = useState(null);
  const { toggle, remove } = useTaskListActions(setTasks);
  const start = new Date(week.weekStart);
  const isCurrent = isSameDay(start, weekStartOf(new Date()));
  const percent = week.total ? Math.round((week.completed / week.total) * 100) : 0;

  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    api
      .list(
        { from: start.toISOString(), to: addWeeks(start, 1).toISOString() },
        { signal: controller.signal }
      )
      .then((data) => {
        setTasks(data);
        setError(null);
      })
      .catch((err) => !isAbortError(err) && setError(err.message));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expanded, week.weekStart, version]);

  return (
    <section
      id={`week-${week.key}`}
      className={`scroll-mt-6 border bg-white ${isCurrent ? 'border-primary/40' : 'border-line'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className={`text-[11px] font-medium ${isCurrent ? 'text-primary' : 'text-muted'}`}>
            {relativeWeekLabel(start)}
          </p>
          <p className="text-[15px] font-semibold">{weekRangeLabel(start)}</p>
          <div className="mt-2.5 flex flex-wrap gap-2 text-[11px]">
            <span className="bg-pending px-2 py-1 text-[#c02a2a]">
              <b className="font-semibold">{week.open}</b> Open
            </span>
            <span className="bg-complete px-2 py-1 text-primary-dark">
              <b className="font-semibold">{week.completed}</b> Completed
            </span>
          </div>
          <div className="mt-3 h-1.5 bg-track" aria-hidden>
            <div className="h-full bg-primary-dark transition-[width] duration-500" style={{ width: `${percent}%` }} />
          </div>
        </div>
        <ChevronDown
          className={`size-5 shrink-0 text-muted transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="border-t border-line px-4 pt-1 pb-4">
          {error && <p className="py-4 text-center text-[13px] text-danger">{error}</p>}
          {!error && tasks === null && <Spinner className="mx-auto my-4" />}
          {tasks?.length === 0 && <p className="py-4 text-center text-[13px] text-muted">No tasks this week.</p>}
          {tasks?.length > 0 &&
            groupByDay(tasks).map((group) => (
              <div key={group.day.toISOString()} className="mt-3">
                <h3 className="text-[11px] font-medium text-body">{dayLabel(group.day)}</h3>
                <TaskList tasks={group.tasks} onToggle={toggle} onDelete={remove} surface="bg-white" />
              </div>
            ))}
          <button
            type="button"
            onClick={() => newTask(toInputDate(isCurrent ? new Date() : start))}
            className="mt-4 flex w-full items-center justify-center gap-1.5 border border-dashed border-field py-2.5 text-[13px] text-body transition hover:border-primary hover:text-primary"
          >
            <Plus className="size-4" /> Add task to this week
          </button>
        </div>
      )}
    </section>
  );
}
