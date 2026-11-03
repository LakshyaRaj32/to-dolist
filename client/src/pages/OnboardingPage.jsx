import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PrimaryButton } from '../components/Layout';
import Zigzag from '../components/Zigzag';
import { useAuth } from '../lib/auth';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, startGuest } = useAuth();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // As in the Figma, "Get Started" goes straight to Home: a private guest account is created
  // behind the scenes. Users can save it as a full account later.
  const start = async () => {
    setError(null);
    if (!isAuthenticated) {
      setStarting(true);
      try {
        await startGuest();
      } catch (err) {
        setError(err.offline ? 'You’re offline — connect to the internet to get started.' : err.message);
        setStarting(false);
        return;
      }
    }
    navigate(location.state?.from?.pathname || '/', { replace: true });
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white md:flex-row">
      <div className="relative min-h-[52dvh] flex-1 overflow-hidden bg-primary md:min-h-dvh">
        <div className="absolute -top-14 -right-14 size-[130px] rounded-full border-[22px] border-white/25 md:size-[220px] md:border-[34px]" />
        <Zigzag className="absolute top-[13%] left-0 w-[30%] max-w-[160px] text-white/20" />
        <Zigzag className="absolute right-0 bottom-[5%] w-[30%] max-w-[160px] text-white/20" />
      </div>

      <div className="flex flex-col bg-white px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:w-[46%] md:max-w-xl md:justify-center md:px-16">
        <h1 className="text-[26px] leading-tight font-semibold md:text-[34px]">Manage What To Do</h1>
        <p className="mt-4 max-w-[290px] text-[13px] leading-[1.7] text-body md:max-w-sm md:text-[15px]">
          The best way to manage what you have to do, don't forget your plans
        </p>
        {error && (
          <p role="alert" className="mt-6 bg-pending px-3 py-2 text-[12px] text-[#c02a2a]">
            {error}
          </p>
        )}
        <PrimaryButton type="button" onClick={start} disabled={starting} className={error ? 'mt-6' : 'mt-16 md:mt-12'}>
          {starting ? 'Getting ready…' : 'Get Started'}
        </PrimaryButton>
        {!isAuthenticated && (
          <p className="mt-4 text-center text-[12px] text-body">
            Already have an account?{' '}
            <Link to="/login" state={location.state} className="font-medium text-primary">
              Log in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
