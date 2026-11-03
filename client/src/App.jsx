import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './lib/auth';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import OnboardingPage from './pages/OnboardingPage';
import SearchPage from './pages/SearchPage';
import TaskDetailPage from './pages/TaskDetailPage';
import TaskSheetPage from './pages/TaskSheetPage';

/** Needs a session (guest or full account); otherwise start at onboarding, then come back. */
function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  if (isAuthenticated) return children;
  return <Navigate to="/welcome" replace state={{ from: location }} />;
}

/** Login / save-account screens: for visitors and guests, not for saved accounts. */
function AccountScreens({ children }) {
  const { isAuthenticated, isGuest } = useAuth();
  return isAuthenticated && !isGuest ? <Navigate to="/" replace /> : children;
}

export default function App() {
  const location = useLocation();
  // The task sheet opens on top of the screen it was launched from.
  // Opened directly (e.g. a shared link), it opens on top of Home.
  const background = location.state?.background;
  const protect = (element) => <RequireAuth>{element}</RequireAuth>;

  return (
    <>
      <Routes location={background || location}>
        <Route path="/welcome" element={<OnboardingPage />} />
        <Route path="/login" element={<AccountScreens><AuthPage key="login" mode="login" /></AccountScreens>} />
        <Route path="/register" element={<AccountScreens><AuthPage key="register" mode="register" /></AccountScreens>} />
        <Route path="/" element={protect(<HomePage />)} />
        <Route path="/search" element={protect(<SearchPage />)} />
        <Route path="/tasks/new" element={protect(<HomePage />)} />
        <Route path="/tasks/:id" element={protect(<TaskDetailPage />)} />
        <Route path="/tasks/:id/edit" element={protect(<HomePage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Routes>
        <Route path="/tasks/new" element={protect(<TaskSheetPage />)} />
        <Route path="/tasks/:id/edit" element={protect(<TaskSheetPage />)} />
        <Route path="*" element={null} />
      </Routes>
    </>
  );
}
