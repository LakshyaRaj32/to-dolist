import { useState } from 'react';
import { CalendarDays, Clock } from 'lucide-react';
import { fromInputs, longDateLabel, timeLabel } from '../../lib/dates';
import { PRIORITIES, STATUSES } from '../../lib/tasks';
import { taskFormSchema } from '../../lib/validation';
import { useFormValidation } from '../../hooks/useFormValidation';
import { ChoiceGroup, FieldError, Label, PickerField, TextField } from './fields';
import TagInput from './TagInput';
import { PrimaryButton } from '../Layout';

const displayTime = (hhmm) => timeLabel(fromInputs('2000-01-01', hhmm));

/**
 * The task form ("Add New Task" / "Edit Task") with real-time validation.
 * `onSubmit(values)` may throw an ApiError whose field errors are shown inline.
 */
export default function TaskInput({ initialValues, isEdit, tagSuggestions, onSubmit }) {
  const [values, setValues] = useState(initialValues);
  const [saving, setSaving] = useState(false);
  const { errors, touch, handleSubmit, setServerErrors } = useFormValidation(taskFormSchema, values);

  const set = (field) => (value) => {
    setValues((v) => ({ ...v, [field]: value }));
    touch(field);
  };

  const submit = handleSubmit(async () => {
    setSaving(true);
    try {
      await onSubmit(values);
    } catch (err) {
      if (err.errors) {
        const { dueAt, endAt, ...rest } = err.errors;
        setServerErrors({ ...rest, start: dueAt, end: endAt });
      }
      setSaving(false);
    }
  });

  return (
    <form onSubmit={submit} noValidate className="mt-7 space-y-5">
      <TextField
        id="title"
        label="Task title"
        hint={`${values.title.length}/120`}
        value={values.title}
        maxLength={120}
        autoFocus={!isEdit}
        placeholder="Enter task title"
        onChange={(e) => set('title')(e.target.value)}
        onBlur={() => touch('title')}
        error={errors.title}
      />

      <div>
        <Label htmlFor="start">Set Time</Label>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <PickerField
              id="start"
              type="time"
              value={values.start}
              onChange={set('start')}
              onBlur={() => touch('start')}
              placeholder="Start"
              display={values.start && displayTime(values.start)}
              icon={<Clock className="size-4 shrink-0" strokeWidth={1.75} />}
              invalid={Boolean(errors.start)}
            />
            <FieldError>{errors.start}</FieldError>
          </div>
          <div>
            <PickerField
              id="end"
              type="time"
              value={values.end}
              onChange={set('end')}
              onClear={() => set('end')('')}
              placeholder="Ends"
              display={values.end && displayTime(values.end)}
              icon={<Clock className="size-4 shrink-0" strokeWidth={1.75} />}
              invalid={Boolean(errors.end)}
            />
            <FieldError>{errors.end}</FieldError>
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="date">Set Date</Label>
        <PickerField
          id="date"
          type="date"
          value={values.date}
          onChange={set('date')}
          onBlur={() => touch('date')}
          placeholder="Select date"
          display={values.date && longDateLabel(fromInputs(values.date, '00:00'))}
          iconRight={<CalendarDays className="size-[18px] shrink-0 text-body" strokeWidth={1.5} />}
          invalid={Boolean(errors.date)}
        />
        <FieldError>{errors.date}</FieldError>
      </div>

      <ChoiceGroup legend="Priority" optional options={PRIORITIES} value={values.priority} onChange={set('priority')} />

      {isEdit && <ChoiceGroup legend="Status" options={STATUSES} value={values.status} onChange={set('status')} />}

      <div>
        <Label htmlFor="tags" optional hint={`${values.tags.length}/10`}>
          Tags
        </Label>
        <TagInput
          id="tags"
          value={values.tags}
          onChange={set('tags')}
          suggestions={tagSuggestions}
          invalid={Boolean(errors.tags)}
        />
        <FieldError>{errors.tags}</FieldError>
      </div>

      <div>
        <Label htmlFor="description" hint={values.description.length > 1800 ? `${values.description.length}/2000` : null}>
          Description
        </Label>
        <textarea
          id="description"
          rows={4}
          value={values.description}
          maxLength={2000}
          placeholder="Add Description"
          onChange={(e) => set('description')(e.target.value)}
          aria-invalid={Boolean(errors.description) || undefined}
          className="h-[100px] w-full resize-none rounded-[2px] border border-field bg-white px-4 py-3 text-[14px] outline-none placeholder:text-ink/90 focus:border-primary"
        />
        <FieldError>{errors.description}</FieldError>
      </div>

      <PrimaryButton type="submit" disabled={saving} className="mt-2">
        {saving ? 'Saving…' : isEdit ? 'Save' : 'Create task'}
      </PrimaryButton>
    </form>
  );
}
