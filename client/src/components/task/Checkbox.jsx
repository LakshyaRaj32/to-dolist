import { Check } from 'lucide-react';

export default function Checkbox({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange();
      }}
      className="grid size-[18px] shrink-0 place-items-center rounded-[1px] border-[1.5px] border-primary transition active:scale-90"
    >
      {checked && <Check className="size-[13px] text-primary" strokeWidth={2.5} />}
    </button>
  );
}
