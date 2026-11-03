import { useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { weekDays } from '../lib/dates';

/** Mon–Sun day picker. Swipe (or use the arrows on larger screens) to change week. */
export default function WeekStrip({ weekStart, selected, onSelect, onWeekChange, busyDays }) {
  const touch = useRef(null);

  const onTouchStart = (e) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e) => {
    if (!touch.current) return;
    const dx = e.changedTouches[0].clientX - touch.current.x;
    const dy = e.changedTouches[0].clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) onWeekChange(dx < 0 ? 1 : -1);
  };

  const arrow = 'hidden size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-black/5 hover:text-ink sm:grid';

  return (
    <div className="flex items-center gap-1" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button type="button" aria-label="Previous week" className={arrow} onClick={() => onWeekChange(-1)}>
        <ChevronLeft className="size-4" />
      </button>
      <div className="grid flex-1 grid-cols-7" role="tablist" aria-label="Days of the week">
        {weekDays(weekStart).map((day) => {
          const active = isSameDay(day, selected);
          const busy = busyDays.has(format(day, 'yyyy-MM-dd'));
          return (
            <button
              key={day.toISOString()}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={format(day, 'EEEE, MMMM d')}
              onClick={() => onSelect(day)}
              className={`mx-auto flex h-[60px] w-[34px] flex-col items-center justify-center rounded-[1px] transition ${
                active ? 'bg-primary text-white' : 'text-muted hover:text-ink'
              }`}
            >
              <span className="text-[11px] leading-4">{format(day, 'EEE')}</span>
              <span className="text-[15px] leading-6">{format(day, 'dd')}</span>
              <span
                className={`size-1 rounded-full ${active ? 'bg-white' : busy ? 'bg-primary/50' : 'bg-transparent'}`}
              />
            </button>
          );
        })}
      </div>
      <button type="button" aria-label="Next week" className={arrow} onClick={() => onWeekChange(1)}>
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}
