import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

/** Bottom sheet on phones, centred dialog on tablet/desktop. */
export default function Sheet({ title, onClose, children }) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6">
      <div className="animate-fade absolute inset-0 bg-[#5f5f5f]/55" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-sheet relative max-h-[92dvh] w-full max-w-md overflow-y-auto bg-white px-6 pt-7 pb-[calc(max(1.5rem,env(safe-area-inset-bottom))_+_var(--bottom-inset))] md:max-w-lg md:rounded-[4px] md:px-8 md:pt-8 md:pb-8"
      >
        <div className="flex items-center justify-between">
          <h2 id={titleId} className="text-[17px] font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-2 grid size-9 place-items-center rounded-full text-ink transition hover:bg-black/5"
          >
            <X className="size-5" strokeWidth={1.75} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
