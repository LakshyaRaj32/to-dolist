import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CloudUpload, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../lib/auth';
import Sheet from './Sheet';
import { PrimaryButton } from './Layout';

/** Account menu: guests can save their account or log in; saved accounts can log out. */
export default function AccountSheet({ onClose }) {
  const { user, isGuest, logout } = useAuth();
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);

  const go = (path) => {
    onClose();
    navigate(path);
  };

  if (isGuest) {
    return (
      <Sheet title="Your Account" onClose={onClose}>
        <div className="mt-5 flex items-start gap-3 bg-complete p-4">
          <CloudUpload className="mt-0.5 size-5 shrink-0 text-primary" strokeWidth={1.75} />
          <p className="text-[13px] leading-relaxed text-primary-dark">
            You’re using a <b className="font-semibold">guest account</b>. Your tasks are private and saved, but only
            this device can open them. Add an email and password to keep them safe and use them anywhere.
          </p>
        </div>
        <PrimaryButton type="button" className="mt-6" onClick={() => go('/register')}>
          Save Your Account
        </PrimaryButton>
        <button
          type="button"
          onClick={() => go('/login')}
          className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-field text-[14px] font-medium transition hover:border-primary/50"
        >
          <LogIn className="size-4" /> Log in to another account
        </button>

        {confirmLeave ? (
          <div className="mt-6 border border-danger/40 p-4">
            <p className="text-[13px] text-ink">Start over? This guest account and its tasks will no longer be reachable.</p>
            <div className="mt-3 flex gap-3">
              <button type="button" onClick={() => setConfirmLeave(false)} className="h-10 flex-1 border border-field text-[13px]">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  logout();
                }}
                className="h-10 flex-1 bg-danger text-[13px] font-medium text-white"
              >
                Start over
              </button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setConfirmLeave(true)} className="mt-5 w-full text-center text-[12px] text-muted hover:text-danger">
            Start over as a new guest
          </button>
        )}
      </Sheet>
    );
  }

  return (
    <Sheet title="Your Account" onClose={onClose}>
      <div className="mt-5 flex items-center gap-3">
        <span className="grid size-12 place-items-center rounded-full bg-complete text-[17px] font-semibold text-primary">
          {user?.name?.[0]?.toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">{user?.name}</p>
          <p className="truncate text-[13px] text-body">{user?.email}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => {
          onClose();
          logout();
        }}
        className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-[2px] border border-danger text-[15px] font-medium text-danger transition hover:bg-danger/5"
      >
        <LogOut className="size-4" /> Log out
      </button>
    </Sheet>
  );
}
