import { useState } from 'react';
import { X } from 'lucide-react';
import { fieldBorder } from './fields';

const MAX_TAGS = 10;
const normalize = (raw) => raw.trim().replace(/^#/, '').toLowerCase().slice(0, 24);

/** Category tags: type and press Enter/comma to add, Backspace to remove, or pick a suggestion. */
export default function TagInput({ id, value, onChange, suggestions = [], invalid }) {
  const [draft, setDraft] = useState('');

  const add = (raw) => {
    const tag = normalize(raw);
    if (tag && !value.includes(tag) && value.length < MAX_TAGS) onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 8);

  return (
    <div>
      <div
        className={`flex min-h-11 flex-wrap items-center gap-1.5 rounded-[2px] bg-white px-3 py-1.5 ${fieldBorder(invalid)}`}
      >
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 bg-complete py-1 pr-1 pl-2 text-[12px] text-primary-dark">
            #{tag}
            <button
              type="button"
              aria-label={`Remove tag ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="grid size-4 place-items-center rounded-full hover:bg-primary/15"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => draft && add(draft)}
          placeholder={value.length ? '' : 'e.g. work, home'}
          disabled={value.length >= MAX_TAGS}
          aria-invalid={invalid || undefined}
          className="h-8 min-w-24 flex-1 bg-transparent px-1 text-[14px] outline-none placeholder:text-muted"
        />
      </div>
      {unused.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {unused.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => add(tag)}
              className="border border-dashed border-field px-2 py-0.5 text-[11px] text-body hover:border-primary hover:text-primary"
            >
              + #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
