import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useApp } from '../lib/store';
import { loginSchema, registerSchema } from '../lib/validation';
import { useFormValidation } from '../hooks/useFormValidation';
import { TextField } from '../components/form/fields';
import { PrimaryButton } from '../components/Layout';
import Zigzag from '../components/Zigzag';

const COPY = {
  login: {
    title: 'Welcome Back',
    subtitle: 'Log in to see your tasks and weekly progress',
    button: 'Log In',
    switchText: 'New here?',
    switchLink: 'Create an account',
    switchTo: '/register',
  },
  save: {
    title: 'Save Your Account',
    subtitle: 'Add an email and password to keep your tasks safe and use them on any device',
    button: 'Save Account',
    switchText: 'Already have an account?',
    switchLink: 'Log in',
    switchTo: '/login',
  },
  register: {
    title: 'Create Account',
    subtitle: 'Sign up to start planning your week',
    button: 'Sign Up',
    switchText: 'Already have an account?',
    switchLink: 'Log in',
    switchTo: '/login',
  },
};

/**
 * Login and sign-up screens, styled like the Figma onboarding.
 * For a guest, "sign up" saves the current guest account (keeping its tasks) instead.
 */
export default function AuthPage({ mode }) {
  const isRegister = mode === 'register';
  const { login, register, upgrade, isGuest } = useAuth();
  const copy = COPY[isRegister && isGuest ? 'save' : mode];
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(isRegister ? { name: '', email: '', password: '' } : { email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const { showToast } = useApp();
  const { errors, touch, handleSubmit, setServerErrors } = useFormValidation(
    isRegister ? registerSchema : loginSchema,
    values
  );

  const set = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    touch(field);
    setFormError(null);
  };

  const submit = handleSubmit(async () => {
    setSubmitting(true);
    setFormError(null);
    try {
      if (isRegister) await (isGuest ? upgrade(values) : register(values));
      else await login(values);
      if (isRegister && isGuest) showToast('Account saved — your tasks are safe');
      navigate(location.state?.from?.pathname || '/', { replace: true });
    } catch (err) {
      if (err.errors) setServerErrors(err.errors);
      setFormError(err.errors ? null : err.message);
      setSubmitting(false);
    }
  });

  return (
    <div className="flex min-h-dvh flex-col bg-white md:flex-row">
      <div className="relative h-[24dvh] min-h-36 overflow-hidden bg-primary md:h-auto md:min-h-dvh md:flex-1">
        <div className="absolute -top-14 -right-14 size-[130px] rounded-full border-[22px] border-white/25 md:size-[220px] md:border-[34px]" />
        <Zigzag className="absolute top-[22%] left-0 w-[26%] max-w-[160px] text-white/20 md:top-[13%]" />
        <Zigzag className="absolute right-0 bottom-[8%] hidden w-[30%] max-w-[160px] text-white/20 md:block" />
      </div>

      <main className="flex flex-1 flex-col px-6 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] md:w-[46%] md:max-w-xl md:flex-none md:justify-center md:px-16">
        {isGuest && (
          <Link to="/" className="-mt-2 mb-5 inline-flex items-center gap-1.5 self-start text-[13px] font-medium text-primary">
            <ArrowLeft className="size-4" /> Back to my tasks
          </Link>
        )}
        <h1 className="text-[26px] leading-tight font-semibold">{copy.title}</h1>
        <p className="mt-2 text-[13px] text-body">{copy.subtitle}</p>

        {isGuest && !isRegister && (
          <p className="mt-5 bg-complete px-3 py-2.5 text-[12px] leading-relaxed text-primary-dark">
            You’re using a guest account. Logging in to another account leaves this device’s guest tasks behind —{' '}
            <Link to="/register" replace className="font-semibold underline">
              save your account
            </Link>{' '}
            instead to keep them.
          </p>
        )}

        <form onSubmit={submit} noValidate className="mt-8 space-y-5">
          {isRegister && (
            <TextField
              id="name"
              label="Name"
              autoComplete="name"
              placeholder="Your name"
              value={values.name}
              onChange={set('name')}
              onBlur={() => touch('name')}
              error={errors.name}
            />
          )}
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@example.com"
            value={values.email}
            onChange={set('email')}
            onBlur={() => touch('email')}
            error={errors.email}
          />
          <div className="relative">
            <TextField
              id="password"
              label="Password"
              hint={isRegister ? `${values.password.length}/8+ characters` : null}
              type={showPassword ? 'text' : 'password'}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder={isRegister ? 'At least 8 characters' : 'Your password'}
              value={values.password}
              onChange={set('password')}
              onBlur={() => touch('password')}
              error={errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute top-[30px] right-1 grid size-9 place-items-center text-muted hover:text-ink"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {formError && (
            <p role="alert" className="bg-pending px-3 py-2 text-[12px] text-[#c02a2a]">
              {formError}
            </p>
          )}

          <PrimaryButton type="submit" disabled={submitting} className="!mt-8">
            {submitting ? 'Please wait…' : copy.button}
          </PrimaryButton>
        </form>

        <p className="mt-6 text-center text-[13px] text-body">
          {copy.switchText}{' '}
          <Link to={copy.switchTo} state={location.state} replace className="font-medium text-primary">
            {copy.switchLink}
          </Link>
        </p>
      </main>
    </div>
  );
}
