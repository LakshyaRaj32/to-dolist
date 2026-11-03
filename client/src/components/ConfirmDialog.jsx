import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';

/** A small modal asking the user to confirm a destructive action. */
export default function ConfirmDialog({ title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    // Focus "Cancel" so an accidental Enter never deletes anything.
    cancelRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onCancel();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
      <div className="animate-fade absolute inset-0 bg-[#5f5f5f]/55" onClick={onCancel} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-pop relative w-full max-w-sm bg-white p-6 shadow-xl md:rounded-[4px]"
      >
        <span className="grid size-11 place-items-center rounded-full bg-pending text-danger" aria-hidden>
          <Trash2 className="size-5" strokeWidth={1.75} />
        </span>
        <h2 id={titleId} className="mt-4 text-[17px] font-semibold">
          {title}
        </h2>
        {message && <p className="mt-2 text-[13px] leading-relaxed text-body">{message}</p>}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            className="h-11 rounded-[2px] border border-field text-[14px] font-medium transition hover:border-primary/50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-[2px] bg-danger text-[14px] font-medium text-white transition hover:bg-[#d23b40]"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
