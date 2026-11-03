export default function Toast({ toast, onClose }) {
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-28 z-[60] flex justify-center px-6">
      <div
        key={toast.id}
        role="status"
        className="animate-pop pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-[4px] bg-ink px-4 py-3 text-[13px] text-white shadow-lg"
      >
        <span className="flex-1">{toast.message}</span>
        {toast.action && (
          <button
            type="button"
            className="font-semibold text-[#9db0ff] hover:text-white"
            onClick={() => {
              toast.action.onClick();
              onClose();
            }}
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </div>
  );
}
