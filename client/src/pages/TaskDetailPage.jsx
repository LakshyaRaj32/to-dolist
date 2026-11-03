import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, Clock, Flag, Tag } from 'lucide-react';
import { api, isAbortError } from '../lib/api';
import { longDateLabel } from '../lib/dates';
import { useApp, useTaskActions } from '../lib/store';
import { isOverdue, priorityMeta, STATUSES, timeRangeLabel } from '../lib/tasks';
import { useTaskNavigation } from '../hooks/useTaskNavigation';
import { BackButton, PrimaryButton, Spinner, useGoBack } from '../components/Layout';

export default function TaskDetailPage() {
  const { id } = useParams();
  const goBack = useGoBack();
  const { version } = useApp();
  const { removeTask, setStatus, confirmDelete } = useTaskActions();
  const { editTask } = useTaskNavigation();
  const [task, setTask] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(id, { signal: controller.signal })
      .then(setTask)
      .catch((err) => !isAbortError(err) && setError(err.message));
    return () => controller.abort();
  }, [id, version]);

  // Optimistic: show the new status at once, restore the previous one if saving fails.
  const changeStatus = async (status) => {
    const before = task;
    setTask((t) => ({ ...t, status }));
    const updated = await setStatus(task, status, { rollback: () => setTask(before) });
    if (updated) setTask(updated);
  };

  const priority = task && priorityMeta(task.priority);
  const overdue = task && isOverdue(task);

  return (
    <div className="min-h-dvh bg-page">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:min-h-0 md:max-w-2xl md:px-10 md:pt-10">
        <BackButton />

        {error && <p className="mt-16 text-center text-[13px] text-danger">{error}</p>}
        {!error && !task && <Spinner className="mx-auto mt-16" />}

        {task && (
          <>
            <p className="mt-6 text-[12px] font-medium text-primary">Task details</p>
            <h1 className={`mt-1 text-[22px] leading-snug font-semibold break-words ${task.status === 'completed' ? 'line-through' : ''}`}>
              {task.title}
            </h1>

            <dl className="mt-6 space-y-3 border-y border-line py-5 text-[13px]">
              <div className="flex items-center gap-3">
                <dt className="sr-only">Date</dt>
                <CalendarDays className="size-[18px] text-body" strokeWidth={1.5} />
                <dd>{longDateLabel(new Date(task.dueAt))}</dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="sr-only">Time</dt>
                <Clock className="size-[18px] text-body" strokeWidth={1.5} />
                <dd className={overdue ? 'text-danger' : ''}>
                  {timeRangeLabel(task)}
                  {overdue && ' · Overdue'}
                </dd>
              </div>
              <div className="flex items-center gap-3">
                <dt className="sr-only">Priority</dt>
                <Flag className="size-[18px] text-body" strokeWidth={1.5} />
                <dd style={priority ? { color: priority.color } : undefined}>
                  {priority ? `${priority.label} priority` : 'No priority'}
                </dd>
              </div>
              {task.tags?.length > 0 && (
                <div className="flex items-center gap-3">
                  <dt className="sr-only">Tags</dt>
                  <Tag className="size-[18px] text-body" strokeWidth={1.5} />
                  <dd className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag) => (
                      <span key={tag} className="bg-complete px-2 py-0.5 text-[12px] text-primary-dark">
                        #{tag}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>

            <h2 className="mt-6 text-[12px] text-body">Description</h2>
            <p className={`mt-2 text-[14px] leading-relaxed whitespace-pre-wrap ${task.description ? '' : 'text-muted'}`}>
              {task.description || 'No description'}
            </p>

            <h2 className="mt-7 text-[12px] text-body">Status</h2>
            <div className="mt-2 grid grid-cols-3 gap-3">
              {STATUSES.map((s) => {
                const active = task.status === s.value;
                return (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => !active && changeStatus(s.value)}
                    className={`h-10 rounded-[2px] border text-[13px] transition ${
                      active ? 'border-primary bg-primary text-white' : 'border-field bg-white hover:border-primary/50'
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-auto grid grid-cols-2 gap-4 pt-10 md:mt-10">
              <button
                type="button"
                onClick={async () => (await confirmDelete(task)) && (await removeTask(task)) && goBack()}
                className="h-12 rounded-[2px] border border-danger text-[15px] font-medium text-danger transition hover:bg-danger/5"
              >
                Delete
              </button>
              <PrimaryButton type="button" onClick={() => editTask(task)}>
                Edit
              </PrimaryButton>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
