import { timeLabel } from './dates';

export const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#22a06b' },
  { value: 'medium', label: 'Medium', color: '#e8a317' },
  { value: 'high', label: 'High', color: '#e5484d' },
];

export const STATUSES = [
  { value: 'todo', label: 'To do' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

export const SORT_OPTIONS = [
  { value: 'dueDate:asc', label: 'Due date (soonest)' },
  { value: 'dueDate:desc', label: 'Due date (latest)' },
  { value: 'priority:desc', label: 'Priority (high → low)' },
  { value: 'title:asc', label: 'Title (A → Z)' },
  { value: 'createdAt:desc', label: 'Recently added' },
];

export const priorityMeta = (value) => PRIORITIES.find((p) => p.value === value);
export const statusMeta = (value) => STATUSES.find((s) => s.value === value) || STATUSES[0];

export const isOverdue = (task) => task.status !== 'completed' && new Date(task.dueAt) < new Date();

export const timeRangeLabel = (task) =>
  task.endAt
    ? `${timeLabel(new Date(task.dueAt))} – ${timeLabel(new Date(task.endAt))}`
    : timeLabel(new Date(task.dueAt));

/** Manual (drag-and-drop) order first, then time. */
export const sortForDay = (tasks) =>
  [...tasks].sort(
    (a, b) =>
      (a.position ?? Infinity) - (b.position ?? Infinity) || new Date(a.dueAt) - new Date(b.dueAt)
  );

/** Client-side keyword match (title, description, tags) — mirrors the API's search. */
export function matchesQuery(task, query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = [task.title, task.description, ...(task.tags || [])].join(' ').toLowerCase();
  return words.every((w) => haystack.includes(w));
}

// The fields needed to recreate a task (used by "Undo" after delete).
export const editableFields = ({ title, description, dueAt, endAt, priority, status, tags }) => ({
  title,
  description,
  dueAt,
  endAt,
  priority,
  status,
  tags,
});

// ---- Optimistic list helpers ----
export const replaceInList = (list, task) => list?.map((t) => (t.id === task.id ? task : t));
export const removeFromList = (list, id) => list?.filter((t) => t.id !== id);
export const insertAt = (list, index, task) => {
  if (!list || list.some((t) => t.id === task.id)) return list;
  const copy = [...list];
  copy.splice(index < 0 ? copy.length : index, 0, task);
  return copy;
};
