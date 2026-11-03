import { Check, X } from 'lucide-react';
import { twoDigits } from '../lib/dates';

function StatIcon({ tone }) {
  const complete = tone === 'complete';
  return (
    <span
      className={`grid size-[26px] shrink-0 place-items-center ${complete ? 'bg-[#a9b8f6]' : 'bg-[#f6a9a9]'}`}
      aria-hidden
    >
      <span
        className={`grid size-[18px] place-items-center rounded-[2px] border-[1.5px] ${
          complete ? 'border-primary-dark text-primary-dark' : 'border-[#d62f2f] text-[#d62f2f]'
        }`}
      >
        {complete ? <Check className="size-3" strokeWidth={3} /> : <X className="size-3" strokeWidth={3} />}
      </span>
    </span>
  );
}

function StatCard({ tone, title, value, caption }) {
  return (
    <div className={`px-3.5 py-4 ${tone === 'complete' ? 'bg-complete' : 'bg-pending'}`}>
      <div className="flex items-center gap-2.5">
        <StatIcon tone={tone} />
        <span className="text-[12px] font-medium whitespace-nowrap">{title}</span>
      </div>
      <p className="mt-2 pl-9">
        <span className="text-[22px] font-semibold">{twoDigits(value)}</span>
        <span className="ml-1.5 text-[10px] text-body">{caption}</span>
      </p>
    </div>
  );
}

export default function SummaryCards({ completed, pending, caption }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <StatCard tone="complete" title="Task Complete" value={completed} caption={caption} />
      <StatCard tone="pending" title="Task Pending" value={pending} caption={caption} />
    </div>
  );
}

export function WeeklyProgress({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  return (
    <section>
      <div className="flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold">Weekly Progress</h2>
        <span className="text-[12px] text-body">{percent}%</span>
      </div>
      <div
        className="mt-4 h-[22px] bg-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label="Weekly progress"
      >
        <div className="h-full bg-primary-dark transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </section>
  );
}
