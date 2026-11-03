import {
  addDays,
  differenceInCalendarWeeks,
  format,
  isSameMonth,
  isSameYear,
  isToday,
  isTomorrow,
  isYesterday,
  startOfWeek,
} from 'date-fns';

export const TIME_ZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

const WEEK = { weekStartsOn: 1 }; // Weeks run Monday → Sunday

export const weekStartOf = (date) => startOfWeek(date, WEEK);
export const weekDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

export function weekRangeLabel(start) {
  const end = addDays(start, 6);
  const range = isSameMonth(start, end)
    ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`;
  return isSameYear(end, new Date()) ? range : `${range}, ${format(end, 'yyyy')}`;
}

export function relativeWeekLabel(start) {
  const diff = differenceInCalendarWeeks(start, new Date(), WEEK);
  if (diff === 0) return 'This Week';
  if (diff === -1) return 'Last Week';
  if (diff === 1) return 'Next Week';
  return diff < 0 ? `${-diff} Weeks Ago` : `In ${diff} Weeks`;
}

export function dayLabel(date) {
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'EEE, MMM d');
}

export const longDateLabel = (date) => format(date, 'EEEE d, MMMM'); // "Friday 14, January"
export const timeLabel = (date) => format(date, 'h:mm a');
export const toInputDate = (date) => format(date, 'yyyy-MM-dd');
export const toInputTime = (date) => format(date, 'HH:mm');
export const fromInputs = (date, time) => new Date(`${date}T${time}`); // parsed as local time
export const twoDigits = (n) => String(n).padStart(2, '0');
