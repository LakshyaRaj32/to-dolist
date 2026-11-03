import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function useGoBack() {
  const navigate = useNavigate();
  // When a page was opened directly (no in-app history), fall back to home.
  return () => (window.history.state?.idx > 0 ? navigate(-1) : navigate('/', { replace: true }));
}

export function BackButton() {
  const goBack = useGoBack();
  return (
    <button
      type="button"
      onClick={goBack}
      aria-label="Back"
      className="-ml-2 grid size-10 place-items-center rounded-full text-ink transition hover:bg-black/5"
    >
      <ArrowLeft className="size-[22px]" strokeWidth={1.75} />
    </button>
  );
}

export function IconButton({ label, children, className = '', ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`grid size-9 shrink-0 place-items-center rounded-full transition hover:bg-black/5 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div
      className={`size-6 animate-spin rounded-full border-2 border-track border-t-primary ${className}`}
      role="progressbar"
      aria-label="Loading"
    />
  );
}

export function PrimaryButton({ className = '', ...props }) {
  return (
    <button
      className={`h-12 w-full rounded-[2px] bg-primary text-[15px] font-medium text-white transition hover:bg-[#3a59de] active:scale-[0.99] disabled:opacity-60 ${className}`}
      {...props}
    />
  );
}
