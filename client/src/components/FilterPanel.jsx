import { useState } from 'react';
import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import { PRIORITIES, SORT_OPTIONS } from '../lib/tasks';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
];

const PRIORITY_FILTERS = [{ value: '', label: 'All' }, ...PRIORITIES, { value: 'none', label: 'None' }];

function Chips({ label, options, value, onChange }) {
  return (
    <div>
      <p className="mb-2 text-[12px] text-body">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value || 'all'}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(opt.value)}
              className={`h-8 rounded-[2px] border px-3 text-[12px] transition ${
                active ? 'border-primary bg-primary text-white' : 'border-field bg-white hover:border-primary/50'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Status / priority / tag filters and sort order.
 * `filters` = { status, priority, tag, sort } (empty string = no filter).
 */
export default function FilterPanel({ filters, tags, onChange }) {
  const [open, setOpen] = useState(false);
  const activeCount = ['status', 'priority', 'tag'].filter((k) => filters[k]).length;
  const set = (key) => (value) => onChange({ ...filters, [key]: value });

  return (
    <section className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="filter-panel"
          className="inline-flex h-9 items-center gap-2 text-[13px] font-medium text-ink"
        >
          <SlidersHorizontal className="size-4" strokeWidth={1.75} />
          Filters
          {activeCount > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] text-white">
              {activeCount}
            </span>
          )}
          <ChevronDown className={`size-4 text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <label className="flex items-center gap-2 text-[12px] text-body">
          <span className="sr-only sm:not-sr-only">Sort</span>
          <select
            value={filters.sort}
            onChange={(e) => set('sort')(e.target.value)}
            className="h-9 rounded-[2px] border border-field bg-white px-2 text-[12px] text-ink outline-none focus:border-primary"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {open && (
        <div id="filter-panel" className="animate-pop mt-3 space-y-4 border border-line bg-white p-4">
          <Chips label="Status" options={STATUS_FILTERS} value={filters.status} onChange={set('status')} />
          <Chips label="Priority" options={PRIORITY_FILTERS} value={filters.priority} onChange={set('priority')} />
          {tags.length > 0 && (
            <Chips
              label="Tag"
              options={[{ value: '', label: 'All' }, ...tags.map((t) => ({ value: t.tag, label: `#${t.tag}` }))]}
              value={filters.tag}
              onChange={set('tag')}
            />
          )}
          {activeCount > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...filters, status: '', priority: '', tag: '' })}
              className="text-[12px] font-medium text-primary"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </section>
  );
}
