import { useCallback, useMemo, useState } from 'react';

function collectErrors(schema, values) {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');
    errors[field] ??= issue.message;
  }
  return errors;
}

/**
 * Real-time form validation with a zod schema.
 * A field's error appears as soon as the user has interacted with it (or after a submit attempt)
 * and updates on every keystroke. Server-side errors can be merged in with `setServerErrors`.
 */
export function useFormValidation(schema, values) {
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [serverErrors, setServerErrors] = useState({});

  const clientErrors = useMemo(() => collectErrors(schema, values), [schema, values]);

  const errors = useMemo(() => {
    const visible = {};
    for (const [field, message] of Object.entries(clientErrors)) {
      if (submitted || touched[field]) visible[field] = message;
    }
    for (const [field, message] of Object.entries(serverErrors)) {
      if (message) visible[field] = message;
    }
    return visible;
  }, [clientErrors, serverErrors, submitted, touched]);

  const touch = useCallback((field) => {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
    setServerErrors((e) => (e[field] ? { ...e, [field]: undefined } : e));
  }, []);

  const handleSubmit = useCallback(
    (onValid) => (e) => {
      e.preventDefault();
      setSubmitted(true);
      if (Object.keys(clientErrors).length > 0) {
        // Move focus to the first invalid field once errors have rendered.
        setTimeout(() => document.querySelector('[aria-invalid="true"]')?.focus(), 0);
        return;
      }
      onValid();
    },
    [clientErrors]
  );

  return { errors, isValid: Object.keys(clientErrors).length === 0, touch, handleSubmit, setServerErrors };
}
