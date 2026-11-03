import { dayLabel } from '../../lib/dates';
import { isOverdue, priorityMeta, timeRangeLabel } from '../../lib/tasks';

/** The small line under a task title: time, priority, status and tags. */
export default function TaskMeta({ task, showDate = false }) {
  const priority = priorityMeta(task.priority);
  return (
    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted">
      <span className={isOverdue(task) ? 'text-danger' : ''}>
        {showDate && `${dayLabel(new Date(task.dueAt))}, `}
        {timeRangeLabel(task)}
      </span>
      {priority && (
        <span className="inline-flex items-center gap-1" style={{ color: priority.color }}>
          <span className="size-1.5 rounded-full" style={{ background: priority.color }} />
          {priority.label}
        </span>
      )}
      {task.status === 'in_progress' && <span className="text-primary">In progress</span>}
      {task.tags?.map((tag) => (
        <span key={tag} className="text-primary-dark/70">
          #{tag}
        </span>
      ))}
    </p>
  );
}
