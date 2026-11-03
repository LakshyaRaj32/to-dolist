import { useRef } from 'react';
import { X } from 'lucide-react';

export const fieldBorder = (invalid) =>
  `border ${invalid ? 'border-danger' : 'border-field focus-within:border-primary'}`;

export function Label({ htmlFor, children, optional, hint }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-[12px] text-body">
        {children}
        {optional && <span className="text-muted"> (optional)</span>}
      </label>
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

export function FieldError({ id, children }) {
  return children ? (
    <p id={id} role="alert" className="mt-1.5 text-[11px] text-danger">
      {children}
    </p>
  ) : null;
}

/** Text input styled like the Figma fields, with an inline (real-time) error. */
export function TextField({ id, label, error, optional, hint, className = '', ...props }) {
  return (
    <div className={className}>
      {label && (
        <Label htmlFor={id} optional={optional} hint={hint}>
          {label}
        </Label>
      )}
      <input
        id={id}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`h-11 w-full rounded-[2px] bg-white px-4 text-[14px] outline-none placeholder:text-muted ${fieldBorder(error)}`}
        {...props}
      />
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

/**
 * Looks like the Figma field (icon + text) but opens the native date/time picker,
 * which gives the best experience on phones.
 */
export function PickerField({ id, type, value, onChange, placeholder, display, icon, iconRight, invalid, onClear, onBlur }) {
  const ref = useRef(null);
  return (
    <div className={`relative flex h-11 items-center gap-3 rounded-[2px] bg-white px-4 text-[14px] ${fieldBorder(invalid)}`}>
      {icon}
      <span className="flex-1 truncate">{value ? display : placeholder}</span>
      {iconRight}
      <input
        ref={ref}
        id={id}
        type={type}
        value={value}
        aria-label={placeholder}
        aria-invalid={invalid || undefined}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        onClick={() => {
          try {
            ref.current.showPicker();
          } catch {
            /* older browsers just focus the input */
          }
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
      {value && onClear && (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear ${placeholder}`}
          className="relative z-10 -mr-2 grid size-7 place-items-center rounded-full text-muted hover:bg-black/5"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** A row of toggle buttons (single choice). Optional groups can be cleared by tapping again. */
export function ChoiceGroup({ legend, options, value, onChange, optional, columns = 3 }) {
  return (
    <fieldset>
      <legend className="mb-2 block text-[12px] text-body">
        {legend}
        {optional && <span className="text-muted"> (optional)</span>}
      </legend>
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(active && optional ? '' : opt.value)}
              className={`flex h-10 items-center justify-center gap-1.5 rounded-[2px] border text-[13px] transition ${
                active ? 'border-primary bg-primary text-white' : 'border-field bg-white hover:border-primary/50'
              }`}
            >
              {opt.color && (
                <span className="size-1.5 rounded-full" style={{ background: active ? '#fff' : opt.color }} />
              )}
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
